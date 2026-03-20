# Pitfalls Research

**Domain:** Adding Google and Discord OAuth to an existing Supabase Auth + Next.js 15 SSR app (email/password already live)
**Researched:** 2026-03-19
**Confidence:** HIGH — research drew on live WebSearch against Supabase docs, Supabase GitHub issues, Next.js GitHub discussions, and direct codebase analysis of this project's existing auth system.

---

## Critical Pitfalls

### Pitfall 1: Database Trigger Breaks on OAuth Sign-Up (NULL Constraint)

**What goes wrong:**
The existing `on_auth_user_created` database trigger creates a player record using `NEW.raw_user_meta_data ->> 'name'` (or equivalent). Email/password sign-up passes `data: { name }` in the `signUp` options, so the trigger always receives a non-null name. OAuth sign-ups do not pass this field — Supabase populates `raw_user_meta_data` differently for each provider (Google uses `full_name`; Discord uses `full_name` or `custom_claims.global_name`). If the trigger reads a field that is absent for OAuth users, it throws a NOT NULL constraint violation. Supabase surfaces this as `"Database error saving new user"` and the OAuth sign-in fails entirely — the user is redirected to an error page with no clear message.

**Why it happens:**
The trigger was written for email/password registration where the field set is controlled. OAuth metadata keys differ by provider and are not documented as stable — they reflect whatever the provider returns. Developers add OAuth without auditing the trigger's field assumptions.

**How to avoid:**
Update the trigger to handle the multi-provider case using COALESCE across known provider field names, with a fallback to a derived value:

```sql
-- In the trigger function, replace the name extraction with:
COALESCE(
  NEW.raw_user_meta_data ->> 'name',          -- email signup: data.name
  NEW.raw_user_meta_data ->> 'full_name',      -- Google & Discord
  NEW.raw_user_meta_data ->> 'user_name',      -- Discord fallback
  split_part(NEW.email, '@', 1)               -- last resort: email prefix
)
```

Also make the `username` column in the players table nullable or provide a generated default, then handle the "no username yet" case in the callback route by redirecting new OAuth users to a username-selection page.

**Warning signs:**
- OAuth sign-in ends with `"Database error saving new user"` in Supabase logs
- Auth logs show `ERROR: null value in column "username"` or similar
- New OAuth user appears in `auth.users` but has no corresponding row in `public.players`

**Phase to address:**
Phase 1 (Supabase provider config + trigger update) — the trigger must be updated before any OAuth button is wired up. Test with a real Google or Discord account in a staging environment before shipping.

---

### Pitfall 2: Duplicate Account Creation When Email Already Exists

**What goes wrong:**
A player signs up with email/password (e.g., `player@gmail.com`). Later they click "Sign in with Google" using the same Gmail address. Supabase Auth's default behavior in recent versions is automatic identity linking — it links the Google identity to the existing `auth.users` row. However, this behavior is version-dependent and can be disabled. When automatic linking is off (or when the existing email is unverified), Supabase creates a second `auth.users` record for the same email. The player now has two separate accounts with separate player records, separate scores, and separate progression data. There is no merge path.

The reverse is also true: a player who first signed in with Google, then tries `signUp({ email, password })` with the same email, will receive an obfuscated success response with no verification email — Supabase silences the "email already exists" error for security reasons (prevents email enumeration). The player assumes they created a new account but cannot log in with the password they just set.

**Why it happens:**
Supabase's identity linking behavior changed across versions. The safe assumption is that it may not be on by default in self-hosted or older managed projects. Developers test the happy path (first-time OAuth user) but not the collision path (existing email/password user).

**How to avoid:**
1. Verify in the Supabase dashboard that "Automatic identity linking" is enabled (Auth > Settings). This is the single most important configuration step.
2. In the callback route (`/auth/callback/route.ts`), after `exchangeCodeForSession`, check `session.user.app_metadata.provider` and `session.user.identities` length. If more than one identity exists, this was a merge — no special action needed. If exactly one identity exists and it is OAuth, this is a new user — proceed to profile setup flow.
3. On the login page, inform existing users that they can sign in with the same email via OAuth if their email matches. Do not silently fail.

**Warning signs:**
- Multiple `auth.users` rows with the same email in different providers
- Players reporting lost progress after switching to OAuth sign-in
- `signUp` with an existing OAuth email returns success but the user never receives a confirmation email and cannot log in

**Phase to address:**
Phase 1 (Supabase provider config) — verify automatic linking is on before wiring OAuth buttons. Add a smoke test: create an email/password account, then attempt OAuth sign-in with the same email address.

---

### Pitfall 3: Callback URL Misconfiguration (Three-Way Mismatch)

**What goes wrong:**
OAuth flows require three sets of redirect URLs to agree exactly:

1. **Google Cloud Console / Discord Developer Portal** — the "Authorized redirect URI" registered for the OAuth application
2. **Supabase dashboard** — the "Redirect URLs" allowlist under Authentication > URL Configuration
3. **`signInWithOAuth` call** — the `redirectTo` passed in code

A mismatch at any of the three points causes the OAuth flow to fail, usually with a generic "redirect_uri_mismatch" error from the provider (Google) or a silent failure from Supabase. This project already has a callback route at `/auth/callback`. The Supabase redirect URL must be `https://yourdomain.com/auth/callback`, and the same URL must be registered in both the Google Cloud Console and the Discord Developer Portal.

Localhost development adds a separate layer: Google and Discord do not accept wildcard localhost ports in the same way as Supabase's allowlist. Developers must register `http://localhost:3000/auth/callback` explicitly in both the OAuth provider console and the Supabase allowlist. Changing the dev port without updating all three locations breaks local development silently.

**Why it happens:**
Three separate admin panels must be kept in sync manually. The Supabase allowlist alone is not sufficient — it controls what Supabase accepts, but the OAuth provider validates the redirect URI before Supabase is ever involved.

**How to avoid:**
Treat callback URL registration as a deployment checklist item, not a one-time setup:

- Production: `https://yourdomain.com/auth/callback` in all three locations
- Development: `http://localhost:3000/auth/callback` in all three locations
- Add `NEXT_PUBLIC_SITE_URL` to `.env.local` and use it in `signInWithOAuth` to construct `redirectTo` dynamically — never hardcode the origin

The existing `signUp` action already uses `NEXT_PUBLIC_SITE_URL` for `emailRedirectTo`. Apply the same pattern to OAuth `redirectTo`.

**Warning signs:**
- `Error 400: redirect_uri_mismatch` in the browser URL bar after provider authorization
- OAuth flow redirects to provider but never returns to the app
- Works on one machine but not another (different port)

**Phase to address:**
Phase 1 (Supabase provider config) — URL registration must be complete before any OAuth flow can be tested end-to-end.

---

### Pitfall 4: PKCE Code Verifier Cookie Lost After Sign-Out

**What goes wrong:**
Supabase SSR uses PKCE (Proof Key for Code Exchange) for OAuth. When `signInWithOAuth` is called, it stores a `code_verifier` in a cookie. After the OAuth provider redirects back, the callback route exchanges the `code` using that verifier. The known bug: calling `supabase.auth.signOut()` clears auth cookies, but on some versions of `@supabase/ssr`, it also clears the code verifier cookie. If the user signs out and then immediately attempts another OAuth sign-in, `exchangeCodeForSession` fails with a `"both auth code and code verifier should be non-empty"` error. The user is redirected to the login page with a confusing error.

This is a confirmed bug tracked in `supabase/ssr` issue #55. It affects the sign-out then OAuth re-login path — a very common flow for users who manage multiple accounts or share a device.

**Why it happens:**
`@supabase/ssr`'s `setItemAsync` for the code verifier does not consistently persist the cookie when executed after a `signOut()` clears storage. The sign-out clears all auth-related cookies, which can include the verifier that was just written by the new `signInWithOAuth` call if there is a race or storage conflict.

**How to avoid:**
After `signOut`, do not immediately redirect to a page that auto-initiates OAuth. Ensure the sign-out fully completes (redirect to `/login`) before the user clicks an OAuth button. In the callback route, add explicit error handling for the verifier-missing case and redirect to `/login?error=session_expired` with a user-friendly message rather than a cryptic auth error.

Check the installed version of `@supabase/ssr` — later patch versions may have fixed this. Verify the current version's release notes.

**Warning signs:**
- OAuth sign-in fails immediately after signing out
- Callback route receives error: `"both auth code and code verifier should be non-empty"`
- The error only appears on the second or later OAuth attempt in the same session

**Phase to address:**
Phase 2 (OAuth button UI + callback handling) — add explicit error handling for the verifier-missing case in the callback route. Test the sign-out then OAuth flow explicitly as a success criterion.

---

### Pitfall 5: New OAuth Users Have No Username — Trigger or Backend Requires One Immediately

**What goes wrong:**
This app's registration flow requires the player to pick a username (checked against the backend via `/players/check-username/` before signup). The database trigger and/or player_manager backend expects a username to be present when a player record is created. OAuth sign-up bypasses the registration form entirely. When an OAuth user's sign-up fires the trigger, there is no username in `raw_user_meta_data` — only the provider's display name (`full_name`). If the trigger or backend enforces username uniqueness and the derived fallback (e.g., email prefix) happens to collide with an existing username, the trigger throws a constraint violation and the OAuth sign-in fails.

Even if the trigger does not fail, the player may land in the app without a unique username, which will break any username-display logic or leaderboard queries that assume the field is set and non-null.

**Why it happens:**
Email/password registration is a synchronous, multi-step form. OAuth registration is a redirect flow — there is no interstitial form. Developers add OAuth without designing the "first OAuth sign-in" flow, assuming the trigger handles it.

**How to avoid:**
Design and implement a "complete your profile" step for new OAuth users:

1. In the trigger, derive a temporary username from provider data with a random suffix to avoid collisions (e.g., `full_name_slug + random_4_digits`). Mark it as provisional.
2. In the callback route, after `exchangeCodeForSession`, detect new users (no existing player record, or provisional username flag set).
3. Redirect new OAuth users to `/register/complete?provider=google` (or similar) to pick a final username before they access the app.
4. Existing email/password users who link OAuth skip this step — their username is already set.

**Warning signs:**
- OAuth users appear in the leaderboard with generated email-prefix names rather than chosen usernames
- Username collision errors in Supabase logs for OAuth sign-ups
- Players report they cannot find themselves on the leaderboard after switching to OAuth

**Phase to address:**
Phase 2 (OAuth button UI + callback handling) — design the "first sign-in" detection and username completion redirect as a core requirement, not an afterthought.

---

### Pitfall 6: Provider Avatar URL Stored Directly — Breaks or Expires

**What goes wrong:**
Google and Discord both return an avatar URL in OAuth metadata. Google avatar URLs point to `lh3.googleusercontent.com` with a short-lived signed parameter. Discord avatar URLs point to `cdn.discordapp.com/avatars/{user_id}/{hash}.png`. If the app stores the raw URL from `raw_user_meta_data.avatar_url` in the player record and displays it using `<img>` or Next.js `<Image>`, several problems occur:

- Google URLs may contain a size parameter that returns a tiny thumbnail. The size can be controlled by appending `=s200` to the URL, but developers often miss this.
- Discord changes avatar hashes when the user updates their profile picture. The stored URL becomes a 404.
- Next.js `<Image>` rejects external hostnames not listed in `images.remotePatterns` in `next.config.mjs`. The app will throw an error during rendering if `lh3.googleusercontent.com` and `cdn.discordapp.com` are not explicitly configured.
- Storing a third-party CDN URL as the player's canonical avatar creates a dependency on that CDN. If the URL expires, the player has a broken avatar with no way to fix it.

**Why it happens:**
The metadata is available immediately and requires no additional work. Developers store it directly without considering URL stability or Next.js image security configuration.

**How to avoid:**
- For the MVP, store the URL but treat it as a hint, not a canonical avatar. Use it only for display at first sign-in. Provide a way to update or replace it later.
- Add `lh3.googleusercontent.com` and `cdn.discordapp.com` to `images.remotePatterns` in `next.config.mjs` before using `<Image>` with provider avatars.
- For Google, append `=s200-c` to the URL at storage time to ensure a consistent size.
- Consider re-fetching the URL from `raw_user_meta_data` on each login (Supabase refreshes this on OAuth token refresh) rather than caching it in the player record indefinitely.

**Warning signs:**
- Next.js throws `"hostname not configured under images"` error when rendering avatars
- Google avatars appear as 1x1 pixel thumbnails
- Discord avatars return 404 after the user updates their profile picture

**Phase to address:**
Phase 2 (OAuth button UI + callback handling) — configure `remotePatterns` before any avatar display code is written. Decide at this phase whether to cache the URL or always derive it from Supabase session metadata.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing raw provider avatar URL in player table | No extra infra, instant display | URL expires or changes; player stuck with 404 avatar; no update path | MVP only — add avatar refresh mechanism in next milestone |
| Skipping username-completion step for OAuth users | Faster implementation | Players have auto-generated names; no identity ownership; leaderboard confusion | Never — players need to own their display name |
| Not testing the sign-out then OAuth re-login path | Saves test setup time | PKCE verifier bug silently breaks re-login; no visibility until user reports it | Never — this path is on the critical flow |
| Using `images.domains` (deprecated) instead of `images.remotePatterns` | Slightly simpler config | Deprecated in Next.js 12.3+; will be removed; pattern matching is more secure | Never on Next.js 15 — use `remotePatterns` |
| Hardcoding the callback URL origin | Works in single-environment setup | Breaks across dev/staging/prod; cannot be tested locally without changing code | Never — use `NEXT_PUBLIC_SITE_URL` |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google OAuth | Registering only the production callback URL in Google Cloud Console | Register both `http://localhost:3000/auth/callback` and `https://yourdomain.com/auth/callback` under "Authorized redirect URIs" — Google does not support wildcards for localhost |
| Discord OAuth | Using OAuth2 without the `identify` and `email` scopes | Discord requires explicit `identify email` scopes to return user metadata; missing `email` scope means the Discord user's email is absent, preventing Supabase identity linking |
| Supabase Auth | Enabling a provider in Supabase but forgetting to add the Supabase-provided callback URL to the provider's OAuth application | Each provider's app must have Supabase's own callback URL (e.g., `https://<project>.supabase.co/auth/v1/callback`) — this is separate from the app's `/auth/callback` route |
| `signInWithOAuth` | Calling from a Server Component or Server Action | `signInWithOAuth` must be called from a Client Component — it returns a URL and relies on browser-side redirect; calling from a Server Action throws or silently fails |
| Next.js `<Image>` | Using it with provider avatar URLs before adding `remotePatterns` | Next.js blocks unknown external hostnames by default; add `lh3.googleusercontent.com` and `cdn.discordapp.com` to `images.remotePatterns` in `next.config.mjs` |
| Supabase trigger | Writing a trigger that assumes `raw_user_meta_data` field names from email signup | OAuth providers populate different fields; always use COALESCE with a known-safe fallback |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Checking `auth.users.identities` on every page load to determine auth provider | Slow page loads; unnecessary Supabase round-trips | Read `user.app_metadata.provider` from the session (already in JWT); no extra query needed | At any traffic level — it's a design issue, not a scale issue |
| Fetching provider avatar on every render instead of caching | Flickering avatar; rate limit hits on Google/Discord CDN | Cache the avatar URL in the player record at first sign-in; update on explicit refresh | At any traffic level |
| Adding OAuth buttons to a Server Component that re-renders on every nav | OAuth button triggers full RSC re-render cycle | Keep auth UI in a Client Component with `'use client'` | From first deployment |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Not validating `redirect_to` parameter in callback route | Open redirect — attacker sends user to `https://evil.com` via `?redirect_to=https://evil.com` | The existing callback route already guards against this (`redirectTo.startsWith("/") ? redirectTo : "/"`) — verify this guard is preserved when OAuth is added |
| Automatic identity linking disabled with multiple providers live | Same email creates two separate accounts; combined with a "merge" feature, this becomes an account takeover vector | Verify "Automatic identity linking" is enabled in Supabase Auth settings before going live |
| Storing `raw_user_meta_data` fields in player table without sanitization | Provider could theoretically inject HTML/script into display name or avatar URL | Sanitize all provider-sourced strings before storage; never render them as raw HTML |
| Discord OAuth without verifying email is confirmed | Discord accounts can exist without a confirmed email; linking such an account to an email/password account via the same email could merge with the wrong account | Request the `email` scope and check `user.email_confirmed_at` is non-null before treating a Discord account as the authoritative email identity |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| OAuth button redirects immediately with no loading state | User clicks, page appears frozen for 1-3s while redirect is prepared | Show a loading spinner or disable the button immediately on click |
| No explanation that OAuth will link to an existing email/password account | Returning players attempt OAuth not realizing they have an account; may think they created a new account | On the login page, show a note: "Using the same email as your existing account will sign you in to the same profile" |
| "Complete your profile" page is skippable | New OAuth users bypass username selection and enter the app with a generated name | Make the username-completion step mandatory for new OAuth users; do not allow access to `/gameroom` or `/profile` until it is done |
| OAuth error messages from Supabase exposed raw to users | Messages like `"identity already linked"` or `"provider disabled"` are confusing | Map Supabase error codes to user-friendly messages in the callback route's error handling |
| Login and register pages have separate OAuth buttons with no indication they do the same thing | Users confused about which page to use for OAuth | Either consolidate OAuth into a single component or label buttons clearly: "Continue with Google (sign in or register)" |

---

## "Looks Done But Isn't" Checklist

- [ ] **Trigger updated:** Verify the `on_auth_user_created` trigger handles missing `name` field — test by creating a real Google/Discord account against the staging Supabase project
- [ ] **Three-way URL sync:** Confirm `/auth/callback` URL is registered in Google Cloud Console, Discord Developer Portal, AND Supabase Auth > URL Configuration for both production and localhost
- [ ] **Supabase provider URL registered:** The Supabase-generated callback URL (`https://<project>.supabase.co/auth/v1/callback`) is registered in Google and Discord OAuth app settings — this is separate from the app's own callback route
- [ ] **Automatic identity linking:** Confirm "Enable automatic identity linking" is on in Supabase Auth settings
- [ ] **Discord scopes:** Discord OAuth app requests `identify email` scope — verify `email` is present in the Supabase Discord provider config
- [ ] **`remotePatterns` configured:** `next.config.mjs` includes `lh3.googleusercontent.com` and `cdn.discordapp.com` before any avatar display code is written
- [ ] **Sign-out then OAuth tested:** Sign out, then immediately click "Sign in with Google" — confirm it succeeds (PKCE verifier not lost)
- [ ] **Username completion flow:** New OAuth user (email not previously registered) is redirected to username selection before accessing the app
- [ ] **Existing user collision tested:** Create email/password account, then sign in with Google using the same email — confirm single merged account, not two separate accounts
- [ ] **Callback error handling:** Test OAuth with an invalid state param — confirm user is redirected to `/login?error=callback_error` with a readable message, not a blank page or raw error

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Trigger fails for OAuth users — new signups broken | HIGH | Fix trigger immediately; existing orphaned `auth.users` rows (no player record) need manual backfill; identify affected users via `auth.users LEFT JOIN public.players` |
| Duplicate accounts created (linking off) | HIGH | Enable automatic linking; duplicate rows cannot be auto-merged — requires manual data migration or player support to consolidate scores |
| Callback URL mismatch — OAuth non-functional | LOW | Add missing URL to Google/Discord console and/or Supabase allowlist; no data loss |
| PKCE verifier bug on re-login | LOW | Add try-catch to callback route to surface a friendly error; users can work around it by refreshing before retrying |
| Provider avatars returning 404 | LOW | Re-fetch avatar URL from Supabase session metadata on next login; update stored URL |
| `remotePatterns` missing — `<Image>` throws in production | LOW | Add hostname to `next.config.mjs`, redeploy; no data loss |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Trigger breaks on OAuth NULL field | Phase 1 — Supabase provider setup + trigger update | Create a test Google/Discord account; confirm player record created with valid name |
| Duplicate accounts (identity linking off) | Phase 1 — Supabase provider setup | Create email account, then OAuth same email; confirm single merged user in `auth.users` |
| Three-way callback URL mismatch | Phase 1 — Supabase provider setup | End-to-end OAuth flow succeeds in both dev and production environments |
| PKCE verifier lost after sign-out | Phase 2 — OAuth button UI + callback handling | Explicit test: sign out, sign in with OAuth; confirm success |
| New OAuth users have no username | Phase 2 — OAuth button UI + callback handling | New OAuth user is redirected to username completion; existing user is not |
| Provider avatar URL breaks `<Image>` | Phase 2 — OAuth button UI + callback handling | `next.config.mjs` remotePatterns updated; avatar renders without error |
| Discord missing `email` scope | Phase 1 — Supabase provider setup | Discord user email visible in Supabase `auth.users.email` after sign-in |
| Open redirect vulnerability | Phase 2 — callback route review | Verify `redirect_to` sanitization is still present after OAuth changes |

---

## Sources

- Supabase Identity Linking docs — [https://supabase.com/docs/guides/auth/auth-identity-linking](https://supabase.com/docs/guides/auth/auth-identity-linking) — HIGH confidence
- Supabase GitHub issue #1945: `.signUp()` does not error if email linked to social login — [https://github.com/supabase/auth/issues/1945](https://github.com/supabase/auth/issues/1945) — HIGH confidence
- Supabase `ssr` issue #55: PKCE code verifier cookie lost after signOut — [https://github.com/supabase/ssr/issues/55](https://github.com/supabase/ssr/issues/55) — HIGH confidence
- Supabase Discord OAuth docs — [https://supabase.com/docs/guides/auth/social-login/auth-discord](https://supabase.com/docs/guides/auth/social-login/auth-discord) — HIGH confidence
- Supabase Redirect URLs docs — [https://supabase.com/docs/guides/auth/redirect-urls](https://supabase.com/docs/guides/auth/redirect-urls) — HIGH confidence
- Supabase troubleshooting: Database error saving new user — [https://supabase.com/docs/guides/troubleshooting/database-error-saving-new-user-RU_EwB](https://supabase.com/docs/guides/troubleshooting/database-error-saving-new-user-RU_EwB) — HIGH confidence
- Supabase discussion #29096: GitHub OAuth not creating new user — [https://github.com/orgs/supabase/discussions/29096](https://github.com/orgs/supabase/discussions/29096) — MEDIUM confidence
- Next.js `images.remotePatterns` discussion — [https://github.com/vercel/next.js/discussions/58961](https://github.com/vercel/next.js/discussions/58961) — HIGH confidence
- Codebase analysis: `src/actions/auth.ts`, `src/app/auth/callback/route.ts`, `src/app/register/page.tsx`, `src/hooks/useUser.ts` — HIGH confidence (direct source)

---
*Pitfalls research for: Google and Discord OAuth on existing Supabase Auth + Next.js 15 SSR app*
*Researched: 2026-03-19*
