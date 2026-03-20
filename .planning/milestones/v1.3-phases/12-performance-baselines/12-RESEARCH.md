# Phase 12: Performance Baselines - Research

**Researched:** 2026-03-18
**Domain:** Next.js bundle analysis, Core Web Vitals, React re-render profiling, Socket.IO event timing
**Confidence:** HIGH (all primary findings verified against official docs or Context7)

---

## Summary

Phase 12 is a measurement-only phase. No production code changes ship — only tooling and instrumentation code that produces a single findings document. The goal is to establish quantified baselines for bundle size, Core Web Vitals (LCP, CLS, INP), React component re-render hotspots, and Socket.IO event dispatch overhead. These baselines become the acceptance criteria for Phase 13 fixes.

The project runs React 19.2.1, Next.js ~16.x (package.json shows `"next": "^16.0.10"`), and Jotai 2.15.2 for state. The atom architecture already uses derived selector atoms (e.g., `unifiedMessagesAtom`, `scoresAtom`, `slotsAtom`) which is the right pattern — profiling will reveal whether any components still subscribe to the broad `gameStateAtom` instead of the narrow derived atoms. `@next/bundle-analyzer` is NOT currently installed. `@welldone-software/why-did-you-render` is NOT installed. `web-vitals` is NOT installed as a standalone dependency (Next.js ships its own via `next/web-vitals`).

**Primary recommendation:** Split Phase 12 into two plans — Plan 01 for tooling setup and bundle/Web Vitals measurement, Plan 02 for React re-render profiling and socket timing — then write the consolidated findings document as the final task in Plan 02.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | React re-render hotspots profiled across UnifiedMessages, LeaderBoard, SlotGrid | React `<Profiler>` component + `why-did-you-render` v10+ (React 19 compatible); atoms to watch: `unifiedMessagesAtom`, `scoresAtom`, `accoladesAtom`, `slotsAtom`, `slotHeatAtom` |
| PERF-02 | Next.js bundle analyzed for total size, code splitting opportunities, unused imports | `@next/bundle-analyzer` via `ANALYZE=true npm run build`; also `npx next experimental-analyze` (Turbopack, no install needed) |
| PERF-03 | Core Web Vitals (LCP, CLS, INP) measured and baselined | `useReportWebVitals` from `next/web-vitals` — already in Next.js runtime, no extra package needed |
| PERF-04 | Socket event handling overhead profiled (message queue, atom update frequency in useGameEvents) | `performance.now()` instrumentation around `onEvent` handler dispatch in `useGameEvents.ts`; count atom writes per `lobby_tick` event |
| PERF-05 | All performance findings documented with impact/effort ratings in single document | Produce `.planning/phases/12-performance-baselines/PERF-BASELINE.md` |
</phase_requirements>

---

## Standard Stack

### Core Tooling
| Tool | Version / Source | Purpose | Why Standard |
|------|-----------------|---------|--------------|
| `@next/bundle-analyzer` | latest (must install) | Webpack bundle treemap — shows per-chunk sizes, identifies large deps | Official Next.js plugin, documented at nextjs.org |
| `npx next experimental-analyze` | Built into Next.js 16.1+ | Turbopack bundle analyzer — interactive module graph, no install | Zero-install, works with current Next.js version |
| `useReportWebVitals` | Built into `next/web-vitals` | LCP, CLS, INP, FCP, TTFB capture — logs to console for baseline recording | Zero-install, App Router supported, official Next.js API |
| `React <Profiler>` | Built into React 19 | Programmatic render timing — `actualDuration`, `baseDuration`, commit count | Official React API, zero-install, works in dev builds |
| `@welldone-software/why-did-you-render` | v10.0.0+ (must install as devDependency) | Annotates components with re-render reasons in console | Most widely used library for this; v10 confirmed React 19 compatible as of 2025-01-18 |
| `performance.now()` | Browser/Node built-in | Socket event timing measurement | No library needed; sufficient precision for ms-level overhead |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| React DevTools Profiler (browser extension) | Latest | Flamegraph — visual confirmation of hotspots found programmatically | Use alongside `<Profiler>` component for visual confirmation |
| Chrome DevTools Performance tab | Built-in | Long tasks, layout thrash, JS execution timeline | Supplement for CLS investigation if layout shift origin is unclear |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@next/bundle-analyzer` | `npx next experimental-analyze` only | Turbopack analyzer is zero-install and better for import tracing, but Webpack analyzer produces static HTML reports easier to include in a PR/document |
| `why-did-you-render` | Manual `<Profiler>` only | WDYR provides per-prop diff reasons automatically; `<Profiler>` only gives timing; use both |
| `useReportWebVitals` | Lighthouse CLI / PageSpeed Insights | Lighthouse is a good complementary tool but measures a synthetic session; `useReportWebVitals` captures real user session values |

### Installation (new packages only)
```bash
# Bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Why Did You Render — devDependency, dev-only, React 19 compatible
npm install --save-dev @welldone-software/why-did-you-render
```

`useReportWebVitals` and `<Profiler>` require NO installation.

---

## Architecture Patterns

### Recommended Deliverable Structure
```
.planning/phases/12-performance-baselines/
├── 12-RESEARCH.md           # this file
├── PERF-BASELINE.md         # final findings document (PERF-05 deliverable)
└── (screenshots/reports referenced from PERF-BASELINE.md)

.next/analyze/               # generated by ANALYZE=true npm run build
├── client.html
├── edge.html
└── nodejs.html
```

### Pattern 1: Bundle Analysis with @next/bundle-analyzer

**What:** Wraps Next.js webpack build to generate interactive treemap reports per bundle type (client, edge, nodejs).

**When to use:** Run once with `ANALYZE=true`, record findings, do not leave enabled permanently.

**Integration with existing `next.config.mjs`:**
The project already wraps `nextConfig` with `withSentryConfig`. The STATE.md decision is explicit: `withSentryConfig` must be the outermost wrapper. Bundle analyzer wraps `nextConfig` first, then Sentry wraps that:

```typescript
// Source: nextjs.org/docs/app/guides/package-bundling (verified 2026-03-16)
// next.config.mjs — correct nesting order
import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false, // don't auto-open — record output path manually
});

const nextConfig = { output: 'standalone' };

export default withSentryConfig(withBundleAnalyzer(nextConfig), { ...sentryOpts });
```

**Run command:**
```bash
ANALYZE=true npm run build
# Reports: .next/analyze/client.html, edge.html, nodejs.html
```

**Also available (zero-install, Turbopack):**
```bash
npx next experimental-analyze
# Interactive UI — trace import chains, filter by route/env
# Write output: npx next experimental-analyze --output
# Output: .next/diagnostics/analyze/
```

### Pattern 2: Core Web Vitals via useReportWebVitals

**What:** `useReportWebVitals` is a `'use client'` hook from `next/web-vitals`. Create a dedicated thin client component; import it in root `app/layout.tsx`. Metrics arrive after user interaction (INP requires an interaction, LCP fires on page load).

**When to use:** Add temporarily for measurement session, remove or gate behind env var after baselines are recorded.

```typescript
// Source: nextjs.org/docs/app/api-reference/functions/use-report-web-vitals (verified 2026-03-16)
// src/app/_components/WebVitalsLogger.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

const logVitals = (metric: { name: string; value: number; rating: string }) => {
  // Only log in dev or behind a flag — remove for production
  console.log(`[WebVitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
};

export function WebVitalsLogger() {
  useReportWebVitals(logVitals);
  return null;
}
```

```typescript
// app/layout.tsx — add inside <body> alongside existing Provider
import { WebVitalsLogger } from './_components/WebVitalsLogger';
// ...
<body>
  <WebVitalsLogger />
  <Theme ...>
    ...
  </Theme>
</body>
```

**Metrics captured:** LCP, CLS, INP, FCP, TTFB, FID (legacy), plus Next.js-specific: `Next.js-hydration`, `Next.js-route-change-to-render`, `Next.js-render`.

**Pages to measure:** Home page (`/`) and gameroom (`/gameroom/[id]`). Record separate sessions for each.

### Pattern 3: React Re-render Profiling with `<Profiler>` + WDYR

**What:** Wrap the three target components in React's built-in `<Profiler>`, log `actualDuration` and `phase` on each commit. Simultaneously use `why-did-you-render` to annotate component functions with a static property, which prints prop/state diff reasons to console.

**Step 1 — WDYR setup file (dev only):**
```typescript
// src/wdyr.ts — import at top of src/app/layout.tsx in dev mode only
// Source: github.com/welldone-software/why-did-you-render v10 README
if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = (await import('@welldone-software/why-did-you-render')).default;
  const React = (await import('react')).default;
  whyDidYouRender(React, {
    trackAllPureComponents: false, // opt-in per component
    logOnDifferentValues: true,
  });
}
```

**Step 2 — Opt in target components:**
```typescript
// In UnifiedMessages.tsx, LeaderBoard.tsx, SlotGrid.tsx
// Add after function definition:
UnifiedMessages.whyDidYouRender = true;
Leaderboard.whyDidYouRender = true;
SlotGrid.whyDidYouRender = true; // note: SlotGrid is already React.memo'd
```

**Step 3 — Wrap with `<Profiler>` for timing counts:**
```typescript
// Source: react.dev/reference/react/Profiler (verified 2026-03-18)
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
) {
  if (phase === 'update') {
    console.log(`[Profiler] ${id} re-rendered in ${actualDuration.toFixed(2)}ms (base: ${baseDuration.toFixed(2)}ms)`);
  }
}

// Wrap in parent component:
<Profiler id="UnifiedMessages" onRender={onRenderCallback}>
  <UnifiedMessages />
</Profiler>
```

**Key atoms to watch per component:**
- `UnifiedMessages`: `unifiedMessagesAtom` (grows on every chat/answer event), `isRoundBreakAtom`
- `Leaderboard`: `scoresAtom` (updated on `lobby_tick` ~1/sec), `accoladesAtom`
- `SlotGrid`: `slotsAtom` (updated on `slot_snapped`, `new_round_started`, `lobby_state_sync`)

### Pattern 4: Socket Event Timing in useGameEvents

**What:** Instrument `useGameEvents.ts` with `performance.now()` to measure time-per-event-dispatch and count atom updates per `lobby_tick` during active play.

**When to use:** Run during a live game session with the browser console open. Record: time per handler execution, how many atom `set()` calls per `lobby_tick`.

```typescript
// Temporary instrumentation in useGameEvents.ts — dev only
// Wrap onEvent registrations to measure dispatch time:
onEvent("lobby_tick", (data: LobbyTickPayload) => {
  const t0 = performance.now();
  handleLobbyTickRef.current(data);
  const elapsed = performance.now() - t0;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PerfProbe] lobby_tick handler: ${elapsed.toFixed(3)}ms`);
  }
}),
```

**lobby_tick analysis:** Each tick fires `updateGameState({playerCount, timeRemaining, scores})` — 1 write to `gameStateAtom` — which triggers all components subscribed to any derived atom that reads those fields. `scoresAtom` and `timeRemainingAtom` re-derive on every tick. This is the highest-frequency path.

**What to record:**
- Handler execution time (ms) per event type
- Estimated tick frequency (server-side, likely 1Hz or 5Hz — confirm from console log)
- Count of distinct atom writes per `lobby_state_sync` vs `lobby_tick`

### Anti-Patterns to Avoid

- **Running ANALYZE=true in production deployment:** The bundle analyzer env var must only be set for local build runs — it opens HTML files and adds overhead to the build output.
- **Leaving WDYR enabled in production:** The library explicitly warns it slows React and can cause edge case breakage. Use `process.env.NODE_ENV === 'development'` guard.
- **Profiling in production build without profiler build:** React strips profiling in standard production builds. All profiling work should be done in dev (`npm run dev`) or with `--profile` flag on `next build`.
- **Using `<Profiler>` to count renders across multiple sessions:** The `onRender` callback accumulates across the lifetime of a React tree. Reset counts manually (counter ref) when comparing before/after.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundle treemap visualization | Custom webpack stats parser | `@next/bundle-analyzer` or `npx next experimental-analyze` | Handles chunk relationship graph, async imports, shared chunks — manually parsing stats.json misses these |
| Web Vitals capture | `PerformanceObserver` setup | `useReportWebVitals` from `next/web-vitals` | Next.js already instruments this internally; hooks into the same measurement pipeline |
| Re-render reason diffing | Manual prop comparison logging | `@welldone-software/why-did-you-render` | Deep-diffs props/state across renders including primitive vs reference equality; handles edge cases around context |
| Render timing | `Date.now()` wrappers | `React <Profiler>` | React's scheduler-aware timing is accurate; `Date.now()` in render functions measures wall time including scheduler yield gaps |

**Key insight:** All four measurement tools are either zero-install (built into Next.js or React) or well-maintained libraries. Custom instrumentation produces noisier data and misses important edge cases.

---

## Common Pitfalls

### Pitfall 1: withSentryConfig + withBundleAnalyzer Nesting Order
**What goes wrong:** If `withBundleAnalyzer` is placed outside `withSentryConfig`, Sentry source map upload fails silently (known from STATE.md decision).
**Why it happens:** `withSentryConfig` must be the outermost wrapper because it modifies the webpack configuration last.
**How to avoid:** `withSentryConfig(withBundleAnalyzer(nextConfig), sentryOpts)` — Sentry outside, analyzer inside.
**Warning signs:** Source maps not appearing in Sentry after the phase 10/11 verification sessions.

### Pitfall 2: Web Vitals INP Requires Real Interaction
**What goes wrong:** LCP and CLS fire automatically on page load; INP only fires after a user interacts (click, keypress, tap) and the page responds. If measuring gameroom INP, the profiler must be active during actual gameplay including answer submissions.
**Why it happens:** INP replaced FID and measures the worst interaction latency across the whole session.
**How to avoid:** Play an actual game session with console open; look for INP log line after submitting an answer.
**Warning signs:** No INP value appears — means no interaction occurred during the measurement session.

### Pitfall 3: WDYR React 19 Compatibility Concern (Now Resolved)
**What goes wrong:** Previous versions of `@welldone-software/why-did-you-render` crashed on React 19 with "can't access property ReactCurrentOwner."
**Why it happens:** Library relied on internal React APIs that changed in React 19.
**How to avoid:** Require version 10.0.0 or later (released 2025-01-18). The project uses React 19.2.1 — v10+ is required, not optional.
**Warning signs:** Crash on startup mentioning `ReactCurrentOwner` or similar internal API — means wrong version installed.

### Pitfall 4: Profiler is a No-Op in Standard Production Builds
**What goes wrong:** `<Profiler>` `onRender` callback never fires in `next build` without `--profile` flag.
**Why it happens:** React strips profiling infrastructure in standard production builds for performance.
**How to avoid:** All re-render profiling must be done in `npm run dev` mode. Bundle analysis uses `ANALYZE=true npm run build` but that is measuring webpack output, not React render behavior.

### Pitfall 5: `gameStateAtom` Fan-Out Re-renders
**What goes wrong:** Any component that subscribes to `gameStateAtom` directly (rather than a derived atom) will re-render on every `updateGameState` call — including `lobby_tick` at 1-5Hz.
**Why it happens:** `updateGameState` always creates a new `gameState` object reference.
**How to avoid:** The profiling will surface this — look for re-renders triggered by `lobby_tick` on components that don't display time-sensitive data. This is a likely Phase 13 fix candidate.
**Warning signs:** WDYR logs showing re-renders where the only changed prop is an atom value the component doesn't visually use.

### Pitfall 6: `unifiedMessagesAtom` Array Identity
**What goes wrong:** `UnifiedMessages` re-renders on every message append because `[...current, message].slice(-100)` always produces a new array reference.
**Why it happens:** Jotai atom setters create new values; no memoization of the array reference is applied.
**How to avoid:** This is expected behavior — the profiling will measure how expensive each re-render is. Document the `actualDuration` vs `baseDuration` ratio. If `actualDuration << baseDuration`, existing memoization is working; if they are close, memoization is absent.

---

## Code Examples

### Bundle Analyzer: next.config.mjs (ESM, withSentryConfig outermost)
```typescript
// Source: nextjs.org/docs/app/guides/package-bundling (verified 2026-03-16)
import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

const nextConfig = {
  output: 'standalone',
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  tunnelRoute: '/monitoring',
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: { removeDebugLogging: true },
  },
});
```

### Web Vitals Logger Component (App Router)
```typescript
// Source: nextjs.org/docs/app/api-reference/functions/use-report-web-vitals (verified 2026-03-16)
// src/app/_components/WebVitalsLogger.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

const logVitals = (metric: { name: string; value: number; rating: string; delta: number }) => {
  console.log(`[WebVitals] ${metric.name}: ${metric.value.toFixed(2)}ms | rating: ${metric.rating}`);
};

export function WebVitalsLogger() {
  useReportWebVitals(logVitals);
  return null;
}
// Import in src/app/layout.tsx: <WebVitalsLogger /> inside <body>
```

### React Profiler onRender Callback
```typescript
// Source: react.dev/reference/react/Profiler (verified 2026-03-18)
import { Profiler, type ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  if (phase === 'update') {
    console.log(
      `[Profiler] ${id} re-render | actual: ${actualDuration.toFixed(2)}ms | base: ${baseDuration.toFixed(2)}ms`
    );
  }
};
// Usage: wrap target in <Profiler id="UnifiedMessages" onRender={onRenderCallback}>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FID (First Input Delay) | INP (Interaction to Next Paint) | March 2024 (Google) | INP measures worst interaction latency across the session; FID only measured first; gameroom answer submission is high-value for INP |
| Manual webpack stats.json parsing | `@next/bundle-analyzer` or `npx next experimental-analyze` | Experimental analyzer: Next.js 16.1 (late 2025) | Zero-install Turbopack analyzer available; Webpack analyzer still standard for stable reports |
| `why-did-you-render` v7/8 | v10.0.0 (React 19 support) | 2025-01-18 | Versions before v10 crash on React 19; v10 required |

**Deprecated/outdated:**
- `@next/bundle-analyzer` CommonJS `require()` config: Project uses ESM (`next.config.mjs`) — use `import bundleAnalyzer from '@next/bundle-analyzer'` with default export pattern.
- WDYR v7/v8: Incompatible with React 19. Only v10+ works.

---

## Open Questions

1. **Turbopack vs Webpack build mode**
   - What we know: `next.config.mjs` has no `--turbo` flag; the project appears to use webpack by default
   - What's unclear: Whether `npm run dev` already uses Turbopack in Next.js 16 (v15 enabled it by default for dev)
   - Recommendation: Run `npm run dev -- --help` or check Next.js 16 changelog to confirm default; if Turbopack is default for dev, `ANALYZE=true npm run build` (webpack) is still the right path for bundle analysis

2. **lobby_tick frequency**
   - What we know: Server sends `lobby_tick` events with `timeRemaining`, `scores`, and `slot_heats`; each tick calls `updateGameState` + `setSlotHeat`
   - What's unclear: Exact server-side frequency (likely 1Hz based on game design, but unverified)
   - Recommendation: Console-log timestamps on first few `lobby_tick` events during profiling to confirm; this directly affects "atom update frequency" metric for PERF-04

3. **@next/bundle-analyzer ESM import compatibility**
   - What we know: Official docs show CJS `require()` syntax; project uses ESM `.mjs` config
   - What's unclear: Whether `@next/bundle-analyzer` ships an ESM entry point
   - Recommendation: Use `import bundleAnalyzer from '@next/bundle-analyzer'` — the package default export is callable as `bundleAnalyzer({ enabled: ... })`. If import fails, use `createRequire(import.meta.url)` workaround. LOW confidence — verify at install time.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected in project (no jest.config, vitest.config, or tests/ directory) |
| Config file | None — no Wave 0 test infrastructure gap applies here |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

Phase 12 is a measurement and documentation phase. All success criteria are verified by human inspection of outputs, not automated tests. The deliverables are:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | Re-render hotspots profiled and documented | manual-only | N/A — profiling requires a running app + dev session | ❌ |
| PERF-02 | Bundle analyzer report generated | manual-only | `ANALYZE=true npm run build` — verify `.next/analyze/client.html` exists | ❌ |
| PERF-03 | Web Vitals logged and recorded | manual-only | N/A — requires browser session with real interactions | ❌ |
| PERF-04 | Socket timing profiled | manual-only | N/A — requires live game session | ❌ |
| PERF-05 | PERF-BASELINE.md written | file existence check | `ls .planning/phases/12-performance-baselines/PERF-BASELINE.md` | ❌ Wave 0 |

**Justification for manual-only:** Performance profiling is inherently runtime-interactive. No part of this phase modifies production code paths — it only adds temporary dev-mode instrumentation and generates reports.

### Wave 0 Gaps
- [ ] `.planning/phases/12-performance-baselines/PERF-BASELINE.md` — the human-authored findings document; created as final task of Plan 02

*(No test framework installation needed — this phase has no automated tests.)*

---

## Sources

### Primary (HIGH confidence)
- `nextjs.org/docs/app/guides/package-bundling` — `@next/bundle-analyzer` and `npx next experimental-analyze` setup, verified 2026-03-16
- `nextjs.org/docs/app/api-reference/functions/use-report-web-vitals` — App Router `useReportWebVitals` pattern, verified 2026-03-16
- `react.dev/reference/react/Profiler` — `<Profiler>` component API, onRender signature, verified 2026-03-18
- `github.com/welldone-software/why-did-you-render/issues/298` — confirmed v10.0.0 React 19 support (released 2025-01-18)

### Secondary (MEDIUM confidence)
- `nextjs.org/docs/pages/api-reference/functions/use-report-web-vitals` — Pages Router version confirms same metric names apply to App Router implementation
- `web.dev/articles/vitals` — INP replaced FID in March 2024, thresholds: LCP < 2.5s, INP < 200ms, CLS < 0.1

### Tertiary (LOW confidence)
- Next.js 16.x default build mode (Turbopack vs webpack for `npm run dev`) — not explicitly checked; verify before Plan 01 execution

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools verified against official docs or official GitHub
- Architecture patterns: HIGH — `@next/bundle-analyzer` config and `useReportWebVitals` pattern confirmed from nextjs.org (updated 2026-03-16)
- Pitfalls: HIGH — WDYR React 19 issue confirmed resolved; nesting order from project STATE.md decisions; profiler dev-only confirmed from React docs
- Socket timing approach: MEDIUM — `performance.now()` approach is standard browser API; lobby_tick frequency is application-specific and unverified

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable tools; @next/bundle-analyzer and WDYR are not fast-moving)
