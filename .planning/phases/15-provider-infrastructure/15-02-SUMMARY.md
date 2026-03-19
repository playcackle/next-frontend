---
phase: 15-provider-infrastructure
plan: "02"
subsystem: auth
tags: [supabase, oauth, discord, google, identity-linking]

# Dependency graph
requires:
  - phase: 15-provider-infrastructure
    plan: "01"
    provides: "SQL migration file for handle_new_user trigger"
provides:
  - "Discord OAuth app registered in Discord Developer Portal with Supabase redirect URI"
  - "Discord provider enabled in Supabase Dashboard with client credentials saved"
  - "SQL migration from Plan 01 applied to live Supabase database (handle_new_user function live)"
  - "Manual Linking confirmed disabled — automatic identity linking active"
affects:
  - 16-oauth-ui
  - auth

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase automatic identity linking (Manual Linking OFF) — same email across providers links to one auth.users record"

key-files:
  created: []
  modified: []

key-decisions:
  - "Google OAuth (SETUP-01) deferred — skipped to avoid blocking progress; todo tracked at .planning/todos/pending/2026-03-19-set-up-google-oauth-provider.md"
  - "Discord is the sole active OAuth provider going into Phase 16"
  - "Manual Linking confirmed disabled — Supabase automatic linking is active for cross-provider email matching"

patterns-established: []

requirements-completed:
  - SETUP-02
  - SETUP-03

duration: ~30min
completed: "2026-03-19"
---

# Phase 15 Plan 02: OAuth Provider Registration and Supabase Configuration Summary

**Discord OAuth enabled in Supabase with credentials, trigger migration applied to live DB, automatic identity linking confirmed active — Google OAuth deferred to pending todo**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-19T12:09:13Z
- **Completed:** 2026-03-19
- **Tasks:** 2/2
- **Files modified:** 0 (all changes were external dashboard configuration)

## Accomplishments

- SQL migration (`handle_new_user_oauth.sql`) applied to live Supabase database — handle_new_user function is now active and ready for OAuth sign-ins
- Discord OAuth app registered in Discord Developer Portal with correct Supabase redirect URI
- Discord provider enabled in Supabase Dashboard with client credentials saved
- Supabase Manual Linking confirmed disabled — automatic identity linking is active (same email across providers → single auth.users record)
- Google OAuth (SETUP-01) intentionally deferred; pending todo created with full setup instructions

## Task Commits

This plan consisted entirely of external dashboard configuration steps (no code changes). There are no per-task commits. All configuration lives in Supabase Dashboard and Discord Developer Portal.

1. **Task 1: Apply SQL migration + register Discord OAuth app** - completed via Supabase SQL Editor and Discord Developer Portal
2. **Task 2: Enable Discord in Supabase + confirm identity linking** - completed via Supabase Dashboard → Auth → Providers and Auth → Settings

## Files Created/Modified

None — this plan was entirely external dashboard configuration. No files were created or modified in the repository.

## Decisions Made

- **Google OAuth deferred:** SETUP-01 (Google OAuth) was skipped to avoid blocking the milestone. The trigger migration already handles Google metadata (name/picture fields are in the COALESCE chain), so Google can be enabled later with no code changes. Full setup instructions are tracked in `.planning/todos/pending/2026-03-19-set-up-google-oauth-provider.md`.
- **Discord-first:** Phase 16 OAuth UI will target Discord as the sole active OAuth provider. Google sign-in button should remain hidden/disabled until SETUP-01 is resolved.
- **Automatic linking confirmed:** Supabase Manual Linking is OFF. When a user signs in with Discord using the same email as an existing email/password account, Supabase automatically links the identities to the same `auth.users` record.

## Deviations from Plan

### Partial completion of requirements

**SETUP-01 (Google OAuth) — Deferred**
- **Found during:** Task 1
- **Issue:** Google OAuth app registration was not completed during this plan's execution window
- **Outcome:** Deferred rather than blocked. Discord OAuth (SETUP-02) and identity linking (SETUP-03) are complete. The trigger migration (SETUP-04) is applied.
- **Tracked at:** `.planning/todos/pending/2026-03-19-set-up-google-oauth-provider.md`
- **Impact on Phase 16:** Phase 16 must treat Google as inactive. The "Sign in with Google" button should not be rendered or should be visibly disabled until SETUP-01 is completed.

---

**Total deviations:** 1 (SETUP-01 deferred, not auto-fixable — requires human console access)
**Impact on plan:** Discord OAuth and all infrastructure requirements are complete. Google deferral is low-risk because the trigger migration already supports Google metadata — enabling Google later requires only dashboard steps, not code changes.

## Issues Encountered

None during the steps that were completed.

## User Setup Required

**Google OAuth still needs to be set up manually.** See `.planning/todos/pending/2026-03-19-set-up-google-oauth-provider.md` for full instructions. Summary:

1. Google Cloud Console → Create OAuth 2.0 Client ID (Web application)
2. Set Authorized redirect URI — copy exactly from Supabase Dashboard → Auth → Providers → Google
3. Supabase Dashboard → Auth → Providers → Google → enable, paste credentials, save
4. Privacy Policy URL for consent screen: `<app-base-url>/privacy`
5. Terms of Service URL for consent screen: `<app-base-url>/terms`

## Next Phase Readiness

**Ready for Phase 16 with Discord only:**
- Discord OAuth is fully configured end-to-end
- SQL trigger migration is live in the database
- Automatic identity linking is active
- Phase 16 OAuth UI should implement Discord sign-in as the primary (and only active) provider

**Blocker for Google sign-in:**
- SETUP-01 must be completed before a "Sign in with Google" button is wired up
- The trigger migration already handles Google metadata — no backend code changes needed when Google is eventually enabled

**Discord metadata shape reminder (from STATE.md decisions):**
- Discord `user_name` field is MEDIUM confidence (community-sourced). Log actual `raw_user_meta_data` from a live Discord OAuth response in Phase 16 before finalizing profile-sync code.

---
*Phase: 15-provider-infrastructure*
*Completed: 2026-03-19*
