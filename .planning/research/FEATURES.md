# Feature Research

**Domain:** Google and Discord OAuth social login for an existing Next.js + Supabase Auth gaming app
**Researched:** 2026-03-19
**Confidence:** HIGH for OAuth flow mechanics and Supabase signInWithOAuth API; MEDIUM for provider-specific metadata field shapes (Discord avatar URL construction is underdocumented in official Supabase docs); LOW for the user_metadata overwrite behavior with multiple linked providers (known bug, no confirmed fix in current Supabase versions).

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that are non-negotiable. Missing any of these makes the OAuth feature feel broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| "Sign in with Google" button on /login | Standard UX since 2018 — users expect it on any sign-in page | LOW | `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })` from browser client; must pass origin-relative callback URL |
| "Sign in with Discord" button on /login | Gaming platform users skew heavily toward Discord; absence is conspicuous | LOW | Same `signInWithOAuth` call with `provider: 'discord'`; Discord app must be registered at discord.com/developers |
| OAuth buttons on /register as well as /login | New users landing on /register expect the same options — OAuth removes the need to fill the form | LOW | Same buttons, same flow; Supabase treats first OAuth sign-in as registration automatically — no separate "register" action exists |
| /auth/callback handles OAuth code exchange | The existing callback route at `src/app/auth/callback/route.ts` already calls `exchangeCodeForSession(code)` — this already works for OAuth out of the box | LOW | No code changes needed to the callback route itself; Supabase PKCE flow is the same for OAuth and email magic link |
| Redirect back to intended destination after sign-in | User clicking sign-in from /gamerooms expects to land on /gamerooms, not / | LOW | Pass `redirectTo` as a search param when initiating OAuth; the callback route already reads `redirect_to` and `next` query params and applies them after exchange |
| Error handling: declined consent / provider error | If the user cancels the Google/Discord consent screen, the callback receives an `error` param instead of `code` | LOW | The callback route should check for `error` param and redirect to /login with a message; currently the route only handles missing `code`, not an explicit OAuth error param |
| Email/password auth preserved | Existing users must not be disrupted | LOW | Adding OAuth buttons does not touch the email/password form; flows are independent |
| Display name pre-populated on first sign-in | The register form collects a username — OAuth users skipping the form still need a name | MEDIUM | Supabase populates `user.user_metadata.full_name` (Google) and `user.user_metadata.full_name` or `user.user_metadata.name` (Discord); must detect "first sign-in" and call the backend to create the player record with the provider-supplied name |
| Avatar pre-populated on first sign-in | The platform shows player avatars — OAuth users should not have a blank avatar | MEDIUM | Google provides `user.user_metadata.avatar_url`; Discord provides `user.user_metadata.avatar_url` (constructed from CDN hash); must write avatar_url to the player profile on first sign-in |

### Differentiators (Competitive Advantage)

Features that elevate the experience beyond bare-bones OAuth — valuable for a gaming platform specifically.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Discord username as default display name | Discord usernames are already game-identity — players feel immediately "at home" | LOW | Discord provides `user.user_metadata.custom_claims.global_name` (display name) or `user.user_metadata.name` (username with discriminator); prefer global_name if present |
| Google profile picture as starting avatar | Players land in game with a recognizable face — less anonymous than a blank slate | LOW | `user.user_metadata.avatar_url` from Google is a stable CDN URL; write to player profile on first sign-in |
| Username pre-fill (not hard-assign) on first OAuth sign-in | Users may want to change the auto-filled name before it is committed; a "confirm your display name" step avoids unwanted usernames | MEDIUM | Post-OAuth redirect to a /auth/setup page if the player record does not yet exist; pre-fill the name field with provider data; user can edit before confirming |
| Sign-in from within the game lobby flow | Users clicking "Join game" while unauthenticated should complete OAuth and return to the lobby, not the homepage | MEDIUM | Store intended destination (e.g., `/gamerooms?join=abc`) in the OAuth `redirectTo`; the callback route already supports this via `redirect_to` param |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Account linking (connect Google + Discord to same account) | Seems useful — one player can use either provider | Supabase's `user_metadata` is overwritten by each new OAuth sign-in, losing the other provider's data. The linking API (`supabase.auth.linkIdentity`) exists but requires the user to be signed in first and adds significant edge-case complexity (conflicts, email collisions) | Defer to v2; for v1.4 treat each provider as a separate account pathway. Document as known limitation |
| "Login with GitHub / Twitter / etc." | Low effort to add more providers | Dilutes the sign-in UI; adds surface area for OAuth app maintenance; gaming users care about Discord, not GitHub. More providers = more edge cases per provider | Ship Google + Discord only; add others only in response to explicit user demand |
| Auto-merge OAuth account with existing email/password account | "I already registered with email — let me connect my Google" | Account merging on email match is a security risk (pre-account takeover); Supabase does not auto-merge by default; implementing safely requires email verification re-confirmation | Inform users with matching email accounts that the email is already registered; direct them to sign in with email and link later |
| Require a username to be unique when auto-generated from provider | "Pre-fill username and enforce uniqueness immediately" sounds clean | The provider name may already be taken (e.g., "John" from Google); a uniqueness conflict on a field the user never chose creates a confusing error on what should be a seamless flow | On first OAuth sign-in, use a /auth/setup step where the user sees the pre-filled name and can change it; run the existing `check-username` availability check before committing |
| Store provider access token for downstream Discord/Google API calls | "We could show Discord server memberships or Google contacts" | Requires additional OAuth scopes, user consent, and token refresh logic; massively increases implementation scope; not aligned with v1.4 goal | Request only `identify` (Discord) and `profile email` (Google) scopes — the minimum needed for sign-in and profile population |

---

## Feature Dependencies

```
[Supabase project: Google OAuth enabled in dashboard]
    └──required by──> [signInWithOAuth({ provider: 'google' })]

[Supabase project: Discord OAuth enabled in dashboard]
    └──required by──> [signInWithOAuth({ provider: 'discord' })]

[OAuth buttons on /login and /register]
    └──requires──> [Supabase OAuth providers configured in dashboard]
    └──requires──> [/auth/callback handles error param (not just missing code)]

[Display name pre-populated on first sign-in]
    └──requires──> [Detection of first sign-in (player record does not exist yet)]
    └──requires──> [Backend player creation endpoint accepts display_name]
    └──enhanced by──> [/auth/setup confirmation step]

[Avatar pre-populated on first sign-in]
    └──requires──> [Display name pre-populated (same first-sign-in detection path)]
    └──requires──> [Player profile table accepts avatar_url]

[/auth/setup confirmation page (differentiator)]
    └──requires──> [OAuth buttons and callback working correctly]
    └──enhances──> [Display name and avatar pre-population]
    └──requires──> [Existing username availability check API (/players/check-username)]

[Redirect to intended destination after OAuth]
    └──requires──> [OAuth buttons encode redirectTo correctly]
    └──already supported by──> [/auth/callback route (reads redirect_to param)]
```

### Dependency Notes

- **OAuth provider config is a dashboard prerequisite, not code:** Both Google and Discord require app registration in their respective developer consoles, then the credentials are pasted into the Supabase project dashboard. This is infrastructure setup, not implementation work — it must happen before any code is testable.
- **The existing /auth/callback route supports OAuth already:** `exchangeCodeForSession` handles both email magic links and OAuth PKCE codes identically. The only gap is the missing `error` param handling for declined consent.
- **First-sign-in detection requires a backend check:** The frontend cannot reliably tell if this is registration vs. sign-in from the auth event alone. The pattern is: after `SIGNED_IN` fires post-OAuth, check whether the player record exists in the backend; if not, it is a first sign-in and profile population applies.
- **The register page flow cannot directly apply to OAuth users:** The existing `/register` form collects a username upfront and runs the `check-availability` preflight. OAuth users bypass this form. The /auth/setup page replicates this check for OAuth first-sign-ins.

---

## MVP Definition

This is a subsequent milestone (v1.4), not a greenfield project. MVP here means the minimum feature set for OAuth to feel complete and trustworthy to a gaming audience.

### Launch With (v1.4 milestone scope)

- [ ] Google OAuth button on /login — core table stakes
- [ ] Discord OAuth button on /login — gaming audience expectation
- [ ] OAuth buttons on /register as well — consistency
- [ ] /auth/callback: add `error` param handling for declined consent
- [ ] Display name pre-populated from provider on first OAuth sign-in
- [ ] Avatar pre-populated from provider on first OAuth sign-in
- [ ] Email/password auth preserved — no regressions

### Add After Validation (v1.x)

- [ ] /auth/setup confirmation step — allows user to edit auto-filled username before it is committed; trigger: if auto-filled names result in conflicts or user complaints
- [ ] Redirect to intended destination after OAuth — the callback already supports it; the trigger is users reporting they end up on / instead of where they came from

### Future Consideration (v2+)

- [ ] Account linking (connect Google + Discord to same account) — high complexity, known Supabase metadata overwrite issue, defer
- [ ] Additional providers (GitHub, Apple, etc.) — add only on explicit user demand
- [ ] Auto-merge OAuth with existing email account — security-sensitive, defer

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Google OAuth button on /login | HIGH | LOW | P1 |
| Discord OAuth button on /login | HIGH | LOW | P1 |
| OAuth buttons on /register | HIGH | LOW | P1 |
| callback error param handling | HIGH (prevents silent broken state) | LOW | P1 |
| Display name from provider (first sign-in) | HIGH | MEDIUM | P1 |
| Avatar from provider (first sign-in) | MEDIUM | MEDIUM | P1 |
| /auth/setup confirmation step | MEDIUM | MEDIUM | P2 |
| Redirect to intended destination | MEDIUM | LOW | P2 |
| Account linking | LOW (high complexity) | HIGH | P3 (defer) |
| Additional OAuth providers | LOW | LOW per provider | P3 (on demand) |

**Priority key:**
- P1: Must have for v1.4 launch
- P2: Should have, add when core is validated
- P3: Nice to have, future milestone

---

## Implementation Notes

### How Supabase OAuth Works (High confidence)

1. Browser calls `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })` — Supabase returns a URL to the provider's consent screen.
2. Frontend redirects to that URL (`window.location.href = url` or `router.push(url)` — both work for top-level navigation).
3. User authenticates at Google/Discord, grants consent.
4. Provider redirects to the Supabase OAuth callback (configured in Supabase dashboard), which generates a PKCE code.
5. Supabase redirects to `redirectTo` (i.e., `/auth/callback`) with `?code=...` appended.
6. `/auth/callback/route.ts` calls `exchangeCodeForSession(code)` — this sets the session cookie identically to the email flow.
7. User is signed in. `onAuthStateChange` fires `SIGNED_IN`.

The existing `/auth/callback` route handles step 6 already. No changes needed there beyond adding `error` param handling.

### Provider Metadata Shape (Medium confidence — verify at runtime)

**Google:**
- `user.user_metadata.full_name` — display name (e.g., "Jane Smith")
- `user.user_metadata.avatar_url` — profile picture URL (stable Google CDN)
- `user.user_metadata.email` — verified email

**Discord:**
- `user.user_metadata.full_name` — display name (global_name if set, else username)
- `user.user_metadata.avatar_url` — CDN URL constructed by Supabase from Discord's avatar hash
- `user.user_metadata.custom_claims.global_name` — Discord display name (distinct from username)
- Note: `avatar_url` field presence is confirmed by community reports; exact field names should be logged at runtime on first test sign-in and verified before relying on them in production code.

### Known Supabase Issue: user_metadata Overwrite (Low confidence on resolution status)

If a user signs in first with Google, then with Discord (or vice versa), `user.user_metadata` is overwritten by the most recent provider's data. The prior provider's avatar/name is lost from `user_metadata`. This is a known bug (supabase/auth-js issue #1067). The standard mitigation is to copy provider data into a `public.players` profile table immediately on first sign-in — do not rely on `user_metadata` as the source of truth for display name or avatar after the initial population step.

### Supabase Version Caveat (Medium confidence)

A breaking behavior change in `@supabase/supabase-js` v2.91.0 deferred the `SIGNED_IN` event emission after `exchangeCodeForSession` via `setTimeout`, causing OAuth cookie writes to be missed in SSR/serverless. Workaround: pin to v2.90.1 or verify the current installed version is either before this change or that a fix has been released. Check `package.json` before implementation.

---

## Competitor Feature Analysis

| Feature | Kahoot | Quizlet | Cackle (our approach) |
|---------|--------|---------|----------------------|
| Google OAuth | Yes, prominent | Yes | Add in v1.4 |
| Discord OAuth | No | No | Add in v1.4 — differentiator for gaming audience |
| Username confirmation on first OAuth sign-in | No — auto-assigns | No | /auth/setup step (P2) — avoids garbage usernames |
| Account linking | Yes (Google + email) | Yes | Defer to v2 |

Discord OAuth is genuinely uncommon among quiz platforms. It is a real differentiator for a gaming-positioned product.

---

## Sources

- Supabase: Login with Google (official docs): https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase: Login with Discord (official docs): https://supabase.com/docs/guides/auth/social-login/auth-discord
- Supabase: User metadata shape discussion (community): https://github.com/orgs/supabase/discussions/5210
- Supabase: Discord avatar_url discussion (community): https://github.com/orgs/supabase/discussions/3334
- Supabase: user_metadata overwrite bug (auth-js #1067): https://github.com/supabase/auth-js/issues/1067
- Supabase: PKCE flow docs: https://supabase.com/docs/guides/auth/sessions/pkce-flow
- Supabase: Breaking change v2.91.0 SIGNED_IN deferral (supabase-js #2037): https://github.com/supabase/supabase-js/issues/2037
- Supabase: Managing user data: https://supabase.com/docs/guides/auth/managing-user-data

---

*Feature research for: Google and Discord OAuth social login (v1.4 Social Auth milestone)*
*Researched: 2026-03-19*
