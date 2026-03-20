---
phase: 15-provider-infrastructure
plan: "01"
subsystem: database
tags: [supabase, postgresql, trigger, oauth, google, discord]

requires: []
provides:
  - "handle_new_user() PostgreSQL trigger function updated with COALESCE fallback chain for multi-provider OAuth metadata"
  - "SQL migration file ready to run in Supabase SQL Editor"
affects:
  - 16-oauth-ui
  - auth

tech-stack:
  added: []
  patterns:
    - "COALESCE(NULLIF(TRIM(field), ''), ...) chain for PostgreSQL trigger metadata reads"
    - "SECURITY DEFINER SET search_path = '' on all trigger functions"
    - "split_part(email, '@', 1) as non-NULL final fallback for display names"

key-files:
  created:
    - supabase/migrations/20260319000000_handle_new_user_oauth.sql
  modified: []

key-decisions:
  - "Use uniform COALESCE fallback chain over provider branching (app_metadata provider check) — more maintainable and covers future providers automatically"
  - "Display name order: name → full_name → user_name → split_part(email) — Google first, Discord last, split_part guarantees non-NULL"
  - "Avatar column is nullable — COALESCE(picture, avatar_url) may return NULL if no provider supplies an avatar, which is acceptable"
  - "split_part lowercase to match plan verification script case-sensitive check"

patterns-established:
  - "Trigger pattern: NULLIF(TRIM(field), '') wraps every metadata read to treat empty strings as NULL"
  - "Migration idempotency: CREATE OR REPLACE FUNCTION without DROP ensures safe re-runs"
  - "Schema comment block at file top documents column assumptions for human reviewers"

requirements-completed:
  - SETUP-04

duration: 1min
completed: "2026-03-19"
---

# Phase 15 Plan 01: Handle New User OAuth Migration Summary

**PostgreSQL handle_new_user() trigger hardened with COALESCE fallback chain covering Google (name/picture), Discord (user_name/avatar_url), and email/password signup — NULL constraint errors on first OAuth sign-in prevented**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-19T12:07:13Z
- **Completed:** 2026-03-19T12:08:11Z
- **Tasks:** 1/1
- **Files modified:** 1

## Accomplishments

- SQL migration file created using CREATE OR REPLACE FUNCTION (idempotent, safe to re-run)
- Display name COALESCE order (name → full_name → user_name → split_part) covers all current OAuth providers plus a guaranteed non-NULL fallback
- Avatar URL COALESCE (picture → avatar_url) covers Google and Discord; nullable so no constraint failure if neither field is present
- Schema assumption comment block included so operator can verify column names before running
- Content verification script (from plan) passes: all required strings present

## Task Commits

Each task was committed atomically:

1. **Task 1: Write handle_new_user SQL migration with COALESCE fallback** - `6c19b3a` (feat)

## Files Created/Modified

- `supabase/migrations/20260319000000_handle_new_user_oauth.sql` - CREATE OR REPLACE FUNCTION handle_new_user() with multi-provider COALESCE fallback, schema assumption comment block, idempotent

## Decisions Made

- Used uniform COALESCE chain over provider-branching (`app_metadata ->> 'provider'`) — avoids maintenance burden as providers are added, exactly as specified in the plan anti-patterns section
- `split_part` in lowercase to satisfy the plan's case-sensitive content verification check (SQL function names are case-insensitive, so behavior is identical)
- Avatar URL COALESCE returns NULL if no provider supplies an avatar — acceptable because the column is nullable per schema assumptions

## Deviations from Plan

None - plan executed exactly as written.

(Minor: `SPLIT_PART` was initially written uppercase; changed to `split_part` to satisfy the content check script's case-sensitive string match. Not a behavioral change — SQL function names are case-insensitive.)

## Issues Encountered

The plan's automated verification script uses a case-sensitive string match for `split_part`. The initial file used `SPLIT_PART` (valid SQL but uppercase). Updated to lowercase to satisfy the check. This is consistent with the research file's example SQL which also uses lowercase.

## User Setup Required

The migration file must be run manually against the Supabase database before any OAuth sign-in is attempted. Steps:

1. Open Supabase Dashboard → SQL Editor
2. Paste contents of `supabase/migrations/20260319000000_handle_new_user_oauth.sql`
3. Verify that the `public.players` table has columns matching the schema assumptions in the file header (id uuid, name text NOT NULL, email text, avatar_url text nullable)
4. Run the migration
5. Verify: `SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';`

## Next Phase Readiness

- SQL migration is ready to copy into Supabase SQL Editor — must be run before Phase 16 begins OAuth UI work
- Phase 16 (OAuth UI) can proceed once this migration is applied and Google/Discord OAuth apps are registered (SETUP-01, SETUP-02 — manual dashboard steps outside this plan's scope)
- Discord `user_name` field is MEDIUM confidence — verify actual `raw_user_meta_data` shape from a live Discord OAuth response in Phase 16 before finalizing profile-sync code

---
*Phase: 15-provider-infrastructure*
*Completed: 2026-03-19*
