---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Social Auth
status: planning
stopped_at: Completed 15-01-PLAN.md — handle_new_user SQL migration written
last_updated: "2026-03-19T12:09:13.490Z"
last_activity: 2026-03-19 — Roadmap created for v1.4, phases 15-16 defined
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 3
  completed_plans: 1
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19)

**Core value:** Players must always know where they are in the game and what their actions mean — reliable state, readable feedback, and visible progress are what keep them coming back.
**Current focus:** v1.4 Social Auth — Phase 15: Provider Infrastructure

## Current Position

Phase: 15 of 16 (Provider Infrastructure)
Plan: — (not yet planned)
Status: Ready to plan
Last activity: 2026-03-19 — Roadmap created for v1.4, phases 15-16 defined

Progress: [░░░░░░░░░░] 0%

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

### Decisions

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

None.

### Blockers/Concerns

- **Backend dependency:** `/players/{id}/sync-oauth` endpoint must exist or be stubbed before Phase 16 profile-sync logic can be fully wired
- **Discord metadata shape:** Log actual `user_metadata` from a live Discord OAuth response during Phase 16 before finalizing sync code

## Session Continuity

Last session: 2026-03-19T12:09:13.489Z
Stopped at: Completed 15-01-PLAN.md — handle_new_user SQL migration written
Resume file: None
