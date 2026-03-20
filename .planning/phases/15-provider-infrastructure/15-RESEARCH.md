# Phase 15: Provider Infrastructure - Research

**Researched:** 2026-03-19
**Domain:** Supabase OAuth provider configuration, identity linking, PostgreSQL trigger hardening
**Confidence:** HIGH (dashboard setup steps), MEDIUM (Discord metadata field names)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SETUP-01 | Google OAuth app registered in Google Cloud Console with Supabase callback URLs | Google Cloud Console OAuth app creation, authorized redirect URIs and JS origins documented |
| SETUP-02 | Discord OAuth app registered in Discord Developer Portal with Supabase callback URLs | Discord Developer Portal app creation steps and redirect URI documented |
| SETUP-03 | Automatic identity linking enabled in Supabase so existing email users don't get duplicate accounts | Confirmed automatic by default; dashboard toggle for manual linking; verified works for matching email addresses |
| SETUP-04 | Database trigger updated to handle OAuth metadata field names without NULL constraint errors | Field name differences per provider documented; COALESCE fallback pattern documented |
</phase_requirements>

---

## Summary

Phase 15 is a configuration and database surgery phase — no new application code is shipped. The work consists of three distinct areas: registering OAuth apps in two external developer consoles (Google Cloud, Discord Developer Portal), verifying Supabase's automatic identity linking behavior, and patching the existing `handle_new_user` PostgreSQL trigger to never fail with a NULL constraint when an OAuth provider supplies different metadata field names than email/password signup.

The trigger fix is the highest-risk item and must be in place before any OAuth sign-in is attempted. Google provides `name` and `picture` in `raw_user_meta_data`; Discord provides `user_name` (not `full_name`) and constructs `avatar_url` from a CDN pattern. The existing trigger was written for email/password signup where `name` is set explicitly — it will produce NULL if it tries to read a field that the OAuth provider does not supply, violating any NOT NULL constraint on the `name` column.

Automatic identity linking in Supabase is on by default for OAuth flows that match an existing verified email address. No code change is needed to enable it — only verification that the Supabase project is not running in manual-link mode. Account linking deferred to v2 (see Deferred Ideas in STATE.md).

**Primary recommendation:** Fix the trigger first (SETUP-04), then configure providers (SETUP-01, SETUP-02), then verify identity linking (SETUP-03) by reading the dashboard setting.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@supabase/supabase-js` | 2.87.1 (installed) | Supabase client | No upgrade needed — stay below 2.91.0 (SIGNED_IN event breaking change) |
| `@supabase/ssr` | ^0.8.0 | SSR session management | No change needed |

No new npm packages are required for this phase. Provider setup is entirely through external dashboards and a SQL migration.

---

## Architecture Patterns

### Existing Auth Flow (unchanged by this phase)

```
Browser → supabase.auth.signInWithOAuth({ provider: 'google' })
        → Supabase redirects → Google/Discord consent page
        → Provider redirects → https://<project>.supabase.co/auth/v1/callback
        → Supabase issues session → redirects to /auth/callback?code=...
        → /auth/callback/route.ts: exchangeCodeForSession(code)
        → Session cookie set → redirect to /
```

The existing `/auth/callback/route.ts` already handles this flow correctly via `exchangeCodeForSession`. No changes needed to this file for Phase 15.

### Trigger Pattern — COALESCE Fallback

**What:** The `handle_new_user` trigger in the Supabase database auto-creates a player record on every new `auth.users` insert. Currently it reads `new.raw_user_meta_data ->> 'name'` (set during email/password signup). OAuth providers use different field names.

**Provider field name mapping (verified from Supabase auth source tests):**

| Provider | Display name field | Avatar field |
|----------|--------------------|--------------|
| Email/password signup | `name` (set in `options.data`) | — |
| Google OAuth | `name` (not `full_name`) | `picture` |
| Discord OAuth | `user_name` | `avatar_url` (CDN-constructed by Supabase) |

**Confirmed from source:**
- Google test: `{"id":"googleTestId","name":"Google Test","picture":"http://example.com/avatar","email":"google@example.com"}`
- Discord test: `{"id":"discordTestId","avatar":"abc","email":"discord@example.com","username":"Discord Test"}` → Supabase maps Discord `username` → metadata `user_name`; avatar → CDN URL stored as `avatar_url`

**COALESCE pattern for the trigger:**

```sql
-- Display name: try Google/email 'name', then Discord 'user_name', then email prefix
COALESCE(
  NULLIF(TRIM(new.raw_user_meta_data ->> 'name'), ''),
  NULLIF(TRIM(new.raw_user_meta_data ->> 'full_name'), ''),
  NULLIF(TRIM(new.raw_user_meta_data ->> 'user_name'), ''),
  split_part(new.email, '@', 1)
) AS display_name

-- Avatar: try Google 'picture', then 'avatar_url' (Discord/generic)
COALESCE(
  NULLIF(new.raw_user_meta_data ->> 'picture', ''),
  NULLIF(new.raw_user_meta_data ->> 'avatar_url', '')
) AS avatar_url
```

The `split_part(new.email, '@', 1)` fallback guarantees a non-NULL display name even if no metadata at all is present.

### Recommended Trigger SQL

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.players (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'user_name'), ''),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'picture', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'avatar_url', '')
    )
  );
  RETURN NEW;
END;
$$;
```

**Note:** The actual column names (`name`, `email`, `avatar_url`) in `public.players` must be verified against the live database schema before writing the migration. The pattern above assumes these columns exist. If `avatar_url` is nullable, the COALESCE there can return NULL safely.

### Anti-Patterns to Avoid

- **Reading metadata without COALESCE:** `NEW.raw_user_meta_data ->> 'name'` returns NULL if the key doesn't exist — fine for nullable columns, fatal for NOT NULL columns.
- **Hardcoding a provider check:** Do not branch on `app_metadata ->> 'provider'` to pick different field names — the COALESCE fallback chain handles all providers uniformly and is more maintainable.
- **Upgrading `@supabase/supabase-js` to >=2.91.0:** A breaking change at that version alters SIGNED_IN event deferral behavior. Stay on 2.87.1.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flow | Custom OAuth redirect + callback | `supabase.auth.signInWithOAuth()` | Token exchange, PKCE, session management all handled |
| Identity linking | Custom user merge logic | Supabase automatic linking | Security-sensitive; email verification required; Supabase handles safely |
| Provider app registration | Nothing to build | Google Cloud Console + Discord Developer Portal dashboards | External registration steps, not code |

---

## Common Pitfalls

### Pitfall 1: NULL Constraint on Trigger Insert
**What goes wrong:** First OAuth sign-in triggers `handle_new_user`, which tries to read a metadata field that doesn't exist for that provider → returns NULL → violates NOT NULL constraint on `name` or similar column → INSERT fails → user auth fails with 500.
**Why it happens:** Trigger was written assuming email/password `name` field; OAuth providers use different keys.
**How to avoid:** Apply the COALESCE fallback trigger before any OAuth sign-in is tested.
**Warning signs:** Auth flow redirects to error URL with `callback_error`; Supabase logs show trigger failure.

### Pitfall 2: Callback URL Mismatch
**What goes wrong:** Google or Discord rejects the OAuth flow with "redirect_uri_mismatch" or similar error.
**Why it happens:** The URL registered in the provider's developer portal does not exactly match the URL Supabase sends during the redirect. Even trailing slashes matter.
**How to avoid:** Copy the callback URL from the Supabase dashboard provider page — do not type it manually. For hosted Supabase: `https://<project-ref>.supabase.co/auth/v1/callback`.
**Warning signs:** OAuth consent screen shows an error before returning to the app.

### Pitfall 3: Unverified Email Blocks Identity Linking
**What goes wrong:** An email/password user whose email is not verified tries to sign in via OAuth with the same email — Supabase does NOT link automatically; creates a new account instead.
**Why it happens:** Automatic linking requires verified email on both sides (security requirement).
**How to avoid:** Ensure email/password users have verified email before testing the merge scenario.
**Warning signs:** Duplicate records appear in `auth.users` for the same email.

### Pitfall 4: Discord `username` vs `user_name` in raw_user_meta_data
**What goes wrong:** Trigger reads `'user_name'` but Discord's raw API response uses `'username'`. Supabase auth normalizes this — but if tested before normalization is understood, wrong field may be read.
**Why it happens:** Discord API uses `username`; Supabase's auth server maps it to `user_name` in `raw_user_meta_data` (confirmed via auth test assertions).
**How to avoid:** Use `'user_name'` in trigger (Supabase-normalized), not Discord's raw `'username'`. Include `full_name` in the fallback chain as insurance.
**Warning signs:** Display name shows empty string or NULL even when Discord user has a username.

### Pitfall 5: Supabase `@supabase/supabase-js` 2.91.0 Breaking Change
**What goes wrong:** Upgrading Supabase JS to 2.91.0+ changes how `SIGNED_IN` events are deferred, breaking the `useUser` hook behavior (LCP regression + potential infinite refresh documented in v1.3 fixes).
**Why it happens:** Breaking change in event sequencing at that version.
**How to avoid:** Pin `@supabase/supabase-js` to `^2.87.1` (current). Do not upgrade as part of this phase.

---

## Code Examples

### Initiating OAuth Sign-In (Phase 16 preview — do not implement in Phase 15)
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

### Verifying Automatic Identity Linking (no code — dashboard check)
Supabase Dashboard → Authentication → Settings → confirm "Manual Linking" is **disabled** (off = automatic linking is active). No env var or code change needed.

### Testing Trigger via SQL (Supabase SQL Editor)
```sql
-- Simulate a Google OAuth user insert to verify trigger handles metadata correctly
-- Run in Supabase SQL Editor AFTER applying the updated trigger
SELECT public.handle_new_user() FROM auth.users LIMIT 0; -- just validates function exists

-- Manual test: insert a fake auth.users row (only possible in local dev or with service role)
-- In production, test by performing an actual OAuth sign-in flow
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual identity linking required | Automatic by email match | Supabase Auth v2 | No code needed for SETUP-03 |
| OAuth trigger breakage silently ignored | Trigger failure blocks signup | Always | Must fix trigger before enabling OAuth |

**Deprecated/outdated:**
- `linkUser` (old API): Replaced by `auth.linkIdentity()`. Not needed for SETUP-03 (automatic).

---

## Validation Architecture

> `workflow.nyquist_validation` key is absent from `.planning/config.json` — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test runner configured |
| Config file | None |
| Quick run command | n/a — manual verification only |
| Full suite command | n/a |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETUP-01 | Google OAuth app registered, Supabase callback URL accepted | manual | — | N/A |
| SETUP-02 | Discord OAuth app registered, Supabase callback URL accepted | manual | — | N/A |
| SETUP-03 | Same-email OAuth sign-in merges to one `auth.users` record | manual | — | N/A |
| SETUP-04 | Trigger handles all provider metadata without NULL error | manual (SQL) | `SELECT public.handle_new_user()` syntax check in SQL editor | N/A |

**All requirements are manual-only** because:
- SETUP-01 and SETUP-02 require live external developer console access and real OAuth credentials.
- SETUP-03 requires an active OAuth flow against real providers.
- SETUP-04 can be partially validated via SQL syntax check and a simulated user row test in Supabase SQL Editor.

### Wave 0 Gaps
None — no automated test framework additions needed. All acceptance is manual.

---

## Open Questions

1. **Exact `public.players` table schema**
   - What we know: Trigger inserts to `public.players`; column `name` exists (used in email/password flow); `avatar_url` column existence is assumed.
   - What's unclear: Are there other NOT NULL columns? Does `avatar_url` exist? Is there a unique constraint on `name`?
   - Recommendation: Read the live schema from Supabase Dashboard → Table Editor before writing the SQL migration. The trigger SQL in this research is a template, not a final script.

2. **Discord `user_name` field confirmation on live response**
   - What we know: Supabase auth test file uses `username` in mock data; the Supabase backend normalizes this to `user_name` in `raw_user_meta_data` (based on test assertions showing the mapped name, and STATE.md noting this is MEDIUM confidence).
   - What's unclear: Whether the normalization is `user_name` or keeps `username` key in the JSONB stored to Postgres.
   - Recommendation: After SETUP-02 is complete and Discord app registered, perform one test Discord OAuth sign-in in a dev/staging environment and inspect `auth.users.raw_user_meta_data` directly via SQL Editor to confirm field names. Log the shape before committing the trigger. STATE.md already flags this.

3. **Whether `supabase/config.toml` exists for local dev**
   - What we know: No `supabase/` directory found in the repo; project uses hosted Supabase dashboard.
   - What's unclear: Whether local Supabase CLI is used for any developer workflow.
   - Recommendation: All configuration is via the hosted Supabase Dashboard and external developer consoles. No config.toml work is needed.

---

## Sources

### Primary (HIGH confidence)
- [Supabase Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google) — callback URL format, GCP console steps
- [Supabase Login with Discord](https://supabase.com/docs/guides/auth/social-login/auth-discord) — Discord Developer Portal steps, provider enable via dashboard or Management API
- [Supabase Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking) — automatic linking default behavior, email verification requirement
- [Supabase User Management](https://supabase.com/docs/guides/auth/managing-user-data) — trigger pattern, `raw_user_meta_data` structure
- [Supabase auth external_discord_test.go](https://github.com/supabase/auth/blob/master/internal/api/external_discord_test.go) — Discord metadata field names from source tests
- [Supabase auth external_google_test.go](https://github.com/supabase/auth/blob/master/internal/api/external_google_test.go) — Google metadata field names from source tests

### Secondary (MEDIUM confidence)
- [Boardshape: Pull Google profile on Supabase signup](https://boardshape.com/engineering/how-to-pull-google-profile-through-on-account-creation-with-supabase) — COALESCE trigger pattern for multi-provider, `picture`/`avatar_url` fallback
- [Human Who Codes: Local Supabase OAuth](https://humanwhocodes.com/snippets/2025/08/setup-local-supabase-oauth-logins/) — config.toml OAuth structure (not applicable — project uses hosted Supabase)
- [Supabase Discussion #2818 — Local Social Login](https://github.com/orgs/supabase/discussions/2818) — local dev callback URL patterns

### Tertiary (LOW confidence)
- Community reports that Supabase normalizes Discord `username` → `user_name` in `raw_user_meta_data` — unverified against Supabase auth server source; confirmed indirectly via test file assertion values. Must verify with live OAuth response.

---

## Metadata

**Confidence breakdown:**
- Provider registration steps (SETUP-01, SETUP-02): HIGH — official docs, clear dashboard UI steps
- Automatic identity linking (SETUP-03): HIGH — official docs confirm default behavior
- Trigger field names for Google: HIGH — verified from Supabase auth test source
- Trigger field names for Discord: MEDIUM — `user_name` inferred from test assertions; must confirm against live raw_user_meta_data
- COALESCE fallback pattern: HIGH — standard PostgreSQL + community verified

**Research date:** 2026-03-19
**Valid until:** 2026-06-19 (stable Supabase Auth behavior; provider console UIs change slowly)
