# Phase 16: OAuth UI and Profile Sync - Research

**Researched:** 2026-03-26
**Domain:** Supabase OAuth sign-in UI, Next.js Image remotePatterns, first-sign-in profile sync
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SETUP-05 | `next.config.mjs` includes `remotePatterns` for Google and Discord avatar CDN hostnames | Next.js Image `remotePatterns` API documented; hostnames for both CDNs identified |
| OAUTH-01 | User can sign in or register with Google account from /auth/login and /auth/register | `supabase.auth.signInWithOAuth({ provider: 'google' })` pattern; Google button deferred (SETUP-01 pending) — render as hidden/disabled |
| OAUTH-02 | User can sign in or register with Discord account from /auth/login and /auth/register | Discord button already present in both pages (delivered Phase 15 P02) — verify it works end-to-end |
| OAUTH-03 | Email/password login and registration remain available alongside OAuth options | Already the case — both pages have Discord button above email form; no removal needed |
| PROF-01 | On first OAuth sign-in, player's display name pre-populated from provider | DB trigger (Phase 15 SETUP-04) already writes display name from `user_name` (Discord) / `name` (Google) to `public.players` on INSERT — no frontend sync needed for new users |
| PROF-02 | On first OAuth sign-in, player's avatar set from provider profile picture, renders via Next.js Image | DB trigger writes `avatar_url` from provider to `public.players`; profile page hero currently renders initials-only — needs Image component added |
| PROF-03 | Profile sync fires only on first sign-in — returning users retain customizations | Trigger fires on INSERT only (once per user, not on subsequent logins) — returning users are safe by design |
</phase_requirements>

---

## Summary

Phase 16 is a frontend-only phase. All backend infrastructure (DB trigger, Discord OAuth provider, identity linking) was completed in Phase 15. The trigger already handles PROF-01 and PROF-03 by design: it runs on `auth.users` INSERT (once per account), so display name and avatar are seeded at account creation and never overwritten by subsequent logins.

The primary work is three tasks. First, add `remotePatterns` to `next.config.mjs` for the Discord CDN hostname (`cdn.discordapp.com`) so the Next.js Image optimizer can serve Discord avatar URLs — without this, `<Image>` will throw a configuration error. Second, update the profile page hero section to render the avatar URL from the player profile using Next.js `<Image>` instead of the current initials-only div. Third, confirm the Discord button on both `/auth/login` and `/auth/register` is correctly wired (it already exists per Phase 15 P02) and add a hidden/disabled Google button placeholder for OAUTH-01, which is blocked on SETUP-01.

The key constraint from STATE.md is that Google OAuth (SETUP-01) remains pending and the Google button must NOT be rendered as active — Discord is the sole active provider going into this phase.

**Primary recommendation:** Three targeted changes — (1) `next.config.mjs` remotePatterns, (2) profile page avatar display, (3) verify Discord buttons + add disabled Google placeholder. No new npm packages, no backend changes.

---

## Current State (What Phase 15 Delivered)

This is critical context — more has already been built than the phase description implies:

| Item | Status | Evidence |
|------|--------|----------|
| Discord button on `/login` | **Already present** | `src/app/login/page.tsx` lines 118-141 |
| Discord button on `/register` | **Already present** | `src/app/register/page.tsx` lines 209-233 |
| `signInWithOAuth({ provider: 'discord' })` wired on both pages | **Already present** | Both pages call `supabase.auth.signInWithOAuth` with `redirectTo: window.location.origin + '/auth/callback'` |
| `/auth/callback/route.ts` handles OAuth code exchange | **Already present** | `exchangeCodeForSession(code)` — no changes needed |
| DB trigger writes `user_name` + `avatar_url` for Discord | **Already applied** | Phase 15 P01/P02 — PROF-01/PROF-03 handled at DB level |
| `remotePatterns` for avatar CDNs | **Missing** | `next.config.mjs` has no `images` config at all |
| Profile page renders avatar image | **Missing** | `profile/page.tsx` renders initials-only in hero |
| Google button | **Not rendered** | Google OAuth (SETUP-01) deferred — no button exists |

---

## Standard Stack

### Core (already installed — no new packages needed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@supabase/supabase-js` | ^2.87.1 | OAuth trigger + session | Pin — do NOT upgrade to >=2.91.0 |
| `@supabase/ssr` | ^0.8.0 | SSR session management | No changes needed |
| `next` | ^16.0.10 | Image component + remotePatterns config | `next/image` used for avatar rendering |

No new packages required for this phase.

---

## Architecture Patterns

### Pattern 1: Next.js Image remotePatterns

**What:** `next.config.mjs` must declare allowed external image hostnames for the built-in Image optimizer. Without this, `<Image src="https://cdn.discordapp.com/...">` throws at build or runtime.

**When to use:** Any time `next/image` renders a URL from an external domain.

**The `remotePatterns` format (Next.js 13+):**
```javascript
// Source: https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/avatars/**',
      },
      // Google avatars (for when SETUP-01 is completed)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};
```

**Discord CDN hostname:** `cdn.discordapp.com` — confirmed from Discord CDN docs and Supabase auth test fixtures.
**Google avatar hostname:** `lh3.googleusercontent.com` — Google's CDN for profile images. Add now so the config is ready when SETUP-01 completes; no runtime effect until Google OAuth is active.

**Confidence:** HIGH — Next.js official docs; Discord CDN hostname is publicly known and consistent.

### Pattern 2: Avatar URL from Player Profile

**What:** The `PlayerProfileStats` type in `src/lib/api/players.ts` does NOT currently include `avatar_url`. The profile page's hero section renders initials only. To satisfy PROF-02, the profile API response must include `avatar_url`, and the profile page must render it.

**Current profile hero (initials-only):**
```tsx
// src/app/profile/page.tsx — current state
<div className={styles.avatar}>
  {(profile.name || "?")[0].toUpperCase()}
</div>
```

**Target pattern (avatar with fallback):**
```tsx
// After Phase 16
import Image from "next/image";

{profile.avatar_url ? (
  <Image
    src={profile.avatar_url}
    alt={profile.name}
    width={80}
    height={80}
    className={styles.avatar}
  />
) : (
  <div className={styles.avatar}>
    {(profile.name || "?")[0].toUpperCase()}
  </div>
)}
```

**Backend dependency:** The `/players/{id}/profile` backend response must include `avatar_url`. If the player_manager API does not return it yet, the frontend type addition alone is not enough — the backend must be checked. STATE.md notes that `/players/{id}/sync-oauth` does not exist; the profile endpoint may or may not return `avatar_url`. This must be verified before implementing PROF-02 display.

**Confidence:** HIGH for the frontend pattern; MEDIUM for backend availability of `avatar_url` in the profile response — requires checking the actual API response.

### Pattern 3: Google Button as Disabled Placeholder

**What:** OAUTH-01 requires a Google button on both pages, but SETUP-01 (Google OAuth app registration) is pending. The button must exist but must not be clickable.

**Pattern:**
```tsx
// Disabled Google button — present in DOM, not interactive
<button
  type="button"
  className={`${styles.socialButton} ${styles.googleButton}`}
  disabled
  title="Google sign-in coming soon"
>
  {/* Google icon SVG */}
  Sign in with Google
</button>
```

Adding `.googleButton` to `auth.module.css` with Google brand colors (`#4285F4` background or white with colored logo). The `disabled` attribute prevents click. A visual "coming soon" indicator (opacity, `not-allowed` cursor) is appropriate.

**Confidence:** HIGH — standard HTML disabled button pattern.

### Recommended Project Structure (no changes needed)

The existing structure is correct. No new directories or route files are needed.

```
src/
  app/
    login/
      page.tsx         # Add disabled Google button; Discord button already present
      auth.module.css  # Add .googleButton styles; add .socialButton:disabled styles
    register/
      page.tsx         # Same — add disabled Google button
    profile/
      page.tsx         # Add avatar_url field display with Image component
  lib/
    api/
      players.ts       # Add avatar_url to PlayerProfileStats type
next.config.mjs        # Add images.remotePatterns
```

### Anti-Patterns to Avoid

- **Calling `signInWithOAuth` for Google before SETUP-01 completes:** The Google OAuth provider is not configured in Supabase yet — clicking an active Google button will produce a Supabase error. The button must remain disabled.
- **Using `<img>` instead of `<Image>` for avatars:** Requirement explicitly states "renders correctly via Next.js Image component." Use `next/image`.
- **Adding `avatar_url` to the frontend type without verifying backend response:** If the player_manager API doesn't return it, the field will be undefined/null silently. Check the actual API before wiring UI.
- **Implementing a separate sync-oauth API call on sign-in:** The DB trigger already handles first-sign-in sync (PROF-01, PROF-03) at the database level. Do not attempt to replicate this in frontend code. The only frontend "profile sync" needed is displaying the avatar_url that was already set by the trigger.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth redirect flow | Custom OAuth redirect handler | `supabase.auth.signInWithOAuth()` | Already implemented on both pages |
| First-sign-in profile seeding | Frontend code to detect first sign-in and call a sync endpoint | DB trigger (`handle_new_user`) | Trigger already runs on INSERT — cannot run twice; no frontend logic needed |
| Avatar CDN proxy | Custom Next.js API route to proxy avatar images | `next/image` with `remotePatterns` | Next.js Image optimizer handles optimization, CDN caching, lazy loading |
| "Is this first sign-in" detection | Comparing `created_at` to `last_sign_in_at` or counting identities | DB trigger design | The trigger only fires on `auth.users` INSERT — inherently once per account |

---

## Common Pitfalls

### Pitfall 1: Missing `remotePatterns` Crashes `<Image>`
**What goes wrong:** `next/image` component throws a runtime error: "Invalid src prop — hostname is not configured under images in next.config.js"
**Why it happens:** Next.js Image optimizer blocks external hostnames by default for security.
**How to avoid:** Add `remotePatterns` for `cdn.discordapp.com` (and `lh3.googleusercontent.com` for future Google) BEFORE wiring the `<Image>` component for avatar display.
**Warning signs:** Build succeeds but runtime throws "Invalid src prop" when any Discord user's profile page loads.

### Pitfall 2: Google Button Active Without SETUP-01
**What goes wrong:** User clicks Google sign-in → Supabase returns an error (provider not enabled) → confusing error message displayed.
**Why it happens:** SETUP-01 was deliberately deferred; Google provider is not enabled in Supabase.
**How to avoid:** Keep Google button `disabled` attribute. Do not wire `onClick` to `signInWithOAuth({ provider: 'google' })`.

### Pitfall 3: `avatar_url` Not in Backend Profile Response
**What goes wrong:** `PlayerProfileStats` type has `avatar_url`, but the field is undefined at runtime because the player_manager `/profile` endpoint doesn't return it.
**Why it happens:** The backend profile endpoint was built before avatar_url was relevant; the field may not be included in the SELECT.
**How to avoid:** Test the actual API response `GET /api/players/{id}/profile` and verify `avatar_url` is present before finalizing the UI. If absent, the player's profile display falls back to initials — acceptable but means PROF-02 is blocked on a backend fix.
**Warning signs:** `profile.avatar_url` is always `undefined` even for users who signed in via Discord.

### Pitfall 4: Auth Module CSS Shared Between Login and Register
**What goes wrong:** Adding `.googleButton` styles or modifying `.socialButton` in `auth.module.css` affects both pages, since `register/page.tsx` imports `"../login/auth.module.css"`.
**Why it happens:** Both pages share the same CSS module file (the import path confirms this).
**How to avoid:** This is intentional — add new styles to `auth.module.css` once; they apply to both pages. Do not create a duplicate CSS file.

### Pitfall 5: Supabase `@supabase/supabase-js` Upgrade
**What goes wrong:** Upgrading to >=2.91.0 changes SIGNED_IN event deferral behavior, breaking the `useUser` hook.
**Why it happens:** Breaking change at 2.91.0. `useUser.ts` explicitly notes this with a comment.
**How to avoid:** Do not upgrade `@supabase/supabase-js` during this phase. Stays at ^2.87.1.

---

## Code Examples

### SETUP-05: `next.config.mjs` remotePatterns Addition
```javascript
// Source: https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
// Add inside nextConfig object, alongside existing `output: 'standalone'`
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};
```

### PROF-02: Profile Avatar Display
```tsx
// Source: https://nextjs.org/docs/app/api-reference/components/image
// In src/app/profile/page.tsx hero section — replace initials div
import Image from "next/image";

// Conditional: render Image if avatar_url exists, else fallback to initials
{profile.avatar_url ? (
  <Image
    src={profile.avatar_url}
    alt={profile.name}
    width={80}
    height={80}
    className={styles.avatar}
    unoptimized={false}
  />
) : (
  <div className={styles.avatar}>
    {(profile.name || "?")[0].toUpperCase()}
  </div>
)}
```

### OAUTH-01/OAUTH-02: Disabled Google Button Pattern
```tsx
// In login/page.tsx and register/page.tsx — add after Discord button
<button
  type="button"
  className={`${styles.socialButton} ${styles.googleButton}`}
  disabled
  title="Google sign-in coming soon"
>
  {/* Google 'G' SVG icon */}
  Sign in with Google
</button>
```

### Type Addition for avatar_url
```typescript
// In src/lib/api/players.ts — add to PlayerProfileStats type
export type PlayerProfileStats = {
  // Basic Info
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;  // ADD THIS
  created_at: string;
  last_seen_active_at: string | null;
  // ... rest unchanged
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `images.domains` array in next.config | `images.remotePatterns` with protocol/pathname | Next.js 13+ | `domains` is deprecated; use `remotePatterns` |
| `<img>` for external images | `next/image` with `remotePatterns` | Next.js 10+ | Automatic optimization, lazy loading, format conversion |

**Deprecated/outdated:**
- `images.domains`: Works but deprecated in Next.js 13+. Do not use — use `remotePatterns` instead.

---

## Open Questions

1. **Does `/players/{id}/profile` return `avatar_url`?**
   - What we know: `PlayerProfileStats` type in `src/lib/api/players.ts` does not currently include `avatar_url`. The DB trigger writes to `public.players.avatar_url`.
   - What's unclear: Whether the player_manager service includes `avatar_url` in its `GET /players/{id}/profile` response body.
   - Recommendation: The first task of the PROF-02 plan should be to hit `GET /api/players/{id}/profile` for a Discord-authenticated user and inspect the response. If `avatar_url` is absent, a backend change is needed (out of scope for this frontend phase) and the avatar display should gracefully fall back to initials.

2. **Exact Discord CDN URL pattern for avatars**
   - What we know: Discord avatar URLs stored by Supabase trigger look like `https://cdn.discordapp.com/avatars/{user_id}/{hash}.png` or `.webp`.
   - What's unclear: Whether the `pathname` pattern `/avatars/**` covers all variants (animated `.gif`, CDN format changes).
   - Recommendation: Use `pathname: '/avatars/**'` which matches all paths under `/avatars/`. This covers `.png`, `.webp`, and `.gif` formats.

3. **`width` and `height` for avatar Image component**
   - What we know: The profile hero div currently uses CSS to size the initials avatar (likely via `.avatar` class in `page.module.css`).
   - What's unclear: The exact px dimensions of the avatar circle in the current CSS.
   - Recommendation: Read `profile/page.module.css` `.avatar` class dimensions before implementing to pass correct `width`/`height` to `<Image>`. Alternatively use `fill` layout with a positioned container.

---

## Validation Architecture

> `workflow.nyquist_validation` key is absent from `.planning/config.json` — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test runner configured in this repository |
| Config file | None |
| Quick run command | n/a — manual verification only |
| Full suite command | n/a |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETUP-05 | `next.config.mjs` has remotePatterns for Discord + Google CDNs | manual | `npm run build` — build fails if syntax error in config | N/A |
| OAUTH-01 | Google button visible but disabled on /login and /register | manual (browser) | — | N/A |
| OAUTH-02 | Discord button on /login redirects to Discord and returns authenticated | manual (browser) | — | N/A |
| OAUTH-03 | Email/password form continues to work on both pages | manual (browser) | — | N/A |
| PROF-01 | New Discord account has display name pre-populated from Discord `user_name` | manual (new account test) | — | N/A |
| PROF-02 | New Discord account's avatar renders as `<Image>` from `cdn.discordapp.com` URL on /profile | manual (browser, new account) | — | N/A |
| PROF-03 | Returning Discord user's profile name/avatar unchanged after second sign-in | manual (sign-in twice test) | — | N/A |

**All requirements are manual-only** because:
- OAUTH-02, PROF-01, PROF-02, PROF-03 require live OAuth flows with real provider credentials and cannot be automated without mocking Supabase auth.
- SETUP-05 is a config change verifiable by build success + runtime Image rendering.
- OAUTH-03 is a regression check on existing email/password flow.

### Wave 0 Gaps
None — no automated test framework additions needed. All acceptance is manual.

---

## Sources

### Primary (HIGH confidence)
- [Next.js Image remotePatterns](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns) — `remotePatterns` format, `protocol`/`hostname`/`pathname` structure, deprecation of `domains`
- `src/app/login/page.tsx` (local file, inspected) — Discord button already present, `signInWithOAuth` wired
- `src/app/register/page.tsx` (local file, inspected) — Discord button already present, `signInWithOAuth` wired
- `src/app/auth/callback/route.ts` (local file, inspected) — `exchangeCodeForSession` already handles OAuth return
- `.planning/phases/15-provider-infrastructure/15-03-SUMMARY.md` (local file) — Discord `user_name` + `avatar_url` confirmed from live response; trigger live and working
- `.planning/STATE.md` (local file) — Google OAuth (SETUP-01) deferred; Google button must be disabled; no sync-oauth endpoint

### Secondary (MEDIUM confidence)
- Discord CDN hostname `cdn.discordapp.com` — publicly known from Discord docs; consistent with Supabase-stored `avatar_url` URLs from OAuth responses
- Google avatar hostname `lh3.googleusercontent.com` — widely documented as Google's profile image CDN; may have additional sub-domains

### Tertiary (LOW confidence)
- Whether `/players/{id}/profile` backend endpoint returns `avatar_url` — not verified; requires runtime check against actual API response

---

## Metadata

**Confidence breakdown:**
- OAuth button state (Discord active, Google disabled): HIGH — confirmed from source files + STATE.md decisions
- `remotePatterns` pattern: HIGH — official Next.js docs
- First-sign-in sync (PROF-01, PROF-03): HIGH — DB trigger confirmed live from Phase 15
- Avatar display in profile (PROF-02): HIGH for frontend pattern; MEDIUM for backend response including `avatar_url`
- Discord CDN hostname: HIGH — publicly documented

**Research date:** 2026-03-26
**Valid until:** 2026-06-26 (stable APIs; Discord CDN hostnames change rarely)
