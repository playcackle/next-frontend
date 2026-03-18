---
phase: 08-bug-fixes-and-performance
plan: 01
subsystem: ui
tags: [react, jotai, hooks, performance]

# Dependency graph
requires: []
provides:
  - Fixed Rules of Hooks violation in gameroom page.tsx — hooks now unconditionally called before conditional return
  - Replaced full-state useGameState() subscription with granular useSetAtom(updateGameStateAtom)
affects:
  - 08-bug-fixes-and-performance

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hooks-before-guard: all hook calls must precede any conditional early return in React components"
    - "Granular atom subscription: use useSetAtom(writeAtom) instead of full hook wrappers when only write access is needed"

key-files:
  created: []
  modified:
    - src/app/gameroom/page.tsx

key-decisions:
  - "Use optional chaining (gameroom?.game_ws_url ?? '') as hook arguments so WebSocket hooks can be called unconditionally before the !gameroom guard"
  - "Replace useGameState() wrapper with direct useSetAtom(updateGameStateAtom) — avoids subscribing to full game state just for write access"

patterns-established:
  - "Hooks-before-guard: all hook calls must precede any conditional early return in React components"

requirements-completed: [BUG-01, PERF-02]

# Metrics
duration: 5min
completed: 2026-03-17
---

# Phase 8 Plan 01: Fix Rules of Hooks and Granular Atom Subscription in page.tsx Summary

**Eliminated React invariant violation in gameroom page by hoisting all hook calls above the conditional return; replaced full-state useGameState() subscription with targeted useSetAtom(updateGameStateAtom)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-17T13:10:00Z
- **Completed:** 2026-03-17T13:15:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Moved `useGameEvents`, `useChatSocket`, `handleSoundsLoaded` ref, and `onSoundsLoaded` callback above the `if (!gameroom)` early return — eliminating the Rules of Hooks violation
- Replaced `const { updateGameState } = useGameState()` with `const updateGameState = useSetAtom(updateGameStateAtom)` — the component no longer subscribes to the entire game state just to write to it
- Removed the `useGameState` import from page.tsx entirely
- Used optional chaining (`gameroom?.game_ws_url ?? ""`) so WebSocket hooks receive valid (empty) string arguments when `gameroom` is null, keeping calls unconditional

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Rules of Hooks and replace useGameState in page.tsx** - `4590aed` (fix)

## Files Created/Modified
- `src/app/gameroom/page.tsx` - Hooks hoisted before conditional return; useGameState replaced with useSetAtom(updateGameStateAtom)

## Decisions Made
- Use `gameroom?.game_ws_url ?? ""` as the argument to `useGameEvents` and `useChatSocket` when calling them unconditionally — empty string is a safe no-op for WebSocket hooks when the room is not yet loaded
- Remove `useGameState` import entirely rather than keeping it for other potential callers — it was only used for `updateGameState` in this file

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `SlotGrid.tsx` (cannot find module `./SlotTile`) — confirmed present before our changes, logged as out-of-scope, not touched

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BUG-01 resolved: game room page no longer violates Rules of Hooks — safe in React 19 and strict mode
- PERF-02 (page.tsx): granular atom subscription in place; remaining PERF-02 work in other files handled by 08-02
- Pre-existing SlotTile module resolution error remains — should be addressed in a future plan

---
*Phase: 08-bug-fixes-and-performance*
*Completed: 2026-03-17*
