# Phase 14: Observability Polish - Research

**Researched:** 2026-03-19
**Domain:** Sentry context wiring, Next.js Web Vitals production reporting, documentation accuracy
**Confidence:** HIGH

## Summary

Phase 14 closes three tech debt items surfaced in the v1.3 milestone audit. All three are small, surgical changes with zero external dependencies to add — no new libraries, no new config files. The audit already identified the exact lines to change and the exact files to fix.

The Sentry game phase gap (OBS-05) is a one-line call-site fix: `setSentryGameContext` already accepts a second `phase` argument, but the call in `gameroom/page.tsx` omits it. Game phase must be derived from existing Jotai atoms (`isRoundBreakAtom`, `isPostGameShowcaseAtom`) since `LobbyJoinSuccess` (the `gameRoomAtom` type) contains no phase field. The derivation is a simple conditional string.

The WebVitals production gap (PERF-03/PERF-06) is a guard removal or routing change: `WebVitalsLogger` currently gates all reporting behind `NODE_ENV === 'development'`. The fix removes the environment guard so the component logs in production, or routes to a real endpoint such as Vercel Speed Insights. Given the project has no existing RUM infrastructure, the simplest correct fix is to remove the dev guard. The component already uses `useReportWebVitals` from `next/web-vitals` which fires in all environments once the guard is gone.

The documentation gap (PERF-06 doc) is a text edit: `12-02-SUMMARY.md` lists `wdyr.ts` and `WdyrInit.tsx` under `key-files.created` but both files were removed from the codebase (file system confirms absence). The SUMMARY needs to reflect that both files were created and then removed, and that `@welldone-software/why-did-you-render` is a devDependency that was installed but is inactive.

**Primary recommendation:** Fix all three gaps in a single plan with three atomic tasks. No new libraries or infrastructure required.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OBS-05 | Sentry events include user identity and current game room context (roomId, game phase) | `setSentryGameContext` second arg `phase?: string` exists but is never passed. Derive phase from `isRoundBreakAtom` + `isPostGameShowcaseAtom`. Call site is `gameroom/page.tsx` line 108–112. |
| PERF-03 | Core Web Vitals (LCP, CLS, INP) measured and baselined | `WebVitalsLogger` dev gate at line 7 of `WebVitalsLogger.tsx`. Removing the guard enables production reporting via existing `useReportWebVitals` hook. |
| PERF-06 | Top 3 highest-impact bottlenecks fixed and verified against baselines | Production LCP measurement was not taken. Removing WebVitals dev gate closes the verification gap. Documentation fix closes the SUMMARY accuracy gap. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/web-vitals` | Bundled with Next.js | `useReportWebVitals` hook | Already installed; no new dependency |
| `jotai` | Already installed | Atom subscriptions | Project state management pattern |
| `@sentry/nextjs` | Already installed | `Sentry.setContext` via `src/lib/sentry.ts` | Project Sentry abstraction |

### No New Dependencies
All three fixes use only existing project infrastructure. No `npm install` required.

## Architecture Patterns

### Pattern 1: Deriving Game Phase String from Jotai Atoms

**What:** `GameState` has no dedicated `phase` string field. Phase is encoded as two boolean flags: `isRoundBreak` and `isPostGameShowcase`. A derived string label maps these to human-readable Sentry phase values.

**Derivation logic:**
```typescript
// Source: gameAtoms.ts — isRoundBreakAtom, isPostGameShowcaseAtom
function deriveGamePhase(isRoundBreak: boolean, isPostGameShowcase: boolean): string {
  if (isPostGameShowcase) return "post_game";
  if (isRoundBreak) return "round_break";
  return "answering";
}
```

**When to use:** Called inside the `useEffect` that already calls `setSentryGameContext`. The effect must add `isRoundBreak` and `isPostGameShowcase` to its dependency array.

**Important:** The `gameroom/page.tsx` already subscribes to both atoms (lines 51–52). Adding the derived phase string as a variable and passing it to `setSentryGameContext` is additive — no structural change to the component.

### Pattern 2: WebVitals Production Reporting

**What:** `useReportWebVitals` from `next/web-vitals` already fires in all environments. The current `logVitals` callback gates the console output with `NODE_ENV === 'development'`. Removing this guard makes Web Vitals log to the console in production.

**Option A — Remove dev guard (simplest, recommended):**
```typescript
// Source: WebVitalsLogger.tsx
const logVitals = (metric: { name: string; value: number; rating: string; delta: number }) => {
  console.log(`[WebVitals] ${metric.name}: ${metric.value.toFixed(2)}ms | delta: ${metric.delta.toFixed(2)} | rating: ${metric.rating}`);
};
```

**Option B — Send to analytics endpoint:**
```typescript
// Send to a backend endpoint or analytics service
const logVitals = (metric: { name: string; value: number; rating: string; delta: number }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[WebVitals] ${metric.name}: ...`);
  }
  // Production: send to endpoint
  navigator.sendBeacon('/api/vitals', JSON.stringify(metric));
};
```

**Decision:** Option A is recommended. The project has no existing analytics/RUM endpoint. Production console logs are accessible via browser DevTools and server-side log aggregation. Option B requires a new API route which is out of scope. The REQUIREMENTS.md does not mandate a specific reporting mechanism — it requires that vitals be "measurable in production."

### Pattern 3: SUMMARY Documentation Fix

**What:** `12-02-SUMMARY.md` is a planning artifact at `.planning/phases/12-performance-baselines/12-02-SUMMARY.md`. The `key-files.created` section lists files that were subsequently removed.

**Correct state to document:**
- `src/wdyr.ts` — created during Phase 12-02, then removed in Phase 12-02 (WDYR incompatibility). File does NOT exist in current codebase.
- `src/app/_components/WdyrInit.tsx` — created during Phase 12-02, then removed in Phase 12-02. File does NOT exist in current codebase.
- `@welldone-software/why-did-you-render` — installed as devDependency, NOT removed (package.json still has it, but it is inactive).

**Fix approach:** Move the two filenames from `key-files.created` to a `key-files.created_then_removed` section (or equivalent), and add a note that the package remains installed but inactive.

### Anti-Patterns to Avoid

- **Creating a new `gamePhaseAtom`:** There is no need for a new atom. The existing `isRoundBreakAtom` and `isPostGameShowcaseAtom` atoms are already subscribed in `page.tsx`. Derive the string inline in the `useEffect`.
- **Changing the `setSentryGameContext` signature:** The function already accepts `phase?: string`. The fix is at the call site only.
- **Adding a new `useEffect` for phase context:** The existing `useEffect` on `gameroom?.game_ws_url` should be extended to also track phase changes, by adding the phase atoms to the dependency array.
- **Adding a RUM backend route for WebVitals:** This is out of scope. Console logging in production is sufficient to satisfy PERF-03.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Game phase string | Custom phase state machine or new atom | Derive from `isRoundBreakAtom` + `isPostGameShowcaseAtom` | State already exists; adding another atom adds drift risk |
| Production web vitals reporting | Custom analytics endpoint | Remove `NODE_ENV` guard from existing `logVitals` | No RUM infrastructure exists; console is sufficient for verification |

## Common Pitfalls

### Pitfall 1: Effect Dependency Array Miss
**What goes wrong:** `setSentryGameContext` is called in an effect that only depends on `gameroom?.game_ws_url`. If game phase changes but `game_ws_url` does not change, the Sentry context will not update.
**Why it happens:** The effect was written to track the room join event, not ongoing phase changes.
**How to avoid:** Add `isRoundBreak` and `isPostGameShowcase` (or a derived phase string variable) to the dependency array of the existing effect.
**Warning signs:** Sentry events show the phase from the first game state, not the current one.

### Pitfall 2: Two Separate Effects Instead of One
**What goes wrong:** Adding a second `useEffect` just for phase context creates a race between two effects updating Sentry context.
**Why it happens:** Attempting to keep concerns separate.
**How to avoid:** Extend the single existing `useEffect` that calls `setSentryGameContext`. Keep both the roomId and phase update in one effect.

### Pitfall 3: Removing the wdyr Package from package.json
**What goes wrong:** Phase 12-02 installed `@welldone-software/why-did-you-render`. The SUMMARY fix documents file removal but does NOT require removing the package. Removing the package would be a separate change with its own risk surface.
**Why it happens:** Conflating "files removed" with "package removed."
**How to avoid:** The SUMMARY fix is documentation-only. Do not modify `package.json` as part of this task.

### Pitfall 4: WebVitals Noise Concern
**What goes wrong:** Removing the dev-only guard makes `[WebVitals]` lines appear in production browser consoles. This was intentionally gated in Phase 12 to avoid production console noise.
**Why it happens:** Phase 12 decision was correct for that phase (baselines not yet recorded). Phase 14 goal is to make vitals *measurable in production*.
**How to avoid:** Accept the production console logs as the mechanism. The requirement is satisfied when LCP/CLS/INP values appear in production — console is a valid output channel.

## Code Examples

### Correct Call Site After Fix (OBS-05)
```typescript
// gameroom/page.tsx — extends existing useEffect
// Source: gameroom/page.tsx lines 108-112 (current), gameAtoms.ts (isRoundBreakAtom)

// Add to existing atom subscriptions at top of component:
const isRoundBreak = useAtomValue(isRoundBreakAtom);        // already present line 51
const isPostGameShowcase = useAtomValue(isPostGameShowcaseAtom);  // already present line 52

// In the effect:
useEffect(() => {
  if (gameroom?.game_ws_url) {
    const phase = isPostGameShowcase ? "post_game" : isRoundBreak ? "round_break" : "answering";
    setSentryGameContext(gameroom.game_ws_url, phase);
  }
}, [gameroom?.game_ws_url, isRoundBreak, isPostGameShowcase]);
```

### WebVitalsLogger After Fix (PERF-03)
```typescript
// Source: WebVitalsLogger.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

const logVitals = (metric: { name: string; value: number; rating: string; delta: number }) => {
  console.log(`[WebVitals] ${metric.name}: ${metric.value.toFixed(2)}ms | delta: ${metric.delta.toFixed(2)} | rating: ${metric.rating}`);
};

export function WebVitalsLogger() {
  useReportWebVitals(logVitals);
  return null;
}
```

### setSentryGameContext Signature (Already Correct)
```typescript
// Source: src/lib/sentry.ts line 14 — no changes needed
export function setSentryGameContext(roomId: string, phase?: string): void {
  Sentry.setContext("gameroom", {
    roomId,
    phase: phase ?? "unknown",
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebVitalsLogger dev-only | WebVitalsLogger in all environments | Phase 14 | LCP/CLS/INP visible in production browser DevTools |
| `setSentryGameContext(roomId)` — phase always "unknown" | `setSentryGameContext(roomId, phase)` — real phase | Phase 14 | Sentry events show answering / round_break / post_game context |

## Open Questions

1. **Is `console.log` the right production reporting mechanism for Web Vitals?**
   - What we know: Project has no RUM endpoint, no Vercel Speed Insights configured, no analytics service. `useReportWebVitals` fires in all environments once the guard is removed.
   - What's unclear: Whether the user wants to store vitals data somewhere (a backend, Sentry custom events, etc.) or if browser-DevTools-visible logging is sufficient.
   - Recommendation: Use console log (Option A). The success criterion is that LCP/CLS/INP are "measurable in production" — console satisfies this. A Sentry custom event approach could be added as a future enhancement if needed.

2. **Should `@welldone-software/why-did-you-render` be removed from package.json?**
   - What we know: The package is installed but its files were removed. It contributes to devDependency bundle (not production bundle).
   - What's unclear: Whether the user wants a clean `package.json` or prefers to leave it as a documented inactive dependency.
   - Recommendation: The Phase 14 scope is documentation accuracy for `12-02-SUMMARY.md`. Do not modify `package.json`. Flag in the plan that the package can be removed in a future cleanup phase if desired.

## Validation Architecture

> `workflow.nyquist_validation` key is absent from `.planning/config.json` — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no pytest.ini, jest.config.*, vitest.config.* found in project |
| Config file | none |
| Quick run command | Manual verification via browser DevTools and Sentry dashboard |
| Full suite command | Manual verification — all three tasks are verified by observation |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OBS-05 | `setSentryGameContext` called with real phase string (not "unknown") | manual | Code inspection: `grep -n "setSentryGameContext" src/app/gameroom/page.tsx` — verify second arg present | ✅ verification via grep |
| PERF-03 | `WebVitalsLogger` logs in production (NODE_ENV guard removed) | manual | Code inspection: `grep -n "NODE_ENV" src/app/_components/WebVitalsLogger.tsx` — verify guard is gone | ✅ verification via grep |
| PERF-06 (doc) | `12-02-SUMMARY.md` accurately reflects wdyr files were removed | manual | Code inspection: review SUMMARY file content matches file system state | ✅ file exists |

### Sampling Rate
- **Per task commit:** Code inspection grep commands above
- **Per wave merge:** Review all three files after commit
- **Phase gate:** All three observable truths pass before `/gsd:verify-work`

### Wave 0 Gaps
None — existing infrastructure covers all phase requirements. No test files need to be created. Verification is code inspection + manual browser testing.

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/lib/sentry.ts` — `setSentryGameContext` signature confirmed, `phase?: string` already present
- Direct codebase read: `src/app/gameroom/page.tsx` — call site confirmed at lines 108–112, second arg missing, both phase atoms already subscribed
- Direct codebase read: `src/app/_components/WebVitalsLogger.tsx` — dev-only guard confirmed at line 7
- Direct codebase read: `src/app/gameroom/store/gameAtoms.ts` — `isRoundBreakAtom` and `isPostGameShowcaseAtom` confirmed; no `phase` string field in `GameState`
- Direct file system check: `src/wdyr.ts` — does NOT exist (removed in Phase 12-02)
- Direct file system check: `src/app/_components/WdyrInit.tsx` — does NOT exist (removed in Phase 12-02)
- Direct artifact read: `.planning/phases/12-performance-baselines/12-02-SUMMARY.md` — `key-files.created` lists both removed files; confirmed inaccurate
- Direct artifact read: `.planning/v1.3-MILESTONE-AUDIT.md` — all three tech debt items confirmed with exact descriptions

### Secondary (MEDIUM confidence)
- `next/web-vitals` `useReportWebVitals` behavior: fires in all environments when component is mounted; guard removal is sufficient to enable production reporting (Next.js documentation pattern, confirmed by hook implementation in WebVitalsLogger)

### Tertiary (LOW confidence)
None — all findings are based on direct codebase inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all existing libraries confirmed present
- Architecture: HIGH — all patterns derived from direct code inspection, not assumptions
- Pitfalls: HIGH — pitfalls derived from actual code structure (existing effect, existing atom subscriptions)

**Research date:** 2026-03-19
**Valid until:** 2026-04-18 (stable codebase; changes to `gameAtoms.ts` or `WebVitalsLogger.tsx` would invalidate)
