---
phase: 10-sentry-foundation
plan: "02"
subsystem: infra
tags: [sentry, supabase, socket.io, observability, error-capture]

# Dependency graph
requires:
  - phase: 10-sentry-foundation plan 01
    provides: src/lib/sentry.ts with setSentryUser, setSentryGameContext, clearSentryUser, captureException helpers
provides:
  - SentryUserSync component keeping Sentry user scope in sync with Supabase auth
  - provider.tsx globally mounting SentryUserSync for all pages
  - gameroom/page.tsx attaching game_ws_url as room identifier to Sentry context on room connect
  - useGameSocket connect_error handler with 30-second deduplication guard calling captureException
  - useChatWs socket error handler calling captureException with source:chat_socket_error tag
affects: [11-web-vitals, 12-performance-monitoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Module-level deduplication guard (let lastConnectErrorCapture = 0) for rate-limiting Sentry captures in reconnect storms
    - SentryUserSync as a null-rendering client component subscribing to supabase.auth.onAuthStateChange

key-files:
  created:
    - src/components/SentryUserSync.tsx
  modified:
    - src/app/provider.tsx
    - src/app/gameroom/page.tsx
    - src/app/gameroom/hooks/useGameSocket.ts
    - src/app/gameroom/hooks/useChatWs.ts

key-decisions:
  - "gameroom?.game_ws_url used as room identifier instead of gameroom?.id — LobbyJoinSuccess type has no id field; game_ws_url uniquely identifies the room connection"
  - "Module-level deduplication guard in useGameSocket rather than useRef — hook remounts on each reconnect cycle; per-instance ref would reset and allow flooding"

patterns-established:
  - "Null-render client components for side-effect-only subscriptions (SentryUserSync pattern)"
  - "Module-level rate-limiting guards for Sentry capture in reconnect-storm-prone hooks"

requirements-completed: [OBS-02, OBS-05]

# Metrics
duration: 10min
completed: 2026-03-18
---

# Phase 10 Plan 02: Sentry Context Wiring Summary

**Supabase auth identity and game room WS URL wired into Sentry scope, with deduplication-guarded socket error capture across both game and chat sockets**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-18T07:44:58Z
- **Completed:** 2026-03-18T07:55:00Z
- **Tasks:** 3 of 3 (all complete, including human-verify checkpoint)
- **Files modified:** 5

## Accomplishments
- Created SentryUserSync component that subscribes to Supabase auth changes and calls setSentryUser/clearSentryUser automatically for all pages
- Mounted SentryUserSync globally in provider.tsx between PerformanceInitializer and PerformanceModal
- Added setSentryGameContext call in gameroom/page.tsx triggered when game_ws_url becomes available
- Added 30-second deduplication guard and captureException in useGameSocket connect_error handler (module-level to survive hook remounts)
- Added captureException with source:chat_socket_error tag in useChatWs error handler

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SentryUserSync component and wire into provider.tsx** - `f9af682` (feat)
2. **Task 2: Attach game room context and socket error capture** - `80e7461` (feat)
3. **Task 3: Verify Sentry events reach dashboard** - human-approved (Tests 1 and 2 passed: user identity visible in Sentry, gameroom context shows non-null roomId)

## Files Created/Modified
- `src/components/SentryUserSync.tsx` - Null-render client component keeping Sentry user scope in sync with Supabase auth
- `src/app/provider.tsx` - Added SentryUserSync mount inside JotaiProvider
- `src/app/gameroom/page.tsx` - Calls setSentryGameContext when game_ws_url is available
- `src/app/gameroom/hooks/useGameSocket.ts` - Module-level deduplication guard + captureException in connect_error handler
- `src/app/gameroom/hooks/useChatWs.ts` - captureException with source tag in socket error handler

## Decisions Made
- Used `gameroom.game_ws_url` instead of `gameroom.id` as the Sentry room identifier. The `LobbyJoinSuccess` type (from `src/actions/joinGameroom.ts`) does not have an `id` field — the plan assumed one existed. `game_ws_url` uniquely identifies the room connection and is non-null when in a game room.
- Kept the deduplication guard at module level (`let lastConnectErrorCapture = 0`) rather than using `useRef`. The hook unmounts and remounts during reconnect cycles, so a per-instance ref resets on each mount and would allow flooding. Module scope persists across hook lifecycles.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used game_ws_url instead of non-existent .id field for game room context**
- **Found during:** Task 2 (game room context attachment)
- **Issue:** Plan specified `gameroom?.id` as the room identifier, but `LobbyJoinSuccess` type has no `id` field. TypeScript error TS2339: Property 'id' does not exist on type 'LobbyJoinSuccess'.
- **Fix:** Changed to `gameroom?.game_ws_url` which is the actual URL that uniquely identifies the room connection
- **Files modified:** src/app/gameroom/page.tsx
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** 80e7461 (Task 2 commit)

**2. [Rule 1 - Bug] Added explicit TypeScript types to SentryUserSync callback parameters**
- **Found during:** Task 1 (SentryUserSync component creation)
- **Issue:** `noImplicitAny` TS rule flagged callback parameters in getUser().then() and onAuthStateChange() as implicitly `any`
- **Fix:** Imported `AuthChangeEvent` and `Session` from `@supabase/supabase-js` and added explicit type annotations
- **Files modified:** src/components/SentryUserSync.tsx
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** f9af682 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for TypeScript correctness. Semantic intent preserved — game_ws_url serves the same identification purpose. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 10 (Sentry Foundation) is fully complete — both plans (01 and 02) executed and human-verified
- Sentry pipeline operational: SDK init, tunnel route, user identity sync, game room context, socket error capture
- Requirements OBS-02 and OBS-05 satisfied
- Phase 11 (Web Vitals) can begin immediately

---
*Phase: 10-sentry-foundation*
*Completed: 2026-03-18*
