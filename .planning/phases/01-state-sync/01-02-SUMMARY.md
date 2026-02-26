---
phase: 01-state-sync
plan: 02
subsystem: ui
tags: [websocket, socket.io, react, reconnection, state-sync, hooks]

# Dependency graph
requires:
  - "01-01: stale closure fix and reconnecting loading gate"
provides:
  - "Connect handler that emits request_state_sync on reconnects in useGameSocket"
  - "round_over handler that emits request_state_sync after setting isRoundBreak in useGameEvents"
  - "Unified handleLobbySyncRef with isPostGameShowcase and loading: false in both versions"
affects: [state-sync, ui-loading, reconnection, answer-reveal, post-game-showcase]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Functional setSocketState((prev) => ...) to read reconnectAttempts and conditionally emit on reconnect"
    - "sendEventRef pattern: capture sendEvent in a ref updated via useEffect to avoid stale closure in non-reactive callbacks"
    - "Emit request_state_sync after round_over so lobby_state_sync delivers full slots to AnswerReveal"

key-files:
  created: []
  modified:
    - src/app/gameroom/hooks/useGameSocket.ts
    - src/app/gameroom/hooks/useGameEvents.ts

key-decisions:
  - "Emit request_state_sync inside setSocketState functional updater — socket is connected at this point and the emit is synchronous before state commit"
  - "Use sendEventRef (same ref-capture pattern as other refs in useGameEvents) to call sendEvent from handleRoundOverRef without stale closure risk"
  - "Cast sendEventRef.current as (e: string, d: any) => void for request_state_sync — event not in EventPayloadMap, cast is safe since backend silently ignores unknown events"
  - "Add loading: false to both handleLobbySyncRef versions — once lobby_state_sync arrives state is confirmed and loading gate should clear"

patterns-established:
  - "Pattern: Emit outbound-only events inside setSocketState functional update — safe when socket is guaranteed connected at that point"
  - "Pattern: sendEventRef for calling sendEvent from stale-closure-prone callbacks — consistent with other ref patterns in useGameEvents"

requirements-completed: [STATE-01, STATE-03]

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 1 Plan 02: State Sync Wire-Up Summary

**JWT-style state recovery: reconnect and round-over both emit request_state_sync so the client always lands in the correct game phase with full slot data**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-26T09:07:16Z
- **Completed:** 2026-02-26T09:08:37Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Fixed the reconnect sync gap: `useGameSocket` connect handler now uses functional `setSocketState((prev) => ...)` to read `prev.reconnectAttempts`, and emits `"request_state_sync"` only when `isReconnect` is true — players re-entering mid-game land in the correct phase
- Fixed `AnswerReveal` empty slots: `handleRoundOverRef` now emits `request_state_sync` after setting `isRoundBreak: true`, triggering a `lobby_state_sync` response from the backend with full `slots` data
- Fixed `handleLobbySyncRef` divergence: the `useEffect` version now includes `isPostGameShowcase: data.status === "POST_GAME_SHOWCASE"` and `loading: false`, matching the initial ref exactly — players joining during `POST_GAME_SHOWCASE` see the post-game screen correctly
- Added `sendEventRef` to capture `sendEvent` stably across renders — same ref-capture pattern used throughout the file

## Task Commits

Each task was committed atomically:

1. **Task 1: Emit request_state_sync on reconnect in connect handler** - `a6aa19b` (feat)
2. **Task 2: Fix handleLobbySyncRef divergence and wire round_over to request sync** - `c036986` (fix)

## Files Created/Modified

- `src/app/gameroom/hooks/useGameSocket.ts` — Connect handler switched to functional `setSocketState`, reads `prev.reconnectAttempts`, emits `request_state_sync` on reconnects
- `src/app/gameroom/hooks/useGameEvents.ts` — Added `sendEventRef`, `handleRoundOverRef` emits `request_state_sync`, both `handleLobbySyncRef` versions include `isPostGameShowcase` and `loading: false`

## Decisions Made

- Emitting `request_state_sync` inside `setSocketState`'s functional updater is safe — socket is connected at this point (the `connect` event has fired) and `socket.emit` is synchronous before React commits the state update
- Used type cast `(sendEventRef.current as (e: string, d: any) => void)` for `request_state_sync` since this event is not in `EventPayloadMap` — the backend silently ignores unrecognized client-emitted events, so the cast is safe
- Did not add `request_state_sync` to the `gameEvents` array in `initializeSocket` — it is outbound-only and should never appear as a received event

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- STATE-01: `round_over` now triggers `request_state_sync` — `AnswerReveal` will always have populated `slots`
- STATE-02: Already completed in Plan 01 (loading gate covers full reconnection window)
- STATE-03: Reconnect now triggers `request_state_sync` — UI transitions to correct phase after network recovery
- All three STATE requirements for Phase 1 are now addressed
- Manual verification can be done via DevTools WebSocket inspector: after `round_over`, confirm `request_state_sync` appears in outbound messages and `lobby_state_sync` arrives in response

## Self-Check: PASSED

- FOUND: `src/app/gameroom/hooks/useGameSocket.ts`
- FOUND: `src/app/gameroom/hooks/useGameEvents.ts`
- FOUND: `.planning/phases/01-state-sync/01-02-SUMMARY.md`
- FOUND: commit `a6aa19b` (feat: emit request_state_sync on reconnect)
- FOUND: commit `c036986` (fix: handleLobbySyncRef divergence + round_over sync)
- TypeScript: zero errors
- Next.js build: successful

---
*Phase: 01-state-sync*
*Completed: 2026-02-26*
