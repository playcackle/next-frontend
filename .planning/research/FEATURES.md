# Feature Research

**Domain:** Sentry error monitoring + Next.js/React performance profiling for a real-time multiplayer quiz game
**Researched:** 2026-03-17
**Confidence:** MEDIUM — Sentry Next.js SDK docs blocked during fetch; Sentry features drawn from training knowledge (SDK v8/v9 era) supplemented by verified Next.js 16 official docs. Flag Sentry-specific config details for live verification before implementation.

---

## Feature Landscape

### Table Stakes (Users Expect These)

These are the baseline features every production observability setup requires. Missing any of these means errors go undetected or the monitoring system is misleading.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Sentry SDK installed with DSN | Without DSN config, nothing is captured — monitoring is a no-op | LOW | `@sentry/nextjs` package + `NEXT_PUBLIC_SENTRY_DSN` env var; `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` required for App Router |
| Unhandled JS errors auto-captured | Engineers expect "it just works" for uncaught exceptions and unhandled promise rejections | LOW | SDK auto-captures these on init; no manual instrumentation required |
| Global `error.tsx` boundary (App Router) | Next.js App Router requires `error.tsx` at root to catch unhandled render errors; without it crashes produce a white screen | LOW | Must be a Client Component (`'use client'`); receives `error` and `reset` props; calls `Sentry.captureException(error)` in `useEffect` |
| Gameroom route-level `error.tsx` boundary | Gameroom crashes should not kill the whole app — route isolation prevents global navigation from breaking | LOW | `src/app/gameroom/error.tsx`; same pattern as global but with gameroom-specific fallback UI |
| User identity attached to Sentry events | Without user context, events are anonymous — impossible to correlate errors with specific sessions | LOW | `Sentry.setUser({ id, email, username })` called after Supabase auth resolves; cleared on logout |
| Game room context in Sentry scope | In a multiplayer game, "which room did this crash in?" is essential for reproducing errors | LOW | `Sentry.setTag('gameroom_id', roomId)` or `Sentry.setContext('gameroom', { id, phase })` set when room joined, cleared when left |
| Source maps uploaded to Sentry | Without source maps, stack traces show minified code — errors are effectively undebuggable in production | MEDIUM | `withSentryConfig` wrapper in `next.config.mjs` with `hideSourceMaps: true` + Sentry webpack plugin; requires `SENTRY_AUTH_TOKEN` in CI |
| Bundle analysis baseline | Cannot identify regressions without a baseline; Next.js 16 ships `npx next experimental-analyze` (Turbopack) and `@next/bundle-analyzer` (Webpack) | LOW | Run once pre-milestone, save output to `.next/diagnostics/analyze`; `@next/bundle-analyzer` is the stable option for Webpack builds |
| Web Vitals baseline (LCP, CLS, INP) | Core Web Vitals are the industry standard metric for perceived performance; without a baseline you cannot measure improvement | LOW | Next.js App Router exports `reportWebVitals` from `_app` (Pages) or via `useReportWebVitals` hook in a Client Component; can pipe to Sentry's `captureEvent` |

### Differentiators (Competitive Advantage)

These go beyond baseline monitoring and directly address the real-time, high-frequency event nature of this specific application.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Gameroom silent recovery on crash | Users mid-game should not see a crash screen — the gameroom boundary should attempt auto-reset before showing a fallback | MEDIUM | `react-error-boundary` package provides `resetKeys` prop to auto-reset when a key (e.g., `roundId` atom) changes; fallback is a minimal spinner, not a full error page. Dependency: Jotai `roundId` atom must be accessible from error boundary context |
| Socket event overhead profiling | Socket.IO event handlers fire on every game event — without profiling, hot paths may cause excessive re-renders invisible to Web Vitals | MEDIUM | Manual `performance.mark()` / `performance.measure()` around `useGameEvents` socket callbacks; report to Sentry as custom spans or log to console in dev. No library required, but requires instrumentation touch-points in `useGameEvents.ts` and `useChatSocket.ts` |
| React re-render profiling (gameroom) | The gameroom has ~10 components subscribed to Jotai atoms; uncontrolled re-renders in `UnifiedMessages`, `LeaderBoard`, and `SlotGrid` are the highest-risk hotspots | MEDIUM | React DevTools Profiler (dev-only) + `why-did-you-render` library for automated detection. Both are dev-only tools with zero production bundle impact. Dependency: existing granular atom subscriptions from v1.2 are prerequisite |
| Game phase context in Sentry events | Errors during `answering` vs `intermission` vs `game_over` have different causes; phase context makes triage faster | LOW | `Sentry.setTag('game_phase', currentPhase)` updated via `useEffect` on `gamePhaseAtom` changes |
| Performance mode correlation in errors | An error that only occurs when `performanceModeAtom` is off may indicate animation-specific crashes | LOW | Include `performanceMode` in Sentry scope — `Sentry.setContext('app_settings', { performanceMode })` |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Sentry Session Replay | "Record exactly what the user did before the crash" sounds very useful | Captures all user input including answers, usernames, chat messages — privacy violation for a live quiz game; adds ~50KB to bundle; high Sentry quota cost | Use Sentry breadcrumbs with manual `Sentry.addBreadcrumb()` calls on key events (room join, round start, answer submit) for a lightweight reproduction trail |
| OpenTelemetry / `@vercel/otel` for client-side | Next.js 16 officially recommends OTel but it is a server-side tracing tool | OTel's `instrumentation.ts` runs only at server startup; it adds no value for client-side React performance. Adds package weight and configuration complexity for zero client benefit | Use Sentry performance tracing on the client (already part of `@sentry/nextjs`); use OTel only if backend observability is added in a future milestone |
| Sentry Profiling (continuous profiler) | "Profile everything in production" sounds thorough | Continuous profiling adds CPU overhead on every request; `@sentry/profiling-node` is server-side only and not relevant to this client-heavy app; React render profiling is better done with React DevTools + `why-did-you-render` in dev | Use React DevTools Profiler in dev to find hotspots, then verify fixes with Web Vitals in production |
| Custom error page UI for gameroom crashes | "Show branded recovery UI" seems polished | For a real-time game, any visible error UI means the user has exited game state — they will not recover. Showing a styled error page is worse than silent recovery via boundary reset | Implement silent recovery with `resetKeys` first; only show minimal fallback ("reconnecting...") if reset fails after 2+ attempts |
| Sentry Alerts/Notifications setup | "Set up alerts for every error" is standard practice | Out of scope for this milestone — alerting requires product decisions about thresholds, on-call rotation, and Sentry project ownership. Alerts also require a stable baseline before they can be calibrated meaningfully | Defer alerting to a future ops milestone; this milestone delivers capture + baseline |
| `window.onerror` / custom global handler | "We need full control over error capture" | Duplicates what `@sentry/nextjs` already provides and risks double-reporting; conflicts with Sentry's own global handler | Rely on SDK's auto-capture; extend with `beforeSend` hook in `sentry.client.config.ts` to filter/enrich events |

---

## Feature Dependencies

```
[Sentry SDK + DSN config]
    └──required by──> [Unhandled error auto-capture]
    └──required by──> [User identity in events]
    └──required by──> [Game room context in events]
    └──required by──> [Game phase context in events]
    └──required by──> [Global error.tsx boundary (Sentry.captureException)]
                          └──required by──> [Gameroom route error.tsx boundary]
                                                └──enhanced by──> [Silent recovery with resetKeys]

[Jotai roundId / gamePhaseAtom]
    └──required by──> [Silent recovery resetKeys]
    └──required by──> [Game phase context in events]

[v1.2 granular atom subscriptions]
    └──prerequisite for──> [React re-render profiling — hotspots are now isolatable per component]

[Bundle analysis baseline]
    └──required by──> [Bundle size fix work (top 3 bottlenecks)]

[Web Vitals baseline]
    └──required by──> [LCP/CLS/INP improvement work]

[Socket overhead profiling]
    └──informs──> [Top 3 highest-impact bottleneck fixes]
```

### Dependency Notes

- **Sentry SDK required by all monitoring features:** DSN config is the foundation; every other Sentry feature assumes `Sentry.init()` has run.
- **Global error boundary required before gameroom boundary:** The gameroom boundary inherits the global Sentry init; if global init has not run, `Sentry.captureException` in gameroom boundary is a no-op.
- **v1.2 granular atoms enhance re-render profiling:** Because `LeaderBoard`, `AnswerReveal`, and `PostGameShowcase` now subscribe to specific atoms (not full `gameStateAtom`), re-render profiling can isolate which atom subscription is over-triggering. This would not have been possible before v1.2.
- **Silent recovery requires accessible Jotai atom:** `resetKeys` on `react-error-boundary` watches a value; the boundary component must be able to read `roundId` from Jotai — requires the Jotai `Provider` to be an ancestor of the error boundary, which it already is in `src/app/provider.tsx`.
- **Baselines before fixes:** Bundle analysis and Web Vitals measurement must complete before the fix phase — otherwise there is no way to verify improvement.

---

## MVP Definition

This is a subsequent milestone (v1.3), not a greenfield project. "MVP" here means minimum viable observability — the minimum required to ship the milestone requirements.

### Launch With (v1.3 milestone scope)

- [x] Sentry SDK installed + DSN config — without this, nothing else works
- [x] Unhandled error auto-capture — zero-effort, comes with SDK
- [x] Global `error.tsx` boundary with `Sentry.captureException` — prevents silent white-screen crashes
- [x] Gameroom `error.tsx` boundary with silent recovery attempt — protects live game sessions
- [x] User identity in Sentry scope — makes errors attributable
- [x] Game room context in Sentry scope — makes errors reproducible
- [x] Source maps uploaded — makes stack traces readable
- [x] Bundle analysis run + baseline saved — prerequisite for fix phase
- [x] Web Vitals baseline measured — prerequisite for fix phase
- [x] React re-render hotspots profiled (dev-only) — prerequisite for fix phase
- [x] Socket overhead measured — prerequisite for fix phase
- [x] Top 3 highest-impact bottlenecks fixed + verified against baselines

### Add After Validation (v1.x)

- [ ] Sentry breadcrumbs on key game events (answer submit, round start, room join) — valuable for error reproduction, but not blocking
- [ ] Game phase context tag in Sentry — nice-to-have for triage speed
- [ ] Performance mode correlation in Sentry scope — low-signal until a correlated bug is found

### Future Consideration (v2+)

- [ ] Sentry Alerts / notification thresholds — needs ops ownership and stable baseline
- [ ] Continuous production performance monitoring — Web Vitals already cover this adequately for now
- [ ] OpenTelemetry server-side tracing — only relevant if backend observability is added

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Sentry SDK + DSN config | HIGH (foundation) | LOW | P1 |
| Global error.tsx boundary | HIGH (prevents white screens) | LOW | P1 |
| Gameroom error.tsx boundary | HIGH (protects live game) | LOW | P1 |
| User + room context in Sentry | MEDIUM (ops value) | LOW | P1 |
| Source maps upload | HIGH (stack trace readability) | MEDIUM | P1 |
| Bundle analysis baseline | HIGH (required for fix work) | LOW | P1 |
| Web Vitals baseline | HIGH (required for fix work) | LOW | P1 |
| React re-render profiling | HIGH (identifies real hotspots) | MEDIUM | P1 |
| Silent recovery with resetKeys | HIGH (mid-game crash UX) | MEDIUM | P1 |
| Socket overhead profiling | MEDIUM (targeted fix input) | MEDIUM | P2 |
| Game phase context tag | LOW (triage convenience) | LOW | P2 |
| Sentry breadcrumbs on events | MEDIUM (reproduction aid) | MEDIUM | P2 |
| `why-did-you-render` integration | MEDIUM (dev-only, automated re-render detection) | LOW | P2 |
| Sentry Session Replay | LOW (privacy risk outweighs benefit) | HIGH | P3 (anti-feature) |
| OpenTelemetry / `@vercel/otel` | LOW (client app, minimal server benefit) | HIGH | P3 (anti-feature) |

---

## Implementation Notes by Feature Group

### Sentry App Router Setup (MEDIUM confidence — verify against current SDK docs)

Sentry Next.js SDK (v8+) requires three config files for App Router:
- `sentry.client.config.ts` — browser-side init (DSN, integrations, `beforeSend` hook)
- `sentry.server.config.ts` — Node.js server-side init
- `sentry.edge.config.ts` — Edge runtime init

`next.config.mjs` must be wrapped with `withSentryConfig(nextConfig, sentryOptions)`. The `sentryOptions` object controls source map upload, tree-shaking of debug code, and tunnel route (optional, bypasses ad-blockers).

The App Router `error.tsx` convention is the primary mechanism for route-level error boundaries. The file must be `'use client'` — server components cannot catch render errors.

### Error Boundary Silent Recovery Pattern

React's built-in error boundary (class component) has no auto-reset mechanism. The `react-error-boundary` package (`bvaughn/react-error-boundary`) provides:
- `resetKeys` prop — array of values; boundary resets automatically when any value changes
- `onReset` callback — fires before reset; good place to clear stale socket state or re-request game state
- `FallbackComponent` prop — receives `error` and `resetErrorBoundary`; can render a spinner that auto-dismisses

Recommended pattern for gameroom:
1. Wrap `<GameroomContent>` with `<ErrorBoundary resetKeys={[roundId]} FallbackComponent={GameroomRecoveringFallback} onError={Sentry.captureException}>`
2. `GameroomRecoveringFallback` shows a "Reconnecting..." indicator (reuse existing `ReconnectingIndicator` pattern from v1.0)
3. If `roundId` changes (next round starts), boundary resets automatically — user re-enters game seamlessly
4. Only if boundary has reset 3+ times without recovery should it escalate to a "something went wrong" message

**What error boundaries do NOT catch** (must use try/catch or Sentry's global handler):
- Event handler errors (Socket.IO `on('event')` callbacks)
- Async errors in `useEffect`
- Errors in the boundary component itself

### Performance Profiling Approach

**Bundle analysis:** `npx next experimental-analyze` (Turbopack, experimental) or `ANALYZE=true npm run build` with `@next/bundle-analyzer` (Webpack, stable). Given this project's Next.js 16 setup, both are available. Use `@next/bundle-analyzer` for stable output suitable for baseline diffing.

**Web Vitals:** Next.js 16 does not expose `reportWebVitals` in App Router by default. Use the `useReportWebVitals` hook (Client Component) placed in `app/layout.tsx` or a dedicated `WebVitalsReporter` component. Route results to `console.log` for local baseline and optionally to `Sentry.captureEvent` for production tracking.

**React re-render profiling:** React DevTools Profiler (browser extension) is the primary tool — no installation required. `@welldone-software/why-did-you-render` (dev dependency only) adds automatic console warnings for avoidable re-renders. Both are zero production impact. Highest-risk components based on v1.2 audit: `UnifiedMessages` (high-frequency message appends), `LeaderBoard` (score updates on every correct answer), `SlotGrid` (slot state changes per event).

**Socket overhead:** `performance.mark('socket:event:start')` / `performance.mark('socket:event:end')` around the socket event handler dispatch in `useGameEvents.ts`. `performance.measure()` then gives event processing duration. Target: < 5ms per event to avoid blocking 60fps rendering.

---

## Sources

- Next.js 16 Bundle Optimization docs (official, fetched 2026-03-16): https://nextjs.org/docs/app/guides/package-bundling
- Next.js 16 Instrumentation docs (official, fetched 2026-03-16): https://nextjs.org/docs/app/guides/instrumentation
- React error boundary docs (official, fetched): https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- Sentry Next.js SDK: training knowledge (v8/v9 era) — LOW confidence on exact file names and config options; verify against https://docs.sentry.io/platforms/javascript/guides/nextjs/ before implementation
- `react-error-boundary` (bvaughn/react-error-boundary): training knowledge — verify `resetKeys` API against https://github.com/bvaughn/react-error-boundary

---

*Feature research for: Sentry error monitoring + Next.js/React performance profiling (v1.3 Observability & Performance milestone)*
*Researched: 2026-03-17*
