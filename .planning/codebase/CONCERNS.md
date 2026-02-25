# Codebase Concerns

**Analysis Date:** 2026-02-25

## Tech Debt

### 1. Unresolved Type Safety Bypasses

**Issue:** Multiple instances of `as any`, `@ts-ignore`, and type casting to bypass TypeScript strictness

**Files:**
- `src/app/gameroom/utils.ts`: Line 59-62 - `@ts-ignore` for window.playSoundEffect
- `src/components/sound-effects.tsx`: Lines 37, 224, 225 - `(window as any)` for AudioContext and global sound effect registration
- `src/app/api/players/[...path]/route.ts`: Line 7 - `context.params as any`
- `src/app/api/admin/[...path]/route.ts`: Line 7 - `context.params as any`
- `src/lib/performance-utils.ts`: Lines 2, 10 - `(navigator as any).deviceMemory`
- `src/app/gameroom/hooks/useGameActions.ts`: Line 72 - `animationUpdate: any`

**Impact:** Type safety violations create runtime error risks. Sound effects global registration and navigator property access could fail silently.

**Fix approach:** Replace with proper TypeScript interfaces for window/navigator extensions, create type-safe wrappers for global functions, use conditional type guards instead of assertions.

---

### 2. DOM Access Without Null Safety Verification

**Issue:** Direct DOM element access with non-null assertions that assume elements exist

**Files:**
- `src/app/gameroom/hooks/useGameActions.ts`: Lines 22-27, 93 - `document.getElementById('slot-${slotId}') as HTMLElement` without null check before use
- `src/app/gameroom/hooks/useGameActions.ts`: Line 96 - Creates DOM elements directly without error handling

**Impact:** If elements don't exist in DOM (timing issues, CSS selector mismatches), code silently fails or throws uncaught errors. Animation state becomes inconsistent.

**Fix approach:** Add proper null checks before element access, validate DOM state before applying animations, consider using refs for elements that need animation.

---

### 3. Heavy Use of `@ts-ignore` in Sound Effects System

**Issue:** TypeScript errors bypassed rather than resolved in audio context initialization

**Files:**
- `src/app/gameroom/utils.ts`: Lines 59-62
- `src/components/sound-effects.tsx`: Multiple instances

**Impact:** Future TypeScript upgrades could break this code. Auditory feedback system becomes fragile.

**Fix approach:** Create proper type definitions for window extensions, implement explicit module augmentation for global `playSoundEffect`.

---

### 4. Memory Leaks in setTimeout/setInterval Usage

**Issue:** 24 instances of setTimeout/setInterval scattered across codebase without comprehensive cleanup tracking

**Files:**
- `src/app/gameroom/hooks/useGameActions.ts`: Lines 44-46, 57-66, 75-81 - Timeouts not always cancelled
- `src/app/gameroom/page.tsx`: Line 84-86 - Timeout without ref tracking
- `src/app/gameroom/components/PostGameModal.tsx`: Multiple timeouts
- `src/app/gameroom/components/PostGameShowcase.tsx`: Multiple timeouts

**Impact:** Extended gameplay sessions accumulate timer references. Memory usage grows over time. Component unmounting doesn't guarantee cleanup.

**Fix approach:** Create centralized timer management utility, implement timer cleanup in useEffect return functions, use AbortController for timeout coordination.

---

## Known Bugs

### 1. Configuration Mismatch Resolved (Documented Bug - Status: FIXED)

**Issue:** Frontend/Backend round count mismatch (Frontend expected 10 rounds, backend was configured for 5)

**Files:** `src/app/gameroom/page.tsx`, backend config.py

**Status:** FIXED per PROJECT_STATUS.md (2025-01-09)
- Backend `NUM_ROUNDS_PER_GAME` changed from 5 to 10
- Dynamic `totalRounds` synchronization implemented
- Enhanced logging added

**Remaining work:** Verify in production that games consistently complete all 10 rounds.

---

### 2. Debounced Event Handling Could Mask Timing Issues

**Issue:** WebSocket events are debounced by 50ms, potentially hiding race conditions or timing-sensitive state changes

**Files:** `src/app/gameroom/hooks/useGameSocket.ts`: Lines 169-180

**Cause:** High-frequency `lobby_tick` events debounced to prevent UI lag, but this can mask legitimate state transitions.

**Impact:** Edge cases during round transitions may not trigger expected UI updates. Player experiences state inconsistency during rapid gameplay.

**Workaround:** Manual reconnect available via hook's `reconnect()` function.

---

### 3. Audio Context Resume May Fail Silently

**Issue:** AudioContext resume failures are logged as warnings but don't prevent sound generation attempts

**Files:** `src/components/sound-effects.tsx`: Lines 46-51

**Symptoms:** Sound effects may not play on first user interaction, especially on mobile browsers with audio autoplay restrictions.

**Impact:** First 1-2 sounds in a game might be silent. Player misses audio feedback on initial answers.

**Workaround:** Sounds will play after first successful resume.

---

## Security Considerations

### 1. No Input Validation on Chat/Answer Submissions

**Issue:** User input from UnifiedInputForm is submitted directly without length limits or content validation

**Files:** `src/app/gameroom/components/UnifiedInputForm.tsx`: Lines 36-43

**Current mitigation:** Backend presumably validates, but frontend lacks guards.

**Recommendations:** Add max-length validation on input, sanitize special characters, implement rate limiting for rapid submissions.

---

### 2. WebSocket Token in URL Search Parameters Risk

**Issue:** Auth token passed to WebSocket connection as query parameter visible in logs/network inspection

**Files:** `src/app/gameroom/hooks/useGameSocket.ts`: Line 119

**Current mitigation:** Socket.io library handles auth parameter securely via connection options.

**Recommendations:** Ensure backend validates token claims on every message, rotate tokens periodically, monitor for token leakage in error logs.

---

### 3. Environment Configuration Not Validated at Runtime

**Issue:** Backend URLs from environment variables used without validation that they're reachable

**Files:** Backend URLs passed to hooks but never pinged to verify connectivity status.

**Impact:** If backend service is down or misconfigured, frontend hangs silently during connection attempts.

**Recommendations:** Add connection health check on page load, display offline indicator when services unreachable, implement fallback state.

---

## Performance Bottlenecks

### 1. Leaderboard Component Re-renders Unnecessarily

**Issue:** Leaderboard scores update on every `lobby_tick` (high frequency), triggering full re-render of all player entries

**Files:** `src/app/gameroom/components/LeaderBoard.tsx`: Lines 59-105

**Problem:** O(n×m) complexity where n=players, m=accolades. `getPlayerAccolades()` called for every player on every render.

**Cause:** Component not memoized, accolades lookup not optimized.

**Impact:** With 10 players and animations, leaderboard causes UI lag during active gameplay.

**Improvement path:** Memoize component and child entries, pre-compute accolade map structure using `useMemo`.

---

### 2. useGameState Hook Breaks Memoization

**Issue:** Hook spreads entire gameState object into return value, creating new reference on every call

**Files:** `src/app/gameroom/hooks/useGameState.ts`: Lines 11-22

**Problem:** Components reading single fields (e.g., `roundName`) re-render when unrelated fields (e.g., `timeRemaining`) change.

**Impact:** Unnecessary re-renders of UI components during gameplay, increased CPU usage on lower-end devices.

**Improvement path:** Create granular selector hooks (`useRoundInfo()`, `useTimeRemaining()`) or use Jotai selectors directly. Components only re-render when their specific data changes.

---

### 3. High-Frequency Animation DOM Manipulation

**Issue:** Multiple animations triggered per second modify DOM classes directly in `useGameActions`

**Files:** `src/app/gameroom/hooks/useGameActions.ts`: Lines 20-46, 86-125

**Problem:** Rapid class additions/removals, multiple setTimeout callbacks per animation, creating style recalculations.

**Impact:** Animation frame drops during intense gameplay (multiple simultaneous answers).

**Improvement path:** Batch DOM updates, use CSS transitions instead of class toggling, implement animation frame scheduling.

---

## Fragile Areas

### 1. WebSocket Connection State Not Synchronized with Game State

**Issue:** Socket connection status tracked separately from game state atoms, creating potential divergence

**Files:** `src/app/gameroom/hooks/useGameSocket.ts`, `src/app/gameroom/hooks/useGameEvents.ts`

**Why fragile:** If connection drops and reconnects, game state atoms may hold stale data. User sees old scores/round info until next sync event.

**Safe modification:** Always trigger full state refresh on reconnection, validate state timestamps, clear game state on connection loss.

**Test coverage gap:** No integration tests verify state consistency after network interruptions.

---

### 2. Animation State Can Get Stuck

**Issue:** Animation state cleared via setTimeout, but if browser tabs are inactive, timers may not fire

**Files:** `src/app/gameroom/hooks/useGameActions.ts`: Lines 57-66

**Why fragile:** Animation state persists incorrectly if user switches tabs during animation. Returning to tab shows stale animation state.

**Safe modification:** Listen to visibility change events, clear animation state on page hide, validate animation state on page show.

---

### 3. Message History Unbounded Growth Risk

**Issue:** `unifiedMessagesAtom` stores messages without documented limit

**Files:** `src/app/gameroom/store/gameAtoms.ts` (reference: UNIFIED_INPUT_SYSTEM.md says "Limited to last 100 entries")

**Why fragile:** If limit isn't enforced in reducer, message array grows indefinitely, consuming memory over extended sessions.

**Safe modification:** Implement circular buffer or explicit truncation to 100 messages, add memory logging for diagnostics.

---

### 4. Sound Effects System Global Registration

**Issue:** Sound effect player registered on `window` object with no unregistration on component unmount

**Files:** `src/components/sound-effects.tsx`: Lines 224-225, 237-239

**Why fragile:** If SoundEffects component re-mounts (auth flow, page navigation), multiple handlers could register, creating duplicate sound playback.

**Safe modification:** Store registration count, only register once, cleanup on unmount via useEffect return.

---

## Test Coverage Gaps

### 1. WebSocket Reconnection Scenarios

**Untested area:** Network interruptions, server restart during game, max reconnection attempts exceeded

**Files:** `src/app/gameroom/hooks/useGameSocket.ts`: Lines 77-105

**Risk:** Users experience stuck connections without clear feedback. No tests verify fallback UI displays correctly.

**Priority:** High - Critical for production reliability

---

### 2. Animation State Edge Cases

**Untested area:** Rapid answer submissions, component unmounting during animation, tab visibility changes

**Files:** `src/app/gameroom/hooks/useGameActions.ts`

**Risk:** Animation glitches, memory leaks from uncancelled timeouts, inconsistent visual feedback.

**Priority:** Medium - Affects UX during gameplay

---

### 3. WebSocket Event Ordering

**Untested area:** Events arriving out of order, duplicate events, missing events in sequence

**Files:** `src/app/gameroom/hooks/useGameEvents.ts`

**Risk:** Game state becomes inconsistent (e.g., score update arrives before round start). Scores displayed for wrong round.

**Priority:** High - Causes incorrect game state

---

### 4. Message Stream With Network Latency

**Untested area:** Unified message display with high latency, late-arriving messages from other players, message reordering

**Files:** `src/app/gameroom/components/UnifiedMessages.tsx`

**Risk:** Chat messages appear out of order, answer sniping feedback misleading (showing old answers as current).

**Priority:** Medium - Affects social gameplay experience

---

## Scaling Limits

### 1. Leaderboard Display Capped at 10 Players

**Current capacity:** Hard-coded to display top 10 players

**Files:** `src/app/gameroom/page.tsx`: Line 67 - `scores.slice(0, 10)`

**Limit:** UI layout assumes exactly 10 positions. Games with more players will hide lower ranks.

**Scaling path:** Make leaderboard size dynamic, implement scrolling/pagination for larger player counts, consider splitting into multiple views.

---

### 2. Message Buffer Limited to 100 Entries

**Current capacity:** 100 unified messages (chat + answer attempts combined)

**Files:** Documentation references UNIFIED_INPUT_SYSTEM.md

**Limit:** After 100 messages, older messages discarded. Long games accumulate message loss.

**Scaling path:** Implement server-side message archive with client pagination, or increase client-side buffer if memory permits.

---

## Dependencies at Risk

### 1. Jotai Dependency Risk (Minor)

**Package:** `jotai@^2.15.2`

**Risk:** Major version upgrade could change atom API. Global atom references throughout codebase would require updates.

**Impact:** Breaking changes in state management layer would require refactoring ~20+ files.

**Migration plan:** Create adapter layer for atom operations, pin to minor version, establish upgrade process with comprehensive testing.

---

### 2. Socket.io Dependency Risk (Minor)

**Package:** `socket.io-client@^4.8.1`

**Risk:** Major version upgrade (v5+) would require namespace changes and new API.

**Impact:** WebSocket event handlers would need rewriting in hooks and event processors.

**Migration plan:** Review changelog before upgrades, maintain compatibility wrapper if needed, test reconnection logic thoroughly.

---

### 3. Next.js Rapid Release Cycle

**Package:** `next@^16.0.10`, `react@19.2.1`

**Risk:** React 19 and Next.js 16 are recent releases with limited production battle-testing in community. Edge cases may emerge.

**Impact:** Unexpected rendering behavior, hydration mismatches, performance regressions.

**Migration plan:** Monitor Next.js/React issue trackers, defer major updates until stable release cycle (3+ months), maintain separate staging environment for version testing.

---

## Missing Critical Features

### 1. Connection Error Recovery UI

**Problem:** WebSocket disconnection leaves game in ambiguous state. User doesn't know if connection lost or server down.

**Blocks:** Users can't reliably reconnect after network interruptions. Mobile users on unstable connections experience game interruption.

**Impact:** High - Core reliability issue for multiplayer experience.

**Suggested approach:** Add persistent connection status indicator, implement graceful degradation (show cached state while reconnecting), provide manual reconnect button with clear feedback.

---

### 2. Comprehensive Error Logging

**Problem:** Console errors only visible in browser DevTools. No server-side error tracking.

**Blocks:** Production issues not surfaced. Only identified when users report problems manually.

**Impact:** High - Can't diagnose production issues without user reports.

**Suggested approach:** Integrate error tracking service (Sentry, Rollbar), send critical errors to backend, implement error boundary components.

---

### 3. Game Session Recovery

**Problem:** If browser tab crashes or page reloads, player loses game progress.

**Blocks:** Accidental tab closures during critical moments cause data loss. Players can't resume interrupted games.

**Impact:** Medium - Affects user retention on unstable connections.

**Suggested approach:** Store game state in localStorage, implement recovery modal on page load, add session token validation with backend.

---

## Performance Recommendations Summary

**Quick wins (1-2 hours each):**
1. Memoize LeaderBoard component with optimized accolade lookup
2. Split useGameState into granular selector hooks
3. Add animation state cleanup on visibility changes

**Medium effort (4-8 hours each):**
1. Implement centralized timer management with cleanup
2. Add connection health check on mount
3. Create comprehensive error boundary components

**Strategic (1-2 days each):**
1. Refactor animation system to use CSS transitions over class manipulation
2. Implement server-side message archive with pagination
3. Add Sentry/error tracking integration

---

*Concerns audit: 2026-02-25*
