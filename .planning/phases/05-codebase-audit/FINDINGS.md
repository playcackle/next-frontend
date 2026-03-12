# Codebase Audit Findings

**Date:** 2026-03-12
**Codebase:** Quiz Game Frontend (~13,000 LOC)
**Scope:** `src/` — all components, hooks, atoms, utilities

---

## Summary

The codebase is functionally operational but carries two confirmed runtime bugs that silently degrade user experience: a Rules of Hooks violation in the main gameroom page that can crash React on first render, and an answer-reveal animation that never fires due to a string/number id type mismatch. Beyond these bugs, the most consequential structural issue is a dual performance mode system — a Jotai atom and a React context — using different localStorage keys, making it impossible for performance mode settings to be consistent across the app. The codebase shows a clear pattern of components subscribing to a full monolithic game state atom instead of the granular derived selectors that already exist, causing unnecessary re-renders on every game tick. Type safety is undermined primarily by suppression (`@ts-ignore`, `as any`, `as unknown as`) rather than genuinely unmodeled types; most suppressions could be eliminated by adding a few interface extensions to the existing `navigator.d.ts`.

**Finding counts:**
- Total findings: 41
- HIGH impact: 6 (2 bugs, 4 quality/perf/arch/type issues)
- MEDIUM impact: 18
- LOW impact: 17

---

## Bugs (Confirmed, Fix Immediately)

These findings represent confirmed runtime failures — not code smell or theoretical risks. They are reproduced by reading the source and confirming the behavior at runtime.

**[FINDING-A01]** `src/app/gameroom/page.tsx:100–115` — Rules of Hooks violation. `useGameEvents()` (line 105) and `useChatSocket()` (line 112) are called after `if (!gameroom) { return <div>Loading gameroom...</div>; }` at line 100. React enforces that hooks must not be called conditionally or after an early return. On first render, `gameroom` is `null` (atom not yet hydrated), causing React to execute the early return path without calling these hooks. On subsequent renders when `gameroom` is populated, React calls them — violating the rule that the same hooks must be called in the same order every render. This will cause a React invariant violation crash in development and unpredictable behavior in production.
Impact: HIGH
Effort: LOW
Remediation: Move all hook calls (`useGameEvents`, `useChatSocket`, `getBaseWsUrl`, `handleUnifiedSubmit`) to before the conditional return. The `sendEvent`, `sendChatMessage`, and derived values can then be passed as needed after the return guard.

**[FINDING-T10]** `src/app/gameroom/components/AnswerReveal.tsx:30` — `as unknown as QuizAnswer` hides a confirmed runtime type mismatch. `Slot.id` is `string` (verified in `types/state.ts:4`). `QuizAnswer.id` is declared as `number` (line 8 of `AnswerReveal.tsx`). The double-cast launders a `string` into a `number` without coercion. `visibleAnswers` is typed `number[]` (line 16) but populated with string values at runtime. `visibleAnswers.includes(x.id)` on line 62 does strict-equality comparison: a `number[]` is searched for a `string` value — this always returns `false`. The `styles.visible` CSS class is never applied. The answer reveal animation never fires.
Impact: HIGH
Effort: LOW
Remediation: Change `QuizAnswer.id` type to `string`. Change `visibleAnswers` state to `string[]`. Remove the `as unknown as QuizAnswer` cast — the mapping `id: x.id` is already correct since both are `string`. Also replace `useGameState()` with `useAtomValue(slotsAtom)` (see FINDING-P02).

---

## Quick Wins (HIGH impact, LOW effort — or MEDIUM impact, LOW effort)

These findings offer the highest return on remediation effort. All have Effort: LOW.

| Priority | Finding ID | File | Summary | Impact |
|----------|-----------|------|---------|--------|
| 1 | FINDING-A01 | `page.tsx:100–115` | Rules of Hooks violation — crash on first render | HIGH |
| 2 | FINDING-T10 | `AnswerReveal.tsx:30` | as unknown as QuizAnswer — reveal animation never fires | HIGH |
| 3 | FINDING-P06 | `useGameActions.ts:86–162` | All visual effects bypass performanceModeAtom | HIGH |
| 4 | FINDING-A06 | `performance-atom.ts` vs `performance-context.tsx` | Dual performance systems, different localStorage keys | HIGH (Effort: MEDIUM) |
| 5 | FINDING-Q12 | `useGameActions.ts:86–162` | DOM manipulation mixed with React state, no cleanup guard | HIGH (Effort: MEDIUM) |
| 6 | FINDING-Q01 | `sound-effects.tsx` | 1,448-line file — ~10% of codebase in one file | HIGH (Effort: MEDIUM) |
| 7 | FINDING-Q13 | `useGameEvents.ts:185–209` | 9 onEvent calls discard cleanup callbacks — listener accumulation | MEDIUM |
| 8 | FINDING-A09 | `useGameEvents.ts:185–209` | Same issue — onEvent cleanups not captured | MEDIUM |
| 9 | FINDING-P01 | `LeaderBoard.tsx:85` | useGameState() instead of scoresAtom/accoladesAtom | MEDIUM |
| 10 | FINDING-P02 | `AnswerReveal.tsx:19` | useGameState() instead of slotsAtom | MEDIUM |
| 11 | FINDING-P03 | `PostGameShowcase.tsx:80` | useGameState() instead of scoresAtom/playerAccoladesAtom | MEDIUM |
| 12 | FINDING-P04 | `page.tsx:55` | useGameState() for setter only — subscribes to full read | MEDIUM |
| 13 | FINDING-P09 | `package.json:18` | animate.css version unpinned ("latest") | MEDIUM |
| 14 | FINDING-P12 | `AnswerReveal.tsx:35–50` | setTimeout cleanup missing — stale callbacks on unmount | MEDIUM |
| 15 | FINDING-A05 | Multiple files | Bot Bob detection string duplicated in 3 places | MEDIUM |
| 16 | FINDING-T05 | `useGameActions.ts:72` | animationUpdate: any — should be Partial<AnimationState> | MEDIUM |
| 17 | FINDING-T06 | `useGameState.ts:40` | triggerAnimation(type: string, value: any) — should be typed generic | MEDIUM |

---

## Code Quality (AUDIT-01)

All findings from 05-01-FINDINGS-DRAFT.md. Sorted HIGH to LOW impact.

### Oversized Components

**[FINDING-Q01]** `src/components/sound-effects.tsx:1–1448` — File is 1,448 lines. Contains a Web Audio API singleton, AudioContext lifecycle management, ~17 synthesized sound generator functions (each manually wiring oscillators, filters, and gain nodes), a global `playSoundEffect` window assignment, and a thin React `SoundEffects` component. Nearly 10% of the entire codebase in a single file. Audio DSP code is entirely non-React and should live in a pure module.
Impact: HIGH
Effort: MEDIUM
Remediation: Extract all audio synthesis functions and the `AudioContext` singleton into `src/lib/audio/sound-engine.ts`. Keep `SoundEffects` component in `src/components/sound-effects.tsx` as a thin wrapper (~30 lines). Apply `dynamic(() => import("./SoundEffects"), { ssr: false })` at the import site in `page.tsx` to enable code splitting.

**[FINDING-Q02]** `src/lib/api/admin.ts:1–913` — File is 913 lines. A single `AdminApiClient` class with ~30+ methods spanning lobby management, collection management, slot management, topic management, and AI generation. Several methods return `Promise<any>` (lines 658, 674, 691, 710, 726, 742). Not on the game-critical path but difficult to navigate.
Impact: MEDIUM
Effort: MEDIUM
Remediation: Split into domain-specific clients: `LobbyAdminClient`, `ContentAdminClient`, `AIAdminClient`. Extract typed response interfaces for each method group. Replace `Promise<any>` return types with concrete response interfaces.

---

### Duplication

**[FINDING-Q03]** `src/app/gameroom/page.tsx:198–233` vs `src/app/gameroom/components/LeaderBoard.tsx` — Inline in-game leaderboard (lines 198–233 of page.tsx) and the `Leaderboard` component share identical display logic: rank number, display name, score. The inline version renders `scores.slice(0, 10).map(...)` directly in JSX. The `Leaderboard` component renders the round-break variant. Approximately 35 lines of duplicated layout logic. Additionally, the inline version has a dead `&& false` condition on line 210.
Impact: MEDIUM
Effort: LOW
Remediation: Extract a shared `LeaderboardRow` component. Pass a `compact` prop to control whether rank-change animations and accolades are shown. Remove the `&& false` dead condition.

**[FINDING-Q04]** `src/app/gameroom/components/PostGameShowcase.tsx:20–75` and `src/app/gameroom/components/LeaderBoard.tsx:34–82` — Both files define a local `AccoladeChip` function component with nearly identical structure: `showPopover` state, `popoverPosition` state, `chipRef`, `isMounted` state, `useEffect` for mount, `useEffect` for position calculation on hover, and `createPortal` rendering. The only difference is prop shape. Approximately 60 lines of duplicated component logic.
Impact: MEDIUM
Effort: LOW
Remediation: Extract to `src/app/gameroom/components/AccoladeChip.tsx` with a unified prop interface. Both files import from the shared component.

**[FINDING-Q05]** `src/app/gameroom/hooks/useGameEvents.ts:40–59` and `src/app/gameroom/hooks/useGameEvents.ts:151–182` — `handleLobbySyncRef` is initialized with a handler function at declaration (lines 40–59) then reassigned inside a `useEffect` at lines 152–172 with nearly identical logic. The initial ref value is overwritten on first mount, making the initialization dead code. Minor semantic difference: initial uses `data.topic_name || ""` while useEffect uses `data.topic_name`. `handleSubmissionFeedbackRef` shows the same pattern (lines 135–149 and 174–181).
Impact: MEDIUM
Effort: LOW
Remediation: Remove the inline handler from the `useRef(...)` call, initializing as `useRef<(data: LobbySyncPayload) => void>(null!)`. Assign the handler exclusively inside the `useEffect`.

---

### Naming Inconsistencies

**[FINDING-Q06]** `src/app/gameroom/components/LeaderBoard.tsx:84` — Filename is `LeaderBoard.tsx` (capital B) but the exported function is `Leaderboard` (lowercase b).
Impact: LOW
Effort: LOW
Remediation: Rename file to `Leaderboard.tsx`. Update the import in `page.tsx`.

**[FINDING-Q07]** `src/app/gameroom/hooks/useChatWs.ts:19` — File is named `useChatWs.ts` but exports `useChatSocket`. Inconsistent with other hooks using "Socket" suffix.
Impact: LOW
Effort: LOW
Remediation: Rename file to `useChatSocket.ts`. Update the import in `page.tsx`.

**[FINDING-Q08]** `src/app/gameroom/components/PostGameModal.tsx:56` — File is named `PostGameModal.tsx` but exports `PostgameAccolades`. Component is not a modal — it is a slideshow.
Impact: LOW
Effort: LOW
Remediation: Rename file to `PostgameAccolades.tsx` or `PostGameAccoladesSlideshow.tsx`. Update the import in `PostGameShowcase.tsx`.

**[FINDING-Q09]** `src/app/gameroom/components/SlotTile.tsx:10–16` — Interface `SlotTileProps` declares `isBonus?: boolean`, `revealDelay: number`, and `entranceDelay: string` as props. The component destructures only `{ slot, className }`. The `React.memo` comparator on lines 117–128 references `prevProps.revealDelay` and `prevProps.entranceDelay`, creating an inconsistency: the comparator checks props the component ignores.
Impact: LOW
Effort: LOW
Remediation: Remove `isBonus`, `revealDelay`, and `entranceDelay` from the interface and from the `React.memo` comparator.

---

### Dead Code

**[FINDING-Q10]** `src/app/gameroom/page.tsx:210` — `player.display_name === "You" && false` is always `false`. The `nameFlash` styling is permanently disabled.
Impact: LOW
Effort: LOW
Remediation: Remove `&& false`. Implement proper "current player" detection using authenticated user ID. If nameFlash is intentionally disabled, remove the ternary entirely.

**[FINDING-Q11]** `src/app/gameroom/hooks/useGameEvents.ts:40–59` and `135–149` — Initial ref values for `handleLobbySyncRef` and `handleSubmissionFeedbackRef` are dead code (overwritten on mount). See also FINDING-Q05.
Impact: LOW
Effort: LOW
Remediation: See FINDING-Q05 remediation.

---

### Complexity Hotspots

**[FINDING-Q12]** `src/app/gameroom/hooks/useGameActions.ts:86–162` — `triggerCorrectAnswerEffects` (~77 lines) mixes DOM mutations (`document.createElement`, `document.body.appendChild`, `element.style.animation`), React state updates (`updateAnimationState`), sound playback, and 3 separate `setTimeout` callbacks for cleanup. No checks against `performanceModeAtom`. Fragile to test and prone to memory leaks if slots unmount before timeouts complete.
Impact: HIGH
Effort: MEDIUM
Remediation: Gate all DOM effects on `performanceModeAtom`. Extract `colorBurstOverlay` and `successGlow` into CSS-class-based animations driven by React state. Use a single cleanup ref to cancel pending timeouts on re-trigger.

**[FINDING-Q13]** `src/app/gameroom/hooks/useGameEvents.ts:185–209` — The `useEffect` block registers 9 socket event handlers via `onEvent`. `onEvent` returns a cleanup callback but the `useEffect` body never captures these return values. Socket listeners are never explicitly removed. If `onEvent` referentially changes, old listeners accumulate.
Impact: MEDIUM
Effort: LOW
Remediation: `const cleanups = [onEvent("lobby_state_sync", ...), ...]; return () => cleanups.forEach(fn => fn?.());`

---

## Performance (AUDIT-02)

All findings from 05-01-FINDINGS-DRAFT.md. Sorted HIGH to LOW impact.

### Re-render Patterns

**[FINDING-P01]** `src/app/gameroom/components/LeaderBoard.tsx:85` — `useGameState()` subscribes to full `gameStateAtom`. `scoresAtom` and `accoladesAtom` already exist as derived selectors. The component re-renders on every `timeRemaining` tick even though it is only shown during round breaks.
Impact: MEDIUM
Effort: LOW
Remediation: Replace `useGameState()` with `const scores = useAtomValue(scoresAtom)` and `const accolades = useAtomValue(accoladesAtom)`.

**[FINDING-P02]** `src/app/gameroom/components/AnswerReveal.tsx:19` — `useGameState()` subscribes to full `gameStateAtom`. `slotsAtom` already exists as a derived selector.
Impact: MEDIUM
Effort: LOW
Remediation: Replace `useGameState()` with `const slots = useAtomValue(slotsAtom)`.

**[FINDING-P03]** `src/app/gameroom/components/PostGameShowcase.tsx:80` — `useGameState()` subscribes to full `gameStateAtom`. `scoresAtom` and `playerAccoladesAtom` both exist as derived selectors.
Impact: MEDIUM
Effort: LOW
Remediation: Replace `useGameState()` with `const scores = useAtomValue(scoresAtom)` and `const playerAccolades = useAtomValue(playerAccoladesAtom)`.

**[FINDING-P04]** `src/app/gameroom/page.tsx:55` — `const { updateGameState } = useGameState()` subscribes to full state reads to obtain only the setter. `updateGameStateAtom` is a write-only atom.
Impact: MEDIUM
Effort: LOW
Remediation: Replace with `const updateGameState = useSetAtom(updateGameStateAtom)`.

**[FINDING-P05]** `src/app/gameroom/components/UnifiedMessages.tsx:76` — `key={index}` uses array index as React key. Any removal operation (e.g., the 100-message cap trim) causes all visible messages to re-render.
Impact: LOW
Effort: LOW
Remediation: Use `key={msg.timestamp + msg.player_id}` as a stable composite key.

---

### Animation / Performance Mode Bypass

**[FINDING-P06]** `src/app/gameroom/hooks/useGameActions.ts:86–162` — `triggerCorrectAnswerEffects` unconditionally executes all visual effects: `colorBurstOverlay` DOM injection, screen shake, `successGlow` DOM injection, Jotai animation state updates, `applyDOMAnimation`. None check `performanceModeAtom`. This violates the PROJECT.md constraint: "Animations must respect `performanceModeAtom` — no new animations that bypass the performance toggle."
Impact: HIGH
Effort: LOW
Remediation: Import `performanceModeAtom` in `useGameActions`. Add `const performanceMode = useAtomValue(performanceModeAtom)` and guard DOM effects: `if (!performanceMode) { /* DOM animations */ }`. Always execute sound and Jotai state, but skip DOM overlays and screen shake when performance mode is on.

**[FINDING-P07]** `src/components/sound-effects.tsx:1431–1437` — `playSound` (the `window.playSoundEffect` assignment) does not check `performanceModeAtom`. Sound playback proceeds regardless of performance mode.
Impact: LOW
Effort: LOW
Remediation: Consult with product on whether performance mode should suppress sounds. If yes: import `performanceModeAtom` in `SoundEffects` component and pass it as a parameter to the `playSound` callback registered on `window`. If no: add a code comment documenting the deliberate choice.

---

### Bundle Characteristics

**[FINDING-P08]** `src/components/sound-effects.tsx` — 1,448 lines of Web Audio API synthesis code are bundled into the main gameroom route chunk. No `dynamic()` import or code-splitting mechanism.
Impact: MEDIUM
Effort: MEDIUM
Remediation: Apply `const SoundEffects = dynamic(() => import("@/components/sound-effects"), { ssr: false })` in `page.tsx`. Move the 17 sound synthesis functions to a separate module loaded only when first sound playback is requested.

**[FINDING-P09]** `package.json:18` — `"animate.css": "latest"` is unpinned. An `npm install` or Dependabot update could silently break animation class names used throughout the codebase.
Impact: MEDIUM
Effort: LOW
Remediation: Pin to the current installed version: `"animate.css": "^4.1.1"`.

**[FINDING-P10]** `package.json:15` — `"@radix-ui/themes": "latest"` is also unpinned. Radix Themes has had breaking API changes between major versions.
Impact: LOW
Effort: LOW
Remediation: Pin to the current resolved version (e.g., `"@radix-ui/themes": "^3.0.0"`).

**[FINDING-P11]** `package.json:25` — `gsap` is a runtime dependency (`"gsap": "^3.13.0"`) used only in `src/components/loading-grid.tsx`. ~80KB runtime bundle addition for loading animation only; not on the gameroom critical path.
Impact: LOW
Effort: MEDIUM
Remediation: Consider replacing the loading grid animation with CSS animations. If GSAP is kept, apply `dynamic()` import to `loading-grid.tsx`.

---

### Slow Render Paths

**[FINDING-P12]** `src/app/gameroom/components/AnswerReveal.tsx:35–50` — N `setTimeout` calls for staggered answer reveal. Cleanup function calls only `setVisibleAnswers([])` — it does not cancel pending timeouts. Stale `setTimeout` callbacks can fire on unmounted or re-initialized component.
Impact: MEDIUM
Effort: LOW
Remediation: Collect timeout IDs and cancel in cleanup:
```ts
const timeoutIds: ReturnType<typeof setTimeout>[] = [];
answers.forEach((answer, index) => {
  timeoutIds.push(setTimeout(() => {
    setVisibleAnswers((prev) => [...prev, answer.id]);
  }, index * 400));
});
return () => { setVisibleAnswers([]); timeoutIds.forEach(clearTimeout); };
```

**[FINDING-P13]** `src/app/gameroom/components/AnswerReveal.tsx:24–31` — See FINDING-T10. The `as unknown as QuizAnswer` assertion causes reveal animation to never fire. Listed here as a performance/render path finding (also documented as a confirmed bug in the Bugs section above).
Impact: HIGH
Effort: LOW
Remediation: See FINDING-T10.

**[FINDING-P14]** `src/app/gameroom/components/PostGameModal.tsx:50` — `getTopAccolades(accolades)` assigns colors via `COLORS[Math.floor(Math.random() * COLORS.length)]`. Called in both `useState` initialization and `useEffect` on `[isOpen, accolades, fireConfetti]`. Colors change on every re-render, causing player cards to flash different colors.
Impact: LOW
Effort: LOW
Remediation: Use `getPlayerColor(player.player_id)` (already defined in `gameroom/utils.ts`) for deterministic colors.

**[FINDING-P15]** `src/app/gameroom/page.tsx:64–95` — The `useEffect` tracking score position changes schedules `setPlayerAnimations(new Map())` via `setTimeout(..., 600)` without cancelling the previous timeout. If `scores` updates rapidly, the 600ms timeout may clear animations prematurely.
Impact: LOW
Effort: LOW
Remediation: Track timeout ref and call `clearTimeout` before setting a new one.

---

## Architecture (AUDIT-03)

All findings from 05-02-AUDIT-NOTES.md. Sorted HIGH to LOW impact.

### Hook Boundary Issues

**[FINDING-A01]** `src/app/gameroom/page.tsx:100–115` — Rules of Hooks violation: `useGameEvents()` and `useChatSocket()` are called after `if (!gameroom) { return ... }` at line 100. React requires hooks to be called in the same order on every render. This is a confirmed crash risk. See Bugs section above.
Impact: HIGH
Effort: LOW
Remediation: Move all hook calls to before the conditional return.

**[FINDING-A02]** `src/app/gameroom/hooks/useGameEvents.ts:40–59` — `handleLobbySyncRef` and `handleSubmissionFeedbackRef` are initialized with full handler functions, then immediately overwritten by a `useEffect` on mount. Initial values are dead code. Minor semantic discrepancy: initial handler uses `|| ""` fallback for `topic_name`; useEffect handler does not.
Impact: MEDIUM
Effort: LOW
Remediation: Initialize refs as `useRef(null!)` with typed signature. Assign exclusively inside the `useEffect`.

**[FINDING-A03]** `src/app/gameroom/page.tsx:108–110` — `getBaseWsUrl` is an inline function defined inside the component body after a conditional return. Redeclared on every render.
Impact: LOW
Effort: LOW
Remediation: Move to module scope in `utils.ts`.

---

### State Management Anti-Patterns

**[FINDING-A04]** `src/app/gameroom/store/gameAtoms.ts:107–122` — `resetGameStateAtom` duplicates the `animationStateAtom` initial value inline (lines 110–121). The canonical initial value is the atom's default at lines 70–81. Any shape change requires updating two locations.
Impact: LOW
Effort: LOW
Remediation: Extract `initAnimationState` as a named constant. Reference in both `animationStateAtom` definition and `resetGameStateAtom`.

**[FINDING-A05]** Multiple files — Bot Bob detection logic (`player_id === "botbob" || display_name.toLowerCase() === "botbob"`) duplicated in three places: `gameAtoms.ts:134–135`, `UnifiedMessages.tsx:43–46`, and `utils.ts:133`.
Impact: MEDIUM
Effort: LOW
Remediation: Extract `isBotBob(player_id: string, display_name: string): boolean` to `utils.ts`. Import in all three call sites.

**[FINDING-A06]** `src/atoms/performance-atom.ts` vs `src/contexts/performance-context.tsx` — Two parallel performance mode systems with different localStorage keys (`"triviabox-performance-mode"` vs `"performanceMode"`). Both apply the same `document.body.classList` class. Settings from one system are invisible to the other. The context also handles `prefers-reduced-motion` detection (absent from the atom).
Impact: HIGH
Effort: MEDIUM
Remediation: Delete `performance-context.tsx` and `PerformanceProvider`. Migrate all `usePerformance()` consumers to `useAtomValue(performanceModeAtom)`. Add reduced-motion detection to the Jotai atom layer.

---

### Data Flow Issues

**[FINDING-A07]** `src/app/gameroom/hooks/useGameState.ts:16–21` — `useGameState` spreads full `gameState` into its return value. Every consumer subscribes to the full `gameStateAtom`, defeating the granular derived selectors. Confirmed callers needing only 1–2 fields: `AnswerReveal.tsx` (slots), `LeaderBoard.tsx` (scores, accolades), `PostGameShowcase.tsx` (scores, playerAccolades), `page.tsx` (updateGameState).
Impact: MEDIUM
Effort: LOW
Remediation: Each call site should use granular atomic selectors. After migration, restrict `useGameState` to expose only `updateGameState` and `resetGameState`, or remove it entirely.

**[FINDING-A08]** `src/app/gameroom/hooks/useGameEvents.ts:77` — `sendEventRef.current` is cast as `(e: string, d: any) => void` to emit `request_state_sync` — an event not in the `GameEvent` union type.
Impact: MEDIUM
Effort: LOW
Remediation: Add `"request_state_sync"` to the `GameEvent` union. Add `request_state_sync: undefined` to `EventPayloadMap`. Remove the cast.

**[FINDING-A09]** `src/app/gameroom/hooks/useGameEvents.ts:185–209` — 9 `onEvent(...)` calls discard their returned cleanup callbacks. If `onEvent` referentially changes, listener wrappers accumulate in the `Set` without being removed. See also FINDING-Q13.
Impact: MEDIUM
Effort: LOW
Remediation: `const cleanups = [onEvent(...), ...]; return () => cleanups.forEach(fn => fn?.());`

---

## Type Safety (AUDIT-04)

All findings from 05-02-AUDIT-NOTES.md. Sorted HIGH to LOW impact.

### `as unknown as` Assertions

**[FINDING-T10]** `src/app/gameroom/components/AnswerReveal.tsx:30` — `as unknown as QuizAnswer` launders a `string` id into a `number` id, causing `visibleAnswers.includes(x.id)` to always return `false`. Reveal animation never fires. See Bugs section for full analysis.
Impact: HIGH
Effort: LOW
Remediation: Change `QuizAnswer.id` to `string`. Change `visibleAnswers` to `string[]`. Remove the cast.

### `as any` Usage

**[FINDING-T05]** `src/app/gameroom/hooks/useGameActions.ts:72` — `setAnimationWithTimeout(animationUpdate: any)`. Should be `Partial<AnimationState>`. Allows callers to pass arbitrary objects bypassing `AnimationState` type constraints.
Impact: MEDIUM
Effort: LOW
Remediation: Change signature to `(animationUpdate: Partial<AnimationState>, timeout = 400)`. Import `AnimationState` from `../types/state`.

**[FINDING-T06]** `src/app/gameroom/hooks/useGameState.ts:40` — `triggerAnimation(type: string, value: any)`. Both key and value are unconstrained despite `AnimationState` being a concrete type with 10 known fields.
Impact: MEDIUM
Effort: LOW
Remediation: Change to `triggerAnimation<K extends keyof AnimationState>(type: K, value: AnimationState[K])`.

**[FINDING-T13]** `src/lib/api/admin.ts` — Multiple `Promise<any>` return types (lines ~658, 674, 691, 710 and additional methods). Callers lose type safety for all downstream API response handling.
Impact: MEDIUM
Effort: MEDIUM
Remediation: Define typed response interfaces for each method group. Related to FINDING-Q02 (splitting the class).

**[FINDING-T07]** `src/app/api/admin/[...path]/route.ts:21` — `context.params as any` used to check if params is a Promise. A type guard would be cleaner.
Impact: LOW
Effort: LOW
Remediation: Add `isPromiseLike` type guard. Remove `as any` cast.

**[FINDING-T02]** `src/app/gameroom/hooks/useGameEvents.ts:199` — `onEvent("game_over", (data: any) => ...)`. `GameOverPayload` is imported and used correctly in the delegate. The `any` annotation is inconsistent.
Impact: LOW
Effort: LOW
Remediation: Change to `(data: GameOverPayload)`.

**[FINDING-T03]** `src/app/gameroom/hooks/useGameSocket.ts:63` — `error?: any` in `debouncedErrorLog`. Acceptable for catch-block error logging but `unknown` would be more strict.
Impact: LOW
Effort: LOW
Remediation: Change to `error?: unknown` for strict-mode alignment. Acceptable as-is.

**[FINDING-T04]** `src/app/gameroom/hooks/useGameSocket.ts:214` — `socket.on(eventName, (data: any) => ...)`. Structurally necessary seam between socket.io's untyped API and the typed listener registry.
Impact: LOW
Effort: LOW
Remediation: Acceptable as-is — this is the internal dispatch layer. The typed contract is enforced at the `onEvent()` consumer level.

**[FINDING-T08]** `src/lib/performance-utils.ts:8,38` — `(navigator as any).deviceMemory`. `navigator.d.ts` already declares `deviceMemory?: number`, making these casts unnecessary.
Impact: LOW
Effort: LOW
Remediation: Remove `as any`. Use `navigator.deviceMemory ?? 4` directly.

### `@ts-ignore` Usage

**[FINDING-T01]** `src/app/gameroom/utils.ts:59,61` — Two `// @ts-ignore` comments suppress errors on `window.playSoundEffect`. Correct fix is a Window interface extension.
Impact: LOW
Effort: LOW
Remediation: Add `interface Window { playSoundEffect?: (type: SoundType) => void; }` to `src/types/navigator.d.ts`. Remove both `// @ts-ignore` comments.

**[FINDING-T09]** `src/components/sound-effects.tsx:37` — `(window as any).webkitAudioContext`. Vendor-prefixed API not in standard Window type.
Impact: LOW
Effort: LOW
Remediation: Add `interface Window { webkitAudioContext?: typeof AudioContext; }` to `src/types/navigator.d.ts`.

### EventPayloadMap Gaps

**[FINDING-T11]** `src/app/gameroom/types/payloads.ts:204` — `submit_answer: any` in `EventPayloadMap`. The event sends a `string`. The `any` forces a conditional override in `sendEvent`'s signature.
Impact: LOW
Effort: LOW
Remediation: Change to `submit_answer: string`. Remove the `T extends "submit_answer" ? string : ...` special-case in `sendEvent`.

**[FINDING-T12]** `src/app/gameroom/hooks/useGameEvents.ts:77` — `request_state_sync` not in `GameEvent` union; emitted via cast. See FINDING-A08.
Impact: LOW
Effort: LOW
Remediation: Add to `GameEvent` union and `EventPayloadMap`. Remove cast.

---

## Priority Order for v1.2

Ordered by impact/effort ratio — quick wins first, larger refactors last.

| Priority | Finding ID | File | Summary | Impact | Effort |
|----------|-----------|------|---------|--------|--------|
| 1 | FINDING-A01 | `page.tsx:100–115` | Rules of Hooks violation — crash risk | HIGH | LOW |
| 2 | FINDING-T10 / FINDING-P13 | `AnswerReveal.tsx:30` | as unknown as — reveal animation never fires (confirmed bug) | HIGH | LOW |
| 3 | FINDING-P06 | `useGameActions.ts:86–162` | All effects bypass performanceModeAtom | HIGH | LOW |
| 4 | FINDING-P12 | `AnswerReveal.tsx:35–50` | setTimeout cleanup missing — stale callbacks | MEDIUM | LOW |
| 5 | FINDING-Q13 / FINDING-A09 | `useGameEvents.ts:185–209` | onEvent cleanup callbacks discarded — listener accumulation | MEDIUM | LOW |
| 6 | FINDING-P01 | `LeaderBoard.tsx:85` | useGameState() → use scoresAtom/accoladesAtom | MEDIUM | LOW |
| 7 | FINDING-P02 | `AnswerReveal.tsx:19` | useGameState() → use slotsAtom | MEDIUM | LOW |
| 8 | FINDING-P03 | `PostGameShowcase.tsx:80` | useGameState() → use granular selectors | MEDIUM | LOW |
| 9 | FINDING-P04 | `page.tsx:55` | useGameState() for setter → useSetAtom | MEDIUM | LOW |
| 10 | FINDING-A05 | Multiple | Bot Bob detection duplicated 3x | MEDIUM | LOW |
| 11 | FINDING-A07 | `useGameState.ts:16–21` | useGameState spreads full atom — defeats selectors | MEDIUM | LOW |
| 12 | FINDING-A08 | `useGameEvents.ts:77` | request_state_sync not in GameEvent union | MEDIUM | LOW |
| 13 | FINDING-A02 | `useGameEvents.ts:40–59` | handleLobbySyncRef initialized with dead code | MEDIUM | LOW |
| 14 | FINDING-Q05 / FINDING-Q11 | `useGameEvents.ts` | Ref double-initialization dead code | MEDIUM | LOW |
| 15 | FINDING-Q03 | `page.tsx` vs `LeaderBoard.tsx` | Inline leaderboard duplicates LeaderBoard component | MEDIUM | LOW |
| 16 | FINDING-Q04 | `PostGameShowcase.tsx` / `LeaderBoard.tsx` | AccoladeChip duplicated in two files | MEDIUM | LOW |
| 17 | FINDING-P09 | `package.json:18` | animate.css unpinned ("latest") | MEDIUM | LOW |
| 18 | FINDING-T05 | `useGameActions.ts:72` | animationUpdate: any → Partial<AnimationState> | MEDIUM | LOW |
| 19 | FINDING-T06 | `useGameState.ts:40` | triggerAnimation(string, any) → typed generic | MEDIUM | LOW |
| 20 | FINDING-T08 | `performance-utils.ts:8,38` | (navigator as any).deviceMemory — unnecessary cast | LOW | LOW |
| 21 | FINDING-T01 | `utils.ts:59,61` | @ts-ignore for window.playSoundEffect | LOW | LOW |
| 22 | FINDING-T11 | `payloads.ts:204` | submit_answer: any → string | LOW | LOW |
| 23 | FINDING-T12 | `useGameEvents.ts:77` | request_state_sync not in type union | LOW | LOW |
| 24 | FINDING-T02 | `useGameEvents.ts:199` | game_over handler: data: any → GameOverPayload | LOW | LOW |
| 25 | FINDING-Q10 | `page.tsx:210` | Dead && false condition | LOW | LOW |
| 26 | FINDING-P05 | `UnifiedMessages.tsx:76` | key={index} → stable composite key | LOW | LOW |
| 27 | FINDING-P14 | `PostGameModal.tsx:50` | Random color on re-render → deterministic color | LOW | LOW |
| 28 | FINDING-P15 | `page.tsx:64–95` | Animation clear timeout not cancelled | LOW | LOW |
| 29 | FINDING-A03 | `page.tsx:108–110` | getBaseWsUrl inline function → module scope | LOW | LOW |
| 30 | FINDING-A04 | `gameAtoms.ts:107–122` | animationState initial value duplicated | LOW | LOW |
| 31 | FINDING-Q06 | `LeaderBoard.tsx:84` | Filename casing mismatch | LOW | LOW |
| 32 | FINDING-Q07 | `useChatWs.ts:19` | Filename/export name mismatch | LOW | LOW |
| 33 | FINDING-Q08 | `PostGameModal.tsx:56` | File named Modal, exports Accolades | LOW | LOW |
| 34 | FINDING-Q09 | `SlotTile.tsx:10–16` | Unused props in interface + memo comparator | LOW | LOW |
| 35 | FINDING-T07 | `route.ts:21` | context.params as any → type guard | LOW | LOW |
| 36 | FINDING-T09 | `sound-effects.tsx:37` | (window as any).webkitAudioContext | LOW | LOW |
| 37 | FINDING-P07 | `sound-effects.tsx:1431` | playSound bypasses performanceModeAtom (product decision) | LOW | LOW |
| 38 | FINDING-P10 | `package.json:15` | @radix-ui/themes unpinned | LOW | LOW |
| 39 | FINDING-A06 | `performance-atom.ts` / `performance-context.tsx` | Dual performance systems, different localStorage keys | HIGH | MEDIUM |
| 40 | FINDING-Q12 | `useGameActions.ts:86–162` | triggerCorrectAnswerEffects — DOM+state mix, no perf guard | HIGH | MEDIUM |
| 41 | FINDING-Q01 | `sound-effects.tsx` | 1,448-line file — bundle and maintainability | HIGH | MEDIUM |
| 42 | FINDING-P08 | `sound-effects.tsx` | No dynamic() import — bundled in main chunk | MEDIUM | MEDIUM |
| 43 | FINDING-T13 | `admin.ts` | Multiple Promise<any> return types | MEDIUM | MEDIUM |
| 44 | FINDING-Q02 | `admin.ts` | 913-line AdminApiClient — split by domain | MEDIUM | MEDIUM |
| 45 | FINDING-P11 | `loading-grid.tsx` | GSAP 80KB — loading-only dependency | LOW | MEDIUM |

---

## Tooling Output

### TypeScript (`npx tsc --noEmit`)

```
(no output — exit code 0)
```

The TypeScript compiler reports zero errors. This is expected: findings documented above are suppressed by `as any`, `as unknown as`, and `@ts-ignore`. A clean tsc does not indicate type safety; it indicates suppressions are in place. Removing the suppressions would surface the underlying type errors.

### Lint (`npm run lint`)

```
> snapscore@0.1.0 lint
> eslint .

sh: eslint: command not found
```

ESLint is configured in `package.json` but the `eslint` binary was not found in the PATH during the audit. Lint results could not be assessed. Run `npm install && npx eslint src/` in the project root to assess lint warnings.

### Type Safety Grep (`@ts-ignore`, `as any`, `as unknown`)

```
src//app/gameroom/utils.ts:59:    // @ts-ignore
src//app/gameroom/utils.ts:61:      // @ts-ignore
src//app/gameroom/components/AnswerReveal.tsx:30:        } as unknown as QuizAnswer)
src//app/api/players/[...path]/route.ts:9:  const params = context.params as any;
src//app/api/admin/[...path]/route.ts:21:  const params = context.params as any;
src//components/sound-effects.tsx:37:        window.AudioContext || (window as any).webkitAudioContext;
src//components/sound-effects.tsx:1432:    (window as any).playSoundEffect = playSound;
src//components/sound-effects.tsx:1435:      delete (window as any).playSoundEffect;
src//lib/performance-utils.ts:8:  const memory = (navigator as any).deviceMemory || 4;
src//lib/performance-utils.ts:38:  const memory = (navigator as any).deviceMemory;
```

**Summary: 2 `@ts-ignore`, 7 `as any`, 1 `as unknown as`** across 6 files.
