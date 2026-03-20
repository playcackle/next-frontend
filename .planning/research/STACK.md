# Stack Research

**Domain:** Google and Discord OAuth for Next.js 15 + @supabase/ssr (existing email/password app)
**Researched:** 2026-03-19
**Confidence:** HIGH — OAuth flow is well-documented in Supabase official docs. Verified against current package versions in package.json. Key pitfall around metadata fields flagged at MEDIUM confidence (provider field names vary and Supabase docs are sparse on exact shapes).

---

## Summary

Adding Google and Discord OAuth to this app requires **zero new npm packages**. Both providers use Supabase's built-in `signInWithOAuth` method, which is part of `@supabase/supabase-js` (already installed at `^2.87.1`). The existing `/auth/callback/route.ts` already implements `exchangeCodeForSession` — the exact PKCE handler OAuth needs. The entire implementation is:

1. Supabase dashboard: enable Google and Discord providers with client credentials.
2. Google Cloud Console and Discord Developer Portal: register OAuth apps and add Supabase's callback URL.
3. Frontend: add OAuth buttons to login and register pages that call `supabase.auth.signInWithOAuth({ provider: 'google' | 'discord', options: { redirectTo } })`.
4. Profile auto-fill: update the existing DB trigger (or add post-OAuth logic) to read `full_name`/`user_name` and `avatar_url` from `user_metadata` on first sign-in.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@supabase/supabase-js` | `^2.87.1` (already installed) | `signInWithOAuth`, `getUser`, `onAuthStateChange` | The `signInWithOAuth` method is part of this package. No additional OAuth library needed. Supabase handles PKCE code challenge generation, token exchange, and session storage automatically when used with `@supabase/ssr`. |
| `@supabase/ssr` | `^0.8.0` (already installed) | Cookie-based session persistence for Next.js App Router | The browser client created by `createBrowserClient` initiates the PKCE flow. The server client handles `exchangeCodeForSession` in the callback route. Both are already wired correctly in `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`. No changes to these files are needed. |

No new npm packages are required for OAuth itself.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | All OAuth capability is in already-installed packages. |

### External Services to Configure

| Service | What To Do | Where |
|---------|-----------|-------|
| Supabase Dashboard | Enable Google provider: paste Client ID + Secret. Enable Discord provider: paste Client ID + Secret. | Authentication > Providers > Google / Discord |
| Supabase Dashboard | Add allowed redirect URLs for local and production. Wildcard pattern recommended for dev (`http://localhost:3000/**`), exact URL for production (`https://yourdomain.com/auth/callback`). | Authentication > URL Configuration > Redirect URLs |
| Google Cloud Console | Create OAuth 2.0 Web Application client. Add Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`. Copy Client ID and Secret to Supabase dashboard. | console.cloud.google.com > APIs & Services > Credentials |
| Discord Developer Portal | Create Application. Under OAuth2, add redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`. Copy Client ID and Secret to Supabase dashboard. | discord.com/developers/applications |

---

## Installation

```bash
# No new packages to install.
# Verify existing packages are at adequate versions:
# @supabase/supabase-js ^2.87.1 — already installed, signInWithOAuth is available
# @supabase/ssr ^0.8.0 — already installed, PKCE flow handled automatically
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `supabase.auth.signInWithOAuth` (browser client) | Server Action that calls `supabase.auth.signInWithOAuth` | A Server Action can be used if you need to dynamically derive `redirectTo` from `headers()`. Either approach is valid; client-side is simpler because the login/register pages are already `"use client"` components. |
| Supabase native OAuth | `next-auth` OAuth providers | Never for this app — CLAUDE.md explicitly states "Supabase Auth is the sole auth system. There is no NextAuth in active use." `next-auth@4.24.13` is in `package.json` but is unused. Adding NextAuth OAuth on top of Supabase Auth would create two competing session systems. |
| Existing `/auth/callback/route.ts` | New provider-specific callback routes | The existing callback route already calls `exchangeCodeForSession(code)` which works for any provider that returns a PKCE code. No provider-specific logic is needed. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next-auth` OAuth providers | Creates a second auth system alongside Supabase Auth. Session cookies conflict. CLAUDE.md prohibits it. | `supabase.auth.signInWithOAuth` — it is the only auth pathway in this app |
| `passport.js` | Server-side OAuth library for Express/Node. Not applicable to Next.js App Router or Supabase-managed OAuth. Would require a custom backend OAuth flow, bypassing Supabase's session handling entirely. | Supabase SDK `signInWithOAuth` |
| Implicit OAuth flow (no PKCE) | Less secure, deprecated by OAuth 2.1. Supabase's `@supabase/ssr` clients use PKCE by default — do not override `flowType`. | Default PKCE flow (no configuration needed) |
| `redirectTo: 'http://localhost:3000/auth/callback'` hardcoded | Breaks in production and on other machines. | Derive from `window.location.origin` in client components, or from `headers()` in server actions |

---

## Stack Patterns by Variant

**OAuth button in a `"use client"` component (login and register pages):**
- Use `createClient()` from `@/lib/supabase/client` (already the pattern in login/page.tsx).
- Call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: \`\${window.location.origin}/auth/callback\` } })`.
- On success, `signInWithOAuth` returns a `url` to redirect to. Use `router.push(data.url)` or let the SDK handle the redirect.
- The existing `onAuthStateChange` listener in `login/page.tsx` already fires `SIGNED_IN` after OAuth completes — no additional redirect logic needed.

**First OAuth sign-in profile auto-fill:**
- After `exchangeCodeForSession` completes in `/auth/callback`, user metadata is available on the session's user object.
- Google metadata shape (MEDIUM confidence): `user_metadata.full_name`, `user_metadata.avatar_url` (sometimes `user_metadata.picture`).
- Discord metadata shape (MEDIUM confidence): `user_metadata.user_name` (Discord handle), `user_metadata.avatar_url`.
- The existing Postgres trigger `on_auth_user_created` fires for OAuth sign-ups too. It currently reads `user_metadata.name` (set explicitly during email signup). For OAuth users, `name` will be `null` — the trigger must fall back to `user_metadata.full_name` (Google) or `user_metadata.user_name` (Discord) to avoid creating a player with a blank display name.
- Auto-fill can also be handled client-side in the callback route or a post-auth hook — but the trigger approach is more reliable because it fires regardless of client-side errors.

**`redirectTo` for local development:**
- Add `http://localhost:3000/**` to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs.
- The wildcard pattern covers all paths on localhost, including `/auth/callback?code=...&next=...`.
- Production: add exact URL `https://yourdomain.com/auth/callback`.

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@supabase/supabase-js@^2.87.1` | `@supabase/ssr@^0.8.0` | HIGH confidence — these versions are co-installed and working for email auth. `signInWithOAuth` is stable and available at this version. |
| `@supabase/ssr@^0.8.0` | `next@^16.0.10`, `react@19` | HIGH confidence — already powering session management in production for this app. PKCE flow for OAuth uses the same `exchangeCodeForSession` call that email magic links use. |
| Supabase PKCE OAuth flow | `/auth/callback/route.ts` (existing) | HIGH confidence — the existing callback route calls `exchangeCodeForSession(code)` which is the correct PKCE exchange for any provider. No route changes needed. |

---

## Integration Notes for This Codebase

**Callback route is already complete.** `src/app/auth/callback/route.ts` extracts `code`, calls `exchangeCodeForSession`, and redirects. OAuth providers return a `code` query parameter — identical to what this route already handles. No changes needed to the callback route.

**Login page `onAuthStateChange` already handles post-OAuth redirect.** The `SIGNED_IN` event fires after the callback exchange completes and the session is written to cookies. The existing listener in `login/page.tsx` redirects to `/` on this event. OAuth users land on `/` after sign-in without additional code.

**Register flow requires more thought than login.** Email registration creates a player record via DB trigger and requires a username. OAuth registration cannot ask for a username during the provider redirect flow. Two options:
1. Trigger auto-generates a username from provider data (e.g., Discord `user_name` → player username, with collision handling).
2. Post-OAuth "complete your profile" screen asks for a username if none exists. This is the safer UX pattern and avoids username conflicts on first OAuth sign-in.

**The `signUp` server action in `src/actions/auth.ts` is not used for OAuth** — `signInWithOAuth` handles both new and returning users in one call. The `check-availability` preflight in register/page.tsx is also not applicable to OAuth registration.

---

## Sources

- [Supabase Redirect URLs docs](https://supabase.com/docs/guides/auth/redirect-urls) — wildcard URL allow list configuration — HIGH confidence
- [Supabase signInWithOAuth API reference](https://supabase.com/docs/reference/javascript/auth-signinwithoauth) — method signature, `redirectTo` option — HIGH confidence
- [Login with Google | Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-google) — Google Cloud Console setup steps — HIGH confidence
- [Login with Discord | Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-discord) — Discord Developer Portal setup steps — HIGH confidence
- [PKCE flow | Supabase Docs](https://supabase.com/docs/guides/auth/sessions/pkce-flow) — confirms `@supabase/ssr` uses PKCE by default — HIGH confidence
- [OAuth sign-in overwrites user_metadata · supabase/auth-js#1067](https://github.com/supabase/auth-js/issues/1067) — known issue: multiple provider metadata merges — MEDIUM confidence
- [Shape of raw_user_meta_data across providers · supabase Discussion #5210](https://github.com/supabase/supabase/discussions/5210) — provider metadata field shapes — MEDIUM confidence (community-documented, not officially specified per-provider)
- [DEV: How to add Google OAuth to Next.js App Router with Supabase Auth](https://dev.to/mohamed3on/how-to-add-google-oauth-to-nextjs-app-router-with-supabase-auth-f0e) — `window.location.origin` redirectTo pattern — MEDIUM confidence

---

*Stack research for: Google and Discord OAuth — Next.js 15 + @supabase/ssr*
*Researched: 2026-03-19*
