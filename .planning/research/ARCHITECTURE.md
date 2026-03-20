# Architecture Research

**Domain:** Google and Discord OAuth integration with existing @supabase/ssr + Next.js 15 App Router auth architecture
**Researched:** 2026-03-19
**Confidence:** HIGH — Supabase PKCE/OAuth + @supabase/ssr patterns are well-established and the existing callback route already handles code exchange. Integration points verified from codebase inspection. User_metadata field names for Google confirmed from multiple community sources; Discord avatar construction is LOW confidence (field names not definitively documented in official sources).

---

## Standard Architecture

### System Overview: OAuth Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                      Browser (Client Component)                       │
│                                                                       │
│  /login or /register page                                             │
│  OAuthButtons component                                               │
│    → supabase.signInWithOAuth({ provider: 'google'|'discord',        │
│        options: { redirectTo: '/auth/callback' } })                  │
│    → browser redirects to Google/Discord consent screen              │
└──────────────────────────┬───────────────────────────────────────────┘
                            │  provider redirects back with ?code=...
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  /auth/callback/route.ts (Route Handler)              │
│                                                                       │
│  exchangeCodeForSession(code)  ← ALREADY EXISTS, unchanged           │
│    → sets cookie-based session via @supabase/ssr                     │
│    → data.session.user.user_metadata populated from provider         │
│                                                                       │
│  [NEW] detect first sign-in:                                         │
│    check data.session.user.created_at ≈ now (< 5s)                  │
│    OR check backend: GET /players/{id}/profile → 404 = new user      │
│                                                                       │
│  if new user: POST /players/sync-oauth                               │
│    { user_id, display_name, avatar_url }                             │
│                                                                       │
│  redirect to /?onboarding=1  (new)  OR  /  (returning)              │
└──────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   Supabase Auth + Database                            │
│                                                                       │
│  auth.users.user_metadata (raw_user_meta_data)                       │
│    Google:  { full_name, avatar_url, email }                         │
│    Discord: { full_name, avatar_url, custom_claims.global_name }     │
│                                                                       │
│  Database trigger on_auth_user_created:                              │
│    → auto-creates player record in backend DB (already exists)       │
│    → uses new.raw_user_meta_data->>'name' for username               │
│    [RISK: trigger may run before metadata is available]              │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `OAuthButtons` (new) | Render Google + Discord sign-in buttons; call `signInWithOAuth` on click | Client Component; one button per provider; no form submission |
| `/auth/callback/route.ts` | Exchange OAuth code for session; detect new user; trigger profile sync | **Already exists** — add new-user detection + sync after `exchangeCodeForSession` |
| `src/actions/auth.ts` | Server actions for signUp/signIn — no changes needed | Email/password path unchanged |
| `/login/page.tsx` | Email/password form + OAuth buttons | Add `<OAuthButtons />` below the form |
| `/register/page.tsx` | Registration form + OAuth buttons | Add `<OAuthButtons />` below the form |
| `src/lib/supabase/client.ts` | Browser Supabase client (singleton) | **Unchanged** — `signInWithOAuth` called on this client |

---

## Recommended Project Structure

```
src/
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # MODIFIED: add new-user detection + profile sync
│   ├── login/
│   │   ├── page.tsx              # MODIFIED: add <OAuthButtons />
│   │   └── auth.module.css       # MODIFIED: .divider, .socialButtons already exist
│   └── register/
│       └── page.tsx              # MODIFIED: add <OAuthButtons />
├── components/
│   └── OAuthButtons.tsx          # NEW: Google + Discord buttons
└── actions/
    └── auth.ts                   # UNCHANGED
```

### Structure Rationale

- **`OAuthButtons` in `src/components/`:** Shared between login and register pages. A single component eliminates duplication and ensures both pages stay in sync.
- **Callback modification over new route:** The existing `/auth/callback/route.ts` already handles `exchangeCodeForSession` correctly. Adding OAuth profile sync here is the minimal-change approach — no new route, no new surface area.
- **No new server actions for OAuth:** `signInWithOAuth` must be called on the browser Supabase client because it initiates a browser redirect. Server actions cannot redirect the browser to a third-party OAuth consent screen. This means OAuth initiation lives in Client Components only.

---

## Architectural Patterns

### Pattern 1: OAuth Initiation from a Client Component

**What:** `signInWithOAuth` redirects the browser to the provider consent screen. It must be called from a Client Component with access to `window.location.origin` for the `redirectTo` URL.

**When to use:** Always for Google/Discord OAuth initiation. Cannot be done in a Server Action or Route Handler (they cannot issue browser redirects to external URLs).

**Trade-offs:** The `redirectTo` URL must be in Supabase's allowed redirect list in the dashboard. Localhost and production URLs are separate entries.

**Example:**
```typescript
"use client";
import { createClient } from "@/lib/supabase/client";

export function OAuthButtons() {
  const handleOAuth = async (provider: "google" | "discord") => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // signInWithOAuth redirects the browser — no further client code runs
  };

  return (
    <div>
      <button onClick={() => handleOAuth("google")}>Sign in with Google</button>
      <button onClick={() => handleOAuth("discord")}>Sign in with Discord</button>
    </div>
  );
}
```

### Pattern 2: First-Sign-In Detection in the Callback Route

**What:** After `exchangeCodeForSession`, check whether this is the user's first time signing in. The cleanest approach is to compare `user.created_at` to the current timestamp: if the user was created within the last 5 seconds, they are new. An alternative is to check the backend player profile endpoint — a 404 means the player record does not yet exist.

**When to use:** In `/auth/callback/route.ts` immediately after a successful `exchangeCodeForSession`.

**Trade-offs:**
- `created_at` timestamp comparison is simple but relies on clock tolerance. 5 seconds is a safe window.
- Backend 404 check is more reliable but adds a network round-trip in the callback path. Worth it only if the trigger timing is unreliable.
- The existing database trigger already creates a player record on `auth.users` insert. If the trigger runs fast (synchronous, same transaction), the backend 404 approach may always return 200 for new users by the time the callback fires. Prefer `created_at` comparison.

**Example:**
```typescript
// In /auth/callback/route.ts, after exchangeCodeForSession succeeds:
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;

const isNewUser = user &&
  (Date.now() - new Date(user.created_at).getTime()) < 5000;

if (isNewUser && user) {
  const metadata = user.user_metadata;
  // Google provides: full_name, avatar_url (or picture)
  // Discord provides: full_name, avatar_url
  const displayName = metadata.full_name ?? metadata.name ?? null;
  const avatarUrl = metadata.avatar_url ?? metadata.picture ?? null;

  // POST to backend to set profile fields from OAuth provider
  // Backend updates name and avatar_url on the player record
  if (displayName || avatarUrl) {
    await fetch(`${backendUrl}/players/${user.id}/sync-oauth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName, avatar_url: avatarUrl }),
    });
  }
}

const safeRedirect = isNewUser ? "/?onboarding=1" : (redirectTo ?? "/");
return NextResponse.redirect(new URL(safeRedirect, requestUrl.origin));
```

### Pattern 3: Provider Metadata Field Access

**What:** Supabase populates `user.user_metadata` from the OAuth provider's identity token. Field names differ slightly per provider.

**When to use:** Anywhere that needs to read the user's name or avatar from their provider profile.

**Provider field map (MEDIUM confidence — from community sources):**

| Field | Google | Discord |
|-------|--------|---------|
| Display name | `full_name` | `full_name` |
| Avatar URL | `avatar_url` (sometimes `picture`) | `avatar_url` |
| Provider username | n/a | `custom_claims.global_name` |

**Safe access pattern:**
```typescript
const displayName =
  user.user_metadata?.full_name ??
  user.user_metadata?.name ??
  null;

const avatarUrl =
  user.user_metadata?.avatar_url ??
  user.user_metadata?.picture ??
  null;
```

**Note on Discord avatar_url:** Supabase constructs the Discord CDN URL from Discord's `avatar` hash and `id`. The resulting `avatar_url` in `user_metadata` should be a complete URL. However, this is not definitively documented — treat as LOW confidence and test against a real Discord OAuth response before shipping.

### Pattern 4: Returning Users — No Profile Sync

**What:** When an existing user signs in via OAuth (not their first sign-in), the callback should not overwrite their profile. Player names and avatars may have been customised since initial OAuth sign-in.

**When to use:** Enforce in callback: only sync profile data when `isNewUser === true`.

**Trade-offs:** If a user wants to re-sync their avatar from their provider later, that is a separate feature (profile settings page) — out of scope for v1.4.

---

## Data Flow

### New User OAuth Sign-In

```
User clicks "Sign in with Google"
    ↓
OAuthButtons.handleOAuth("google")
    ↓
supabase.signInWithOAuth({ provider: "google", redirectTo: "/auth/callback" })
    ↓
Browser redirects to Google consent screen
    ↓
Google redirects to /auth/callback?code=ABC...
    ↓
route.ts: exchangeCodeForSession("ABC")
    → Supabase exchanges code for access + refresh tokens
    → sets cookie-based session (existing @supabase/ssr mechanism)
    → user.user_metadata populated from Google: { full_name, avatar_url }
    ↓
isNewUser check: user.created_at within last 5 seconds → true
    ↓
POST /players/{id}/sync-oauth  { display_name, avatar_url }
    → backend updates player record name + avatar
    ↓
redirect → /?onboarding=1
    ↓
useUser.ts onAuthStateChange fires SIGNED_IN
    → router.refresh() (existing behaviour)
    → user sees home page with onboarding modal
```

### Returning User OAuth Sign-In

```
User clicks "Sign in with Google"
    ↓
(same OAuth redirect flow)
    ↓
route.ts: exchangeCodeForSession succeeds
    ↓
isNewUser check: false (user.created_at > 5s ago)
    ↓
No profile sync
    ↓
redirect → / (or redirect_to param)
    ↓
onAuthStateChange fires SIGNED_IN → router.refresh()
```

### Existing Email/Password Auth (Unchanged)

```
LoginPage.handleSubmit
    ↓
supabase.signInWithPassword({ email, password })
    ↓
onAuthStateChange fires SIGNED_IN → router.push("/")
```

---

## New vs Modified Components

### New Files

| File | Purpose |
|------|---------|
| `src/components/OAuthButtons.tsx` | Google + Discord OAuth buttons; shared between login and register |

### Modified Files

| File | What Changes |
|------|-------------|
| `src/app/auth/callback/route.ts` | Add new-user detection + profile sync after `exchangeCodeForSession` |
| `src/app/login/page.tsx` | Render `<OAuthButtons />` below the email/password form; add a divider |
| `src/app/register/page.tsx` | Render `<OAuthButtons />` below the registration form; add a divider |

### Unchanged Files

| File | Why Unchanged |
|------|---------------|
| `src/lib/supabase/client.ts` | OAuth uses the same browser singleton |
| `src/lib/supabase/server.ts` | Callback route already uses this for `exchangeCodeForSession` |
| `src/hooks/useUser.ts` | `onAuthStateChange` picks up OAuth SIGNED_IN event automatically |
| `src/actions/auth.ts` | Email/password signUp and signIn remain separate paths |
| `src/middleware.ts` | Session refresh via @supabase/ssr is provider-agnostic |

---

## Build Order (Dependency-Aware)

```
1. Supabase dashboard config (prerequisite — not code)
   - Enable Google provider: add Client ID + Secret from Google Cloud Console
   - Enable Discord provider: add Client ID + Secret from Discord Developer Portal
   - Add /auth/callback to allowed redirect URLs (localhost + production)

2. OAuthButtons component  (src/components/OAuthButtons.tsx)
   - No dependencies; can be built and tested in isolation

3. Modify /login/page.tsx and /register/page.tsx
   - Add <OAuthButtons /> and visual divider
   - Depends on: OAuthButtons component
   - auth.module.css already has .divider, .socialButtons, .socialButton classes

4. Modify /auth/callback/route.ts
   - Add new-user detection and profile sync
   - Depends on: backend /players/{id}/sync-oauth endpoint existing
   - If endpoint does not exist yet, stub with a no-op and ship endpoint separately

5. Backend: /players/{id}/sync-oauth endpoint (backend service — separate work)
   - Accepts POST with display_name + avatar_url
   - Updates player record; idempotent

6. Verify end-to-end flow (Google first, then Discord)
```

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google OAuth | Supabase handles provider redirect and token exchange; app calls `signInWithOAuth({ provider: "google" })` | Requires Google Cloud Console project, OAuth 2.0 credentials, and authorized redirect URI pointing to Supabase |
| Discord OAuth | Same pattern as Google | Requires Discord Developer Portal application with OAuth2 redirect URI pointing to Supabase |
| Supabase Auth | `signInWithOAuth` on browser client; `exchangeCodeForSession` in callback route (already exists) | @supabase/ssr PKCE flow is default — no configuration change needed |
| Backend (lobby_manager) | POST to `/players/{id}/sync-oauth` from callback route | New endpoint needed; called once per new OAuth user |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `OAuthButtons` → Supabase client | Direct import of `createClient()` from `@/lib/supabase/client` | Same singleton used everywhere else — no new client setup |
| `callback/route.ts` → backend | `fetch` to `NEXT_PUBLIC_LOBBY_MANAGER_URL` | Same pattern as `/api/admin/[...path]` proxy routes |
| OAuth session → `useUser.ts` | Supabase `onAuthStateChange` fires `SIGNED_IN` automatically after cookie session is set | No changes to `useUser.ts` needed |
| OAuth session → Sentry | `SentryUserSync` already subscribed to `onAuthStateChange` | OAuth SIGNED_IN fires same event as email/password — Sentry user context set automatically |

---

## Anti-Patterns

### Anti-Pattern 1: Calling signInWithOAuth in a Server Action

**What people do:** Wrap the OAuth initiation in a `"use server"` action to match the pattern of `signUp` and `signIn`.

**Why it's wrong:** Server Actions run on the server and cannot redirect the browser to a third-party OAuth consent screen. `signInWithOAuth` returns a URL for the browser to navigate to — the browser must execute this redirect, not the server.

**Do this instead:** Keep `signInWithOAuth` in a Client Component with `"use client"`. Use the returned `data.url` directly — Supabase handles the redirect automatically when `skipBrowserRedirect` is not set.

### Anti-Pattern 2: Syncing Profile on Every OAuth Sign-In

**What people do:** Always POST to the profile sync endpoint after every OAuth callback, overwriting whatever the user has set.

**Why it's wrong:** Players may have changed their display name or avatar after initial sign-up. Overwriting on every sign-in destroys those customisations.

**Do this instead:** Only sync on first sign-in (`isNewUser === true`). A separate "sync from provider" action in profile settings is the right place for voluntary re-sync.

### Anti-Pattern 3: Reading provider metadata before the session is confirmed

**What people do:** Access `user.user_metadata` from the redirect URL parameters or from the client before the session cookie is set.

**Why it's wrong:** `user_metadata` is populated by Supabase after `exchangeCodeForSession` completes. Reading it before this point gives empty or stale data.

**Do this instead:** Always read `user_metadata` from the session returned by (or fetched after) `exchangeCodeForSession` in the callback route handler.

### Anti-Pattern 4: Hard-coding the redirectTo origin

**What people do:** `redirectTo: "https://myapp.com/auth/callback"` — hard-coded production URL in the component.

**Why it's wrong:** Breaks local development and staging environments. Also breaks if the site is accessed from a non-canonical URL.

**Do this instead:** `redirectTo: \`${window.location.origin}/auth/callback\`` — always derives the origin from the current browser context.

---

## Confidence Assessment

| Claim | Confidence | Basis |
|-------|------------|-------|
| signInWithOAuth must be called from a Client Component | HIGH | SDK design — requires browser redirect; confirmed in multiple official Supabase docs and community sources |
| Existing /auth/callback/route.ts handles OAuth unchanged | HIGH | Codebase inspection — exchangeCodeForSession is provider-agnostic |
| @supabase/ssr PKCE flow is default | HIGH | @supabase/ssr documentation; confirmed in WebSearch results |
| Google user_metadata fields: full_name, avatar_url | MEDIUM | Multiple community sources agree; official docs list general field names without provider-specific detail |
| Discord user_metadata fields: full_name, avatar_url | LOW | Community sources confirm avatar_url; field names not definitively in official Supabase Discord docs |
| created_at timestamp for new-user detection | MEDIUM | Common pattern in community; timing window (5s) is heuristic — alternative is backend 404 check |
| Database trigger creates player record on auth.users insert | HIGH | Confirmed in src/actions/auth.ts comment: "database trigger auto-creates player record" |
| useUser.ts onAuthStateChange picks up OAuth SIGNED_IN | HIGH | Supabase fires SIGNED_IN for all auth methods including OAuth — confirmed by event contract |

---

## Sources

- Supabase signInWithOAuth reference: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
- Supabase server-side Next.js guide: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase managing user data: https://supabase.com/docs/guides/auth/managing-user-data
- Supabase Login with Discord: https://supabase.com/docs/guides/auth/social-login/auth-discord
- Supabase Login with Google: https://supabase.com/docs/guides/auth/social-login/auth-google
- Community: Discord avatar_url in user_metadata: https://github.com/orgs/supabase/discussions/3334
- Community: Google full_name, avatar_url in user_metadata: https://github.com/orgs/supabase/discussions/5666
- Community: Database trigger for profile sync: https://github.com/orgs/supabase/discussions/306
- Codebase inspection: src/app/auth/callback/route.ts, src/actions/auth.ts, src/app/login/page.tsx, src/app/register/page.tsx, src/hooks/useUser.ts, src/lib/supabase/client.ts, src/lib/supabase/server.ts, src/app/login/auth.module.css

---

*Architecture research for: Google + Discord OAuth integration with @supabase/ssr in Next.js 15 App Router*
*Researched: 2026-03-19*
