# Project Research Summary

**Project:** Cackle — v1.4 Social Auth milestone
**Domain:** Google and Discord OAuth for an existing Next.js 15 + Supabase Auth SSR gaming app
**Researched:** 2026-03-19
**Confidence:** HIGH (OAuth flow and architecture); MEDIUM (provider metadata field shapes); LOW (user_metadata overwrite behavior with multiple linked providers)

## Executive Summary

Adding Google and Discord OAuth to this app is a well-constrained integration. Every package required is already installed — `@supabase/supabase-js@^2.87.1` exposes `signInWithOAuth`, and `@supabase/ssr@^0.8.0` manages the PKCE flow end-to-end. The existing `/auth/callback/route.ts` already performs `exchangeCodeForSession`, which is provider-agnostic and handles OAuth PKCE codes identically to email magic links. In terms of pure OAuth plumbing, the backend is effectively done. The implementation scope is: (1) external app registration in Google Cloud Console and Discord Developer Portal, (2) enabling providers in the Supabase dashboard, (3) one new shared UI component (`OAuthButtons`), (4) minor additions to the login and register pages, and (5) a first-sign-in detection and profile-sync step in the callback route.

The recommended approach is a two-phase delivery. Phase 1 covers all prerequisite infrastructure: dashboard configuration, provider app registration, and — critically — updating the existing `on_auth_user_created` database trigger to handle OAuth metadata field names before a single OAuth button is wired up. Phase 2 implements the UI, callback modifications, and the first-sign-in profile-population flow. Deferring account linking, additional providers, and a full "complete your profile" onboarding screen to post-launch is the correct call: these carry high complexity and low immediate value.

The primary risks are all front-loaded infrastructure concerns, not implementation complexity. Three failure modes can make OAuth completely non-functional and are invisible until tested end-to-end with a real account: (1) the database trigger throwing a NOT NULL constraint violation when `name` is absent from OAuth metadata, (2) a three-way callback URL mismatch between the provider console, Supabase dashboard, and the `signInWithOAuth` call, and (3) automatic identity linking being disabled in Supabase, causing duplicate accounts for players who try OAuth with an existing email. All three must be verified in a staging environment before any OAuth button ships.

## Key Findings

### Recommended Stack

No new packages are required. The full OAuth capability is already present in the installed Supabase SDK. The only external dependencies are the two provider developer portals (Google Cloud Console, Discord Developer Portal) and the Supabase project dashboard — these require manual configuration steps that must happen before any code is testable.

**Core technologies:**
- `@supabase/supabase-js@^2.87.1` — `signInWithOAuth` method; already installed, no upgrade needed
- `@supabase/ssr@^0.8.0` — PKCE flow management, cookie-based session; already installed and wiring the existing callback route
- Existing `/auth/callback/route.ts` — handles `exchangeCodeForSession` for any provider; no route changes needed, only additions

**Critical version caveat:** A breaking behavior change in `@supabase/supabase-js@2.91.0` deferred the `SIGNED_IN` event emission via `setTimeout`, causing OAuth cookie writes to be missed in SSR. The current installed version (`^2.87.1`) resolves to below this. Verify before upgrading.

### Expected Features

**Must have (table stakes):**
- "Sign in with Google" button on `/login` and `/register` — standard UX expectation
- "Sign in with Discord" button on `/login` and `/register` — gaming platform audience specifically expects Discord
- OAuth error handling in `/auth/callback` for declined consent (`?error=` param, currently unhandled)
- Display name pre-populated from provider on first sign-in — players skipping the registration form still need a name
- Avatar pre-populated from provider on first sign-in
- Email/password auth preserved without regression

**Should have (competitive):**
- Discord username as default display name — Discord handles are game identity; players feel immediately at home
- Redirect to intended destination after OAuth — callback already supports `redirect_to` param; wiring it in `signInWithOAuth` is minimal work
- Loading state on OAuth buttons — 1-3 second redirect lag feels broken without visual feedback

**Defer (v2+):**
- Account linking (connect Google + Discord to the same account) — known Supabase `user_metadata` overwrite bug makes this high-risk
- Additional providers (GitHub, Apple, etc.) — add only on explicit user demand
- Auto-merge OAuth account with existing email/password account — security-sensitive, Supabase does not support this safely without re-verification
- Full `/auth/setup` "complete your profile" onboarding page — valuable but not blocking if the trigger generates a reasonable provisional username

### Architecture Approach

The architecture is deliberately minimal: one new shared component (`OAuthButtons`), two modified pages (login, register), and one modified route handler (callback). All OAuth initiation must happen in a Client Component because `signInWithOAuth` returns a provider URL that the browser must navigate to — it cannot be called from a Server Action or Route Handler. The callback route handles new-user detection via a `created_at` timestamp comparison (< 5 seconds = new user) and conditionally fires a `POST /players/{id}/sync-oauth` call to populate display name and avatar. Returning users bypass the sync entirely to preserve any profile customizations.

**Major components:**
1. `OAuthButtons` (new, `src/components/OAuthButtons.tsx`) — Client Component; Google and Discord buttons; calls `signInWithOAuth` with `window.location.origin`-derived `redirectTo`
2. `/auth/callback/route.ts` (modified) — adds new-user detection and profile sync after existing `exchangeCodeForSession`; adds `?error=` param handling for declined consent
3. `on_auth_user_created` DB trigger (modified) — `COALESCE` across `name`, `full_name`, `user_name`, and email-prefix fallback to handle OAuth metadata field shapes
4. Backend `/players/{id}/sync-oauth` endpoint (new, in backend service) — idempotent POST to set display name and avatar URL from provider data

### Critical Pitfalls

1. **Database trigger breaks on OAuth sign-up (NULL constraint)** — the existing trigger reads `raw_user_meta_data->>'name'`, which is absent for OAuth users. Update the trigger before any OAuth flow is tested: use `COALESCE(name, full_name, user_name, split_part(email,'@',1))`. Test with a real Google/Discord account against staging before shipping.

2. **Duplicate accounts when email already exists (identity linking off)** — verify "Enable automatic identity linking" is on in Supabase Auth Settings before any OAuth button is wired. Test the collision path explicitly: create an email/password account, then OAuth sign-in with the same email.

3. **Three-way callback URL mismatch** — the redirect URI must be consistent across (a) Google Cloud Console / Discord Developer Portal, (b) Supabase Auth > URL Configuration, and (c) the `redirectTo` value in `signInWithOAuth`. Register both localhost and production URLs in all three places. Never hardcode the origin; derive from `NEXT_PUBLIC_SITE_URL` or `window.location.origin`.

4. **PKCE code verifier cookie lost after sign-out** — confirmed bug in `@supabase/ssr` (issue #55): `signOut()` can clear the verifier cookie, breaking immediate OAuth re-login. Add explicit error handling in the callback route for the "both auth code and code verifier should be non-empty" case. Test sign-out then OAuth explicitly as a success criterion.

5. **Provider avatar URL breaks Next.js `<Image>`** — external hostnames must be listed in `images.remotePatterns` in `next.config.mjs`. Add `lh3.googleusercontent.com` and `cdn.discordapp.com` before writing any avatar display code. Discord avatar CDN URLs also go stale when the user changes their profile picture; store the URL as a hint, not a canonical source.

## Implications for Roadmap

A two-phase structure is strongly recommended. Phase 1 must be completed and verified end-to-end before Phase 2 begins — the pitfalls in Phase 1 can make the entire OAuth flow non-functional, and they are far easier to diagnose in isolation.

### Phase 1: Infrastructure and Provider Configuration

**Rationale:** All three critical URL-related pitfalls (Pitfalls 2, 3) and the database trigger failure (Pitfall 1) are infrastructure concerns that must be resolved before any UI code is testable. Shipping Phase 1 complete means a developer can initiate an OAuth flow and see it succeed end-to-end, even with a placeholder UI.

**Delivers:**
- Google OAuth app registered in Google Cloud Console with Supabase callback URL
- Discord OAuth app registered in Discord Developer Portal with `identify email` scopes and Supabase callback URL
- Both providers enabled in Supabase Auth dashboard
- Localhost and production redirect URLs registered in all three locations (provider console, Supabase allowlist, and code)
- Automatic identity linking confirmed enabled in Supabase Auth settings
- `on_auth_user_created` trigger updated with `COALESCE` fallback for OAuth metadata fields (with random-suffix collision handling for usernames)
- Smoke tests passing: new user OAuth sign-in creates a valid player record; email/password user OAuth with same email merges to one account; Discord email scope is present in `auth.users.email`

**Addresses:** All P1 features that are dashboard-prerequisite
**Avoids:** Pitfalls 1 (trigger NULL), 2 (duplicate accounts), 3 (URL mismatch)

**Research flag:** Standard patterns — Supabase official docs cover all steps with HIGH confidence. No deeper research needed. The only uncertainty is verifying automatic identity linking is on in this specific project's dashboard.

### Phase 2: OAuth UI and Callback Logic

**Rationale:** With infrastructure validated, Phase 2 delivers the user-visible feature. The `OAuthButtons` component has no external dependencies beyond the browser Supabase client. The callback modifications add new-user detection and profile sync, with explicit error handling for declined consent and the PKCE verifier bug.

**Delivers:**
- `OAuthButtons` component (Google + Discord) added to `/login` and `/register` with a visual divider
- `/auth/callback/route.ts` updated: handles `?error=` param for declined consent; detects new users via `created_at` comparison; calls `/players/{id}/sync-oauth` for new users only
- `next.config.mjs` updated with `images.remotePatterns` for Google (`lh3.googleusercontent.com`) and Discord (`cdn.discordapp.com`) avatar CDN hostnames
- Loading state on OAuth buttons
- Redirect to intended destination wired via `redirect_to` param (already supported by the existing callback route)
- End-to-end test matrix: new user, returning user, declined consent, sign-out then re-login

**Uses:** `@supabase/supabase-js` `signInWithOAuth`, existing `createClient()` singleton, `window.location.origin` for `redirectTo`
**Implements:** `OAuthButtons` component, callback route modifications
**Avoids:** Pitfall 4 (PKCE verifier bug after sign-out), Pitfall 5 (avatar URL and `<Image>` config), anti-patterns from ARCHITECTURE.md (no Server Action initiation, no sync on every sign-in, no hardcoded origin)

**Research flag:** One validation needed at runtime — log actual Discord `user_metadata` field names on first test sign-in and verify before committing production profile-sync code. Field names are MEDIUM confidence (community sources, not official per-provider specification).

### Phase Ordering Rationale

- Phase 1 before Phase 2 is a hard dependency: no OAuth UI can be tested without provider configuration and trigger fixes in place. Reversing this order means failures during UI development are ambiguous (infrastructure or code?).
- The trigger update is the single highest-risk item. It is a database migration that must precede the first OAuth sign-in attempt in any environment. Placing it in Phase 1 ensures it is never accidentally skipped.
- Avatar display (`next.config.mjs` `remotePatterns`) belongs in Phase 2 because it is only relevant once profile-sync code is written — but it must be done before any `<Image>` component renders a provider avatar URL.
- Account linking, additional providers, and the `/auth/setup` confirmation page are correctly deferred. The `user_metadata` overwrite bug (supabase/auth-js #1067) has no confirmed fix in the current SDK version. Building account linking on top of this would create unpredictable behavior.

### Research Flags

**Phases needing verification during execution:**
- **Phase 2 (Discord metadata fields):** Log actual `user_metadata` shape from a real Discord OAuth response before finalizing the profile-sync code. The `avatar_url` field presence and `custom_claims.global_name` availability are community-confirmed but not in official Supabase Discord docs. Plan a manual inspection step before committing the sync logic.

**Phases with standard patterns (no research-phase needed):**
- **Phase 1:** Supabase provider configuration is fully documented in official guides. Google Cloud Console and Discord Developer Portal steps are stable and HIGH confidence.
- **Phase 2 (OAuthButtons, callback structure):** Established Next.js + Supabase App Router patterns. Official docs and multiple verified sources.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages already installed and in use. OAuth capability confirmed in installed SDK version. One caveat: verify `@supabase/supabase-js` resolves below 2.91.0 breaking change before any planned upgrades. |
| Features | HIGH | OAuth flow mechanics fully documented. Provider metadata field shapes at MEDIUM specifically for Discord `custom_claims` and avatar CDN URL construction. |
| Architecture | HIGH | Integration points verified via direct codebase inspection. Client-Component-only constraint for `signInWithOAuth` is definitive. Callback route handler is already structurally correct. |
| Pitfalls | HIGH | Critical pitfalls sourced from official Supabase docs, confirmed GitHub issues (`ssr#55`, `auth#1945`, `auth-js#1067`), and direct codebase analysis. Recovery strategies identified for all six pitfalls. |

**Overall confidence:** HIGH

### Gaps to Address

- **Discord `user_metadata` field names (LOW confidence):** `avatar_url` and `custom_claims.global_name` are community-sourced. Plan a logging step in the callback route during Phase 2 development to capture the real shape from a live Discord OAuth response before writing production profile-sync code.

- **Backend `/players/{id}/sync-oauth` endpoint:** This endpoint does not yet exist in the backend service (`player_manager`). The Phase 2 callback modification depends on it. If backend work is not scoped in this milestone, stub with a no-op and ship the endpoint separately. This is the primary cross-service dependency for the milestone.

- **Provisional username collision handling in the trigger:** The COALESCE fallback will produce display names like "Jane Smith" from Google, but the `username` column in `public.players` may enforce uniqueness. The trigger should append a random 4-digit suffix when deriving a username from provider data to avoid collisions. Finalize this strategy during Phase 1 implementation before migrating the trigger.

- **`@supabase/supabase-js` version pin:** Confirm `package.json` resolves to a version below 2.91.0 (the SIGNED_IN event deferral breaking change). If any planned upgrade crosses this boundary, verify a fix has been released before including OAuth in the same deployment.

## Sources

### Primary (HIGH confidence)
- Supabase signInWithOAuth reference — method signature, PKCE flow: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
- Supabase Login with Google — Google Cloud Console setup: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase Login with Discord — Discord Developer Portal setup: https://supabase.com/docs/guides/auth/social-login/auth-discord
- Supabase Redirect URLs — wildcard allowlist configuration: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase PKCE flow — confirms @supabase/ssr uses PKCE by default: https://supabase.com/docs/guides/auth/sessions/pkce-flow
- Supabase Identity Linking — automatic linking configuration: https://supabase.com/docs/guides/auth/auth-identity-linking
- Supabase troubleshooting: Database error saving new user: https://supabase.com/docs/guides/troubleshooting/database-error-saving-new-user-RU_EwB
- Supabase ssr issue #55: PKCE code verifier cookie lost after signOut: https://github.com/supabase/ssr/issues/55
- Supabase auth issue #1945: signUp does not error if email linked to social login: https://github.com/supabase/auth/issues/1945
- Next.js images.remotePatterns documentation: https://github.com/vercel/next.js/discussions/58961
- Codebase inspection: `src/app/auth/callback/route.ts`, `src/actions/auth.ts`, `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/hooks/useUser.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/app/login/auth.module.css`

### Secondary (MEDIUM confidence)
- Supabase discussion #5210: provider metadata field shapes (community-documented): https://github.com/orgs/supabase/discussions/5210
- Supabase discussion #5666: Google full_name, avatar_url in user_metadata: https://github.com/orgs/supabase/discussions/5666
- Supabase discussion #306: Database trigger for profile sync pattern: https://github.com/orgs/supabase/discussions/306
- DEV.to: window.location.origin redirectTo pattern for Next.js + Supabase OAuth

### Tertiary (LOW confidence)
- Supabase auth-js issue #1067: user_metadata overwrite with multiple linked providers — no confirmed fix in current versions: https://github.com/supabase/auth-js/issues/1067
- Supabase discussion #3334: Discord avatar_url CDN construction in user_metadata: https://github.com/orgs/supabase/discussions/3334

---
*Research completed: 2026-03-19*
*Ready for roadmap: yes*
