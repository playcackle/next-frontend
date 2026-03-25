---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Social Auth
status: planning
stopped_at: Completed 15-03-PLAN.md — Discord OAuth end-to-end verified, metadata shape confirmed, Phase 15 complete
last_updated: "2026-03-25T19:41:12.231Z"
last_activity: 2026-03-25
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 67
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19)

**Core value:** Players must always know where they are in the game and what their actions mean — reliable state, readable feedback, and visible progress are what keep them coming back.
**Current focus:** v1.4 Social Auth — Phase 15: Provider Infrastructure

## Current Position

Phase: 16 of 16 (oauth ui and profile sync)
Plan: Not started
Status: Ready to plan
Last activity: 2026-03-25

Progress: [███████░░░] 67%

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (this milestone)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

## Accumulated Context

| Phase 15 P01 | 1min | 1 tasks | 1 files |
| Phase 15 P02 | ~30min | 2 tasks | 0 files |
| Phase 15 P03 | ~15min | 1 tasks | 0 files |

### Decisions

**Phase 15 P03:**

- Discord raw_user_meta_data confirmed from live response: use user_name for display name, avatar_url for avatar — all Phase 16 sync code must use these keys
- Supabase redirect allowlist must include localhost for local dev OAuth flows (one-time setup)
- Name editing for OAuth users is future work — no update endpoint in player_manager yet

**Phase 15 P02:**

- Google OAuth (SETUP-01) deferred — Discord is sole active provider going into Phase 16; todo tracked in .planning/todos/pending/
- Supabase Manual Linking confirmed disabled — automatic identity linking is active
- Phase 16 OAuth UI should render Discord sign-in only; Google button should be hidden/disabled until SETUP-01 todo is resolved

**v1.4 context (pre-execution):**

- Phase 15 must complete before Phase 16 — OAuth UI is untestable without provider configuration and DB trigger fix in place
- DB trigger COALESCE fallback is the highest-risk item — must precede first OAuth sign-in attempt in any environment
- SETUP-05 (next.config.mjs remotePatterns) placed in Phase 16 — only relevant once profile-sync avatar display code exists
- Account linking (LINK-01, LINK-02) deferred to v2 — known user_metadata overwrite bug in current Supabase SDK (auth-js#1067)
- `/players/{id}/sync-oauth` backend endpoint does not yet exist — if not scoped in this milestone, stub with no-op and ship separately
- Discord user_metadata field names are MEDIUM confidence (community-sourced) — log actual shape from live response before committing production sync code
- Verify @supabase/supabase-js resolves below 2.91.0 before any planned upgrade (SIGNED_IN event deferral breaking change at 2.91.0)
- [Phase 15]: Uniform COALESCE fallback chain (name→full_name→user_name→split_part) over provider-branching — more maintainable for future providers
- [Phase 15]: Avatar column nullable so COALESCE(picture, avatar_url) returning NULL is safe — no constraint failure if provider supplies no avatar

### Pending Todos

- [SETUP-01] Set up Google OAuth provider — `.planning/todos/pending/2026-03-19-set-up-google-oauth-provider.md`

### Blockers/Concerns

- **Backend dependency:** `/players/{id}/sync-oauth` endpoint must exist or be stubbed before Phase 16 profile-sync logic can be fully wired
- ~~**Discord metadata shape:** Log actual `user_metadata` from a live Discord OAuth response during Phase 16 before finalizing sync code~~ — RESOLVED in Phase 15 P03: user_name + avatar_url confirmed

## Session Continuity

Last session: 2026-03-25T00:00:00.000Z
Stopped at: Completed 15-03-PLAN.md — Discord OAuth end-to-end verified, metadata shape confirmed, Phase 15 complete
Resume file: None
