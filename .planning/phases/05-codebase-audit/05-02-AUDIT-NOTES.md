# Phase 05 Plan 02: Architecture and Type Safety Audit Notes

**Audit date:** 2026-03-12
**Scope:** Architecture (AUDIT-03) and Type Safety (AUDIT-04)
**Method:** Direct source reading — all findings verified against actual file contents.
**Status:** Complete — to be consumed by Task 2 for final consolidation.

---

## Architecture Findings

### Hook Boundary Issues

**[FINDING-A01]** `src/app/gameroom/page.tsx:100–115` — Rules of Hooks violation: hooks are called after a conditional return. At line 100, `if (!gameroom) { return <div>Loading gameroom...</div>; }` exits early. At lines 105 and 112, `useGameEvents()` and `useChatSocket()` are called after that conditional return. Additionally, the inline `getBaseWsUrl` function (lines 108–110) is defined inside the component body after the conditional return. This violates the Rules of Hooks and will cause React to throw a runtime error when `gameroom` is nullish on first render (before the atom loads).
Impact: HIGH
Effort: LOW
Remediation: Move `useGameEvents` and `useChatSocket` calls to before the conditional return (alongside the other hooks at lines 40–55). Extract `getBaseWsUrl` to module scope or a separate utility file so it is not conditionally defined.

**[FINDING-A02]** `src/app/gameroom/hooks/useGameEvents.ts:40–59` — `handleLobbySyncRef` is initialized with a full handler function at declaration (lines 40–59), then immediately overwritten inside a `useEffect` at lines 151–172 with nearly identical logic. The initial value is dead code: on first render, all refs are overwritten by the `useEffect` before any socket events arrive. Minor semantic difference: the initial handler uses `roundName: data.topic_name || ""` (line 48) while the useEffect handler uses `roundName: data.topic_name` (line 160) — the `|| ""` fallback is silently dropped. Confirmed: `handleSubmissionFeedbackRef` shows the same initialization-then-overwrite pattern (lines 135–149 and 174–181). This is also tracked as FINDING-Q05 and FINDING-Q11 in the code quality draft.
Impact: MEDIUM
Effort: LOW
Remediation: Initialize `handleLobbySyncRef` and `handleSubmissionFeedbackRef` as `useRef(null!)` (with typed function signature). Remove the duplicate handler bodies from `useRef(...)` calls. Assign exclusively inside the `useEffect` where closures capture the correct values.

**[FINDING-A03]** `src/app/gameroom/page.tsx:108–110` — `getBaseWsUrl` is an inline function defined inside the component body after a conditional return (see FINDING-A01). Beyond the hooks violation concern, this function is redeclared on every render and is not memoized. The regex `url.replace(/\/(game|chat)$/, "")` is simple but the function placement is architecturally incorrect.
Impact: LOW
Effort: LOW
Remediation: Move to module scope in `utils.ts` or a constants file.

---

### State Management Anti-Patterns

**[FINDING-A04]** `src/app/gameroom/store/gameAtoms.ts:107–122` — `resetGameStateAtom` duplicates the `animationStateAtom` initial value inline (lines 110–121). The canonical initial value is already declared as the `animationStateAtom` atom default (lines 70–81). If the shape of `AnimationState` changes, both definitions must be updated. Currently they are identical, but this is a maintenance hazard.
Impact: LOW
Effort: LOW
Remediation: Extract the animation state initial value to a constant `const initAnimationState: AnimationState = { ... }` at module scope. Reference it in both `animationStateAtom = atom<AnimationState>(initAnimationState)` and `resetGameStateAtom` set call.

**[FINDING-A05]** `src/app/gameroom/store/gameAtoms.ts:133–136` — Bot Bob detection in `addUnifiedMessageAtom` uses `player_id === "botbob" || display_name.toLowerCase() === "botbob"`. The same two-condition detection appears in `UnifiedMessages.tsx:42–46` (`getMessageTypeClass`) and in `utils.ts:133` (`getPlayerAvatar`). This string-based detection logic is duplicated three times across atoms, components, and utilities with no shared helper.
Impact: MEDIUM
Effort: LOW
Remediation: Extract `isBotBob(player_id: string, display_name: string): boolean` to `utils.ts`. Import in all three locations. If Bot Bob's identifier ever changes, only one place needs updating.

**[FINDING-A06]** `src/atoms/performance-atom.ts` vs `src/contexts/performance-context.tsx` — Two parallel performance mode systems exist and use different localStorage keys:
- `performance-atom.ts` uses keys `"triviabox-performance-mode"` and `"triviabox-performance-configured"`.
- `performance-context.tsx` uses key `"performanceMode"` (no prefix).

Both set `document.body.classList.add("performance-mode")` on the same body class. The context also auto-enables performance mode when `prefers-reduced-motion` is detected (behavior absent from the atom). The atom provides more complete functionality (`showPerformanceModalAtom`, `setPerformancePreferenceAtom`, `resetPerformanceSettingsAtom`) and uses Jotai's `atomWithStorage` for proper SSR hygiene. The context uses plain `useState` + `localStorage.getItem` in a `useEffect`, which runs only on the client after first render. These two systems are likely not synchronized: a user who sets performance mode via the atom will not have it reflected in the context, and vice versa.
Impact: HIGH
Effort: MEDIUM
Remediation: Delete `performance-context.tsx` and the `PerformanceProvider`. All consumers that use `usePerformance()` should switch to `useAtomValue(performanceModeAtom)`. Add reduced-motion detection to the Jotai atom layer (e.g., a `reducedMotionAtom` derived from a client-side media query effect).

---

### Data Flow Issues

**[FINDING-A07]** `src/app/gameroom/hooks/useGameState.ts:16–21` — `useGameState` spreads the full `gameState` into its return value (`...gameState`). Every consumer of `useGameState()` receives all 15+ fields of `GameState` and subscribes to the full `gameStateAtom`. The derived atomic selectors (`isRoundBreakAtom`, `scoresAtom`, `slotsAtom`, etc.) exist precisely to allow granular subscriptions. `useGameState` defeats this optimization for all its callers. Confirmed callers using it for only one or two fields: `AnswerReveal.tsx` (only `slots`), `LeaderBoard.tsx` (only `scores` and `accolades`), `PostGameShowcase.tsx` (only `scores` and `playerAccolades`), `page.tsx` (only `updateGameState`). This is also tracked as FINDING-P01 through FINDING-P04.
Impact: MEDIUM
Effort: LOW
Remediation: Each call site should use the granular atomic selectors (`useAtomValue(slotsAtom)`, etc.) instead of `useGameState()`. After all call sites are migrated, `useGameState` can be restricted to only exposing `updateGameState` and `resetGameState` (or removed entirely if no callers remain).

**[FINDING-A08]** `src/app/gameroom/hooks/useGameEvents.ts:77` — `sendEventRef.current` is cast as `(e: string, d: any) => void` to call `sendEvent("request_state_sync", undefined)`. The actual `sendEvent` signature accepts typed `GameEvent` and `EventPayloadMap[T]` arguments. The cast is necessary because `request_state_sync` is not in the `GameEvent` union type. This is a type gap (also tracked as FINDING-T09) but creates a data flow concern: the game socket silently accepts undeclared event names through the cast, bypassing the typed API.
Impact: MEDIUM
Effort: LOW
Remediation: Add `"request_state_sync"` to the `GameEvent` union in `payloads.ts` with payload type `undefined`. This removes the need for the cast and documents the event in the type system.

**[FINDING-A09]** `src/app/gameroom/hooks/useGameEvents.ts:185–209` — The `useEffect` registers 9 socket event handlers via `onEvent(...)` but discards all 9 returned cleanup callbacks. `onEvent` returns `() => void` (a function that removes the listener from `listenersRef`). Since cleanup is never called, if `onEvent` changes reference and the effect re-runs, old anonymous wrapper lambdas (e.g., `(data: LobbySyncPayload) => handleLobbySyncRef.current(data)`) accumulate in the `Set`. Each wrapper is a new function object, so each re-run adds new listeners that are never removed. This is also tracked as FINDING-Q13.
Impact: MEDIUM
Effort: LOW
Remediation: `const cleanups = [onEvent("lobby_state_sync", ...), ...]; return () => cleanups.forEach(fn => fn?.());`

---

## Type Safety Findings

### @ts-ignore Usage

**[FINDING-T01]** `src/app/gameroom/utils.ts:59,61` — Two consecutive `// @ts-ignore` comments suppress TypeScript errors on `window.playSoundEffect`. The `window` object does not have a `playSoundEffect` property in its type definition. The correct fix is a Window interface extension, which `src/types/navigator.d.ts` already demonstrates the pattern for (it extends `Navigator`). The `@ts-ignore` approach is a blunt instrument that hides all errors on the next line, not just the specific one.
Impact: LOW
Effort: LOW
Remediation: Add `interface Window { playSoundEffect?: (type: SoundType) => void; }` to `src/types/navigator.d.ts` (rename to `src/types/globals.d.ts` for broader scope). Remove both `// @ts-ignore` comments. The function can then be called as `window.playSoundEffect?.(type)` with full type safety.

---

### `as any` Usage

**[FINDING-T02]** `src/app/gameroom/hooks/useGameEvents.ts:199` — `onEvent("game_over", (data: any) => ...)`. `GameOverPayload` is defined and imported in the same file. The handler at lines 100–109 correctly types `data: GameOverPayload`. The `any` annotation on the `onEvent` call is inconsistent with the properly typed `handleGameOverRef` it delegates to — no data flows through `data: any` unsafely here, but the annotation is misleading.
Impact: LOW
Effort: LOW
Remediation: Change to `onEvent("game_over", (data: GameOverPayload) => handleGameOverRef.current(data))`. This is consistent with all other `onEvent` calls in the same effect.

**[FINDING-T03]** `src/app/gameroom/hooks/useGameSocket.ts:63` — `debounce((message: string, error?: any) => { console.error(message, error); }, 1000)`. The `error?: any` parameter is acceptable for a generic error logger. However, the outer `debounce` call type signature (line 61–67) also uses `any` via `EventListener<any>` in `listenersRef`. While idiomatic for heterogeneous event maps, this weakens the generic contract.
Impact: LOW
Effort: LOW
Remediation: The `error?: any` in the error logger is acceptable (errors from catch blocks are `unknown` in strict TypeScript). Consider typing as `error?: unknown` for strict correctness. The `listenersRef` can remain `Map<GameEvent, Set<EventListener<any>>>` as a pragmatic union container.

**[FINDING-T04]** `src/app/gameroom/hooks/useGameSocket.ts:214` — `socket.on(eventName, (data: any) => { ... })`. The loop at lines 213–226 registers handlers for all typed `GameEvent` names but passes each payload as `any` to the generic dispatcher. This is the internal socket.io handler layer; the typed `EventPayloadMap` contract is maintained at the `onEvent()` consumer layer. The `any` here is an architectural seam between socket.io's untyped API and the typed listener registry.
Impact: LOW
Effort: LOW
Remediation: This `any` is structurally necessary given socket.io's `data: any` in `socket.on()`. A narrow improvement: type the dispatch lambda with `(data: EventPayloadMap[typeof eventName])` if a discriminated-union narrowing is feasible. In practice, the current approach is acceptable.

**[FINDING-T05]** `src/app/gameroom/hooks/useGameActions.ts:72` — `setAnimationWithTimeout(animationUpdate: any, timeout = 400)`. `animationUpdate` is passed directly to `updateAnimationState(animationUpdate)` which expects `Partial<AnimationState>`. The `any` annotation bypasses the type check on the argument, allowing callers to pass arbitrary objects. `AnimationState` is a concrete type with 10 known fields — there is no reason for `any` here.
Impact: MEDIUM
Effort: LOW
Remediation: Change signature to `setAnimationWithTimeout(animationUpdate: Partial<AnimationState>, timeout = 400)`. Import `AnimationState` from `../types/state`.

**[FINDING-T06]** `src/app/gameroom/hooks/useGameState.ts:40` — `triggerAnimation(type: string, value: any)`. This function calls `updateAnimationState({ [type]: value })`. The `type: string` parameter allows passing any arbitrary string key, and `value: any` allows any value. Both `AnimationState` fields and their value types are known at compile time. The computed property `{ [type]: value }` defeats the type system and allows silent bugs (e.g., `triggerAnimation("nonExistentField", 42)` would compile without error).
Impact: MEDIUM
Effort: LOW
Remediation: Change to `triggerAnimation<K extends keyof AnimationState>(type: K, value: AnimationState[K])`. This constrains both the key and value to valid `AnimationState` members. Import `AnimationState` from the store.

**[FINDING-T07]** `src/app/api/admin/[...path]/route.ts:21` — `const params = context.params as any`. This cast is used to check if `params` is a Promise (for Next.js 15 async params compatibility). The RouteContext union type is already defined (lines 14–16) to handle both sync and async params. The `as any` on line 21 is needed only because the `typeof params.then` check doesn't narrow a union type — an `instanceof Promise` check or a type guard would be cleaner.
Impact: LOW
Effort: LOW
Remediation: Add a type guard: `function isPromiseLike(v: unknown): v is Promise<unknown> { return typeof (v as any)?.then === "function"; }`. Then: `if (isPromiseLike(context.params)) { ... }`. This removes the `as any` cast and documents the intent.

**[FINDING-T08]** `src/lib/performance-utils.ts:8,38` — `(navigator as any).deviceMemory`. The `src/types/navigator.d.ts` file already declares `interface Navigator { deviceMemory?: number; }`. The `as any` casts in `performance-utils.ts` are therefore unnecessary — `navigator.deviceMemory` is already typed via the declaration file.
Impact: LOW
Effort: LOW
Remediation: Remove `as any` casts. Use `navigator.deviceMemory ?? 4` directly. No interface extension needed since `navigator.d.ts` already covers it.

**[FINDING-T09]** `src/components/sound-effects.tsx:37` — `window.AudioContext || (window as any).webkitAudioContext`. The `webkitAudioContext` property is a vendor-prefixed API not in the standard `Window` type. The cast is needed for cross-browser compatibility.
Impact: LOW
Effort: LOW
Remediation: Extend Window interface in `src/types/globals.d.ts`: `interface Window { webkitAudioContext?: typeof AudioContext; }`. The two `(window as any).playSoundEffect` casts on lines 1432 and 1435 should also be resolved here (see FINDING-T01).

---

### `as unknown as` Assertions

**[FINDING-T10]** `src/app/gameroom/components/AnswerReveal.tsx:30` — `} as unknown as QuizAnswer`. This double-cast converts a `Slot` object to `QuizAnswer`. The `as unknown` step is required because TypeScript refuses a direct `as QuizAnswer` cast (the types are incompatible — `Slot.id` is `string`, `QuizAnswer.id` is `number`). The `as unknown as QuizAnswer` pattern is a "type laundering" anti-pattern that suppresses a legitimate compiler error.

**Confirmed latent runtime bug:** `visibleAnswers` is typed `number[]` (line 16). `QuizAnswer.id` is typed `number`. But `Slot.id` (the actual runtime value being assigned) is `string`. At runtime, `visibleAnswers` contains strings (since no coercion occurs). `visibleAnswers.includes(x.id)` compares a `number[]` against `x.id` which is a string at runtime — `includes` performs strict equality, so this comparison always returns `false`. The `styles.visible` CSS class is never applied, and the reveal animation never fires. This is a confirmed bug, not just a type gap.
Impact: HIGH
Effort: LOW
Remediation: Change `QuizAnswer.id` to `string`. Change `visibleAnswers` state to `string[]`. Remove the `as unknown as QuizAnswer` cast. The slot mapping becomes: `id: x.id` (no cast needed, both are `string`). Additionally, replace `useGameState()` with `useAtomValue(slotsAtom)` (see FINDING-P02).

---

### EventPayloadMap Gaps

**[FINDING-T11]** `src/app/gameroom/types/payloads.ts:204` — `submit_answer: any` in `EventPayloadMap`. The `submit_answer` event sends a `string` (the player's answer text). The `any` annotation loses this type information. The `sendEvent` signature in `useGameSocket.ts` (lines 265–268) partially compensates: `T extends "submit_answer" ? string : EventPayloadMap[T]`, but this special-case conditional exists only because `EventPayloadMap["submit_answer"]` is `any`.
Impact: LOW
Effort: LOW
Remediation: Change `submit_answer: any` to `submit_answer: string`. Then simplify the `sendEvent` signature to the standard `data: EventPayloadMap[T]` — the special case becomes unnecessary.

**[FINDING-T12]** `src/app/gameroom/hooks/useGameEvents.ts:77` — `request_state_sync` is not in the `GameEvent` union type but is emitted via a cast: `(sendEventRef.current as (e: string, d: any) => void)("request_state_sync", undefined)`. This is an undeclared event that bypasses the type system entirely.
Impact: LOW
Effort: LOW
Remediation: Add `"request_state_sync"` to the `GameEvent` union in `payloads.ts`. Add `request_state_sync: undefined` to `EventPayloadMap`. Remove the cast.

---

### Missing Return Types / Typed Gaps

**[FINDING-T13]** `src/lib/api/admin.ts` — Multiple `Promise<any>` return types (verified lines ~658, 674, 691, 710, and additional methods). The `AdminApiClient` class has ~30 methods, many returning `Promise<any>`. This means callers receive `any` from API calls and lose type safety for all downstream use of the response data.
Impact: MEDIUM
Effort: MEDIUM
Remediation: Define typed response interfaces for each method group. This is related to FINDING-Q02 (splitting the class) — splitting by domain makes it easier to type each group independently. Prioritize the methods most frequently called from game-critical paths.

---

## Tooling Output

### TypeScript (`npx tsc --noEmit`)

```
(no output — compiler produced no errors or warnings)
```

The TypeScript compiler reports zero errors. This is expected: the type-safety findings above are not compiler errors because `as any`, `as unknown as`, and `@ts-ignore` suppress them. The compiler's clean bill of health does not mean the codebase is type-safe; it means the unsafe patterns have been explicitly suppressed.

### Lint (`npm run lint`)

```
> snapscore@0.1.0 lint
> eslint .

sh: eslint: command not found
```

ESLint is configured in `package.json` (`"lint": "eslint ."`) but the `eslint` binary is not installed globally. `npx next lint` also failed (likely a PATH issue in the audit environment). The lint toolchain is present in `package.json` but not verified as runnable. Lint warnings (if any) cannot be assessed. Recommendation: ensure `eslint` is in the local `node_modules/.bin` and run via `npx eslint .` after `npm install`.

### Grep: `@ts-ignore`, `as any`, `as unknown`

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

**Total: 2 `@ts-ignore`, 7 `as any`, 1 `as unknown as`** across 6 files.
