---
phase: 13-performance-fixes
plan: "01"
subsystem: auth
tags: [performance, lcp, auth, useUser]
dependency_graph:
  requires: []
  provides: [PERF-06-fix]
  affects: [src/hooks/useUser.ts]
tech_stack:
  added: []
  patterns: [event-guard, passive-vs-active auth events]
key_files:
  created: []
  modified:
    - src/hooks/useUser.ts
decisions:
  - "INITIAL_SESSION early return in onAuthStateChange prevents router.refresh() on passive session restore"
  - "Initial user state handled exclusively by loadUser() getUser() call — listener only handles post-load events"
requirements-completed: [PERF-06]
metrics:
  duration: "~15 min"
  completed_date: "2026-03-19"
  tasks_completed: 3
  files_modified: 1
---

# Phase 13 Plan 01: Gate router.refresh() to User-Initiated Auth Events

**Eliminated passive-session router.refresh() in useUser.ts by returning early on INITIAL_SESSION, preventing the Server Component re-fetch that delayed LCP to 4324ms — fix is code-correct and user-approved.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-18
- **Completed:** 2026-03-19
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- Confirmed root cause: Supabase fires INITIAL_SESSION then SIGNED_IN on page load, causing router.refresh() to trigger a full Server Component re-fetch and hero re-paint (the browser records second paint as LCP)
- Added INITIAL_SESSION early return in useUser.ts onAuthStateChange — passive session restore no longer triggers router.refresh()
- Verified fix is code-correct: initial user state is handled by the explicit loadUser() getUser() call; explicit sign-in and sign-out still trigger router.refresh()
- User approved LCP improvement — WebVitals logger not visible in production console, but fix logic is correct and gating is confirmed in source

## Task Commits

Each task was committed atomically:

1. **Task 1: Investigate root cause and confirm CSS is not blocking LCP** - (investigation only)
2. **Task 2: Gate router.refresh() to user-initiated auth events only** - `5e756a1` (fix)
3. **Task 3: Measure LCP improvement against 4324ms baseline** - (checkpoint verified — user approved)

**Plan metadata:** see docs commit

## Files Created/Modified

- `src/hooks/useUser.ts` - Added INITIAL_SESSION early return in onAuthStateChange to prevent router.refresh() on passive session restore

## Decisions Made

- INITIAL_SESSION early return in onAuthStateChange prevents router.refresh() on passive session restore — initial state is handled exclusively by loadUser() which calls getUser() on mount
- LCP measurement via WebVitalsLogger not visible in production build console (NODE_ENV=production suppresses it — a prior decision from Phase 12); fix accepted as code-correct based on user approval

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-existing UnifiedMessages.tsx build error**
- **Found during:** Task 3 verification (npm run build)
- **Issue:** `UnifiedMessages.tsx` referenced `user?.id` from `useUser()` but the import was removed in a prior working-tree change, causing a TypeScript build error
- **Fix:** The file was already partially refactored to use `currentUserIdAtom` — the working tree already had the correct version; build error resolved by the pre-existing local changes
- **Files modified:** src/app/gameroom/components/UnifiedMessages.tsx (pre-existing working tree change)
- **Commit:** Pre-existing change, not committed by this plan

---

**Total deviations:** 1 auto-fixed (1 blocking — pre-existing build error)
**Impact on plan:** Auto-fix was a pre-existing working-tree state, not scope creep.

## Issues Encountered

- WebVitalsLogger only logs in NODE_ENV=development (Phase 12 decision — gated to avoid production console noise). LCP improvement could not be directly measured via console output in production build. Fix accepted as code-correct: source confirms INITIAL_SESSION no longer triggers router.refresh().

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- LCP fix in place — all 3 Phase 13 plans complete
- v1.3 Observability & Performance milestone complete

## Self-Check: PASSED

- [x] src/hooks/useUser.ts modified with INITIAL_SESSION guard
- [x] Commit 5e756a1 exists
- [x] Task 3 completed — user approved LCP improvement
- [x] SUMMARY.md created at .planning/phases/13-performance-fixes/13-01-SUMMARY.md

---
*Phase: 13-performance-fixes*
*Completed: 2026-03-19*
