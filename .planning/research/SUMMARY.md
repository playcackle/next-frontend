# Project Research Summary

**Project:** v1.3 Observability & Performance — Sentry error monitoring + Next.js/React performance profiling
**Domain:** Real-time multiplayer quiz game — Next.js 16 App Router, React 19, Socket.IO, Jotai, Supabase
**Researched:** 2026-03-17
**Confidence:** MEDIUM

## Executive Summary

This milestone adds production observability and performance measurement to an existing real-time multiplayer quiz game (v1.2 complete). The recommended approach is a layered build: install the Sentry Next.js SDK via the official wizard first, then add error boundaries, then measure performance baselines, then fix the top bottlenecks. Each layer depends on the previous one — you cannot meaningfully profile re-renders without granular atom subscriptions (already in place from v1.2), and you cannot validate performance fixes without baselines established in the measurement phase. The entire milestone is additive; no existing game logic needs to change.

The key architectural insight is that this app's real-time nature makes standard observability defaults wrong. `tracesSampleRate: 1.0` will exhaust Sentry quota within hours during active play. Socket.IO event handlers are invisible to React error boundaries. `@next/bundle-analyzer` must be composed in the correct order with `withSentryConfig`. These are not edge cases — they are predictable failure modes that must be addressed at configuration time (Phase 1), not discovered later.

The highest-risk components are `UnifiedMessages`, `LeaderBoard`, and `SlotGrid`, all of which receive high-frequency Jotai atom updates driven by Socket.IO events. The v1.2 granular atom refactor makes these components isolatable for profiling — re-render analysis is now viable where it was not before. The performance fix phase should target these three components first.

---

## Key Findings

### Recommended Stack

The stack is narrow and appropriate for the problem. `@sentry/nextjs` (v8.x, installed via wizard) is the single unified SDK that handles browser, server, and edge runtimes for App Router — no split client/node SDK setup. `@next/bundle-analyzer` (must match Next.js major version: `^16.x`) wraps `webpack-bundle-analyzer` with the correct Next.js config. `web-vitals` (v4.x) provides real-user Core Web Vitals including INP, which replaced FID as a Core Web Vital in March 2024. `@welldone-software/why-did-you-render` (v8.x) is a dev-only diagnostic tool with a React 19 compatibility question that must be verified before installing — React DevTools Profiler is the zero-risk fallback.

**Core technologies:**
- `@sentry/nextjs@^8.x`: Error capture + performance tracing for App Router — install via wizard, not manually
- `@next/bundle-analyzer@^16.x`: Bundle visualization — must match `next` major version; wrap inside `withSentryConfig`
- `web-vitals@^4.x`: Real-user Core Web Vitals (LCP, CLS, INP, FCP, TTFB) — INP support requires v4+
- `@welldone-software/why-did-you-render@^8.x`: Dev-only re-render diagnostics — verify React 19 compatibility before installing; fall back to React DevTools Profiler if incompatible

### Expected Features

The research distinguishes clearly between features required for the milestone to function and features that add value but are not blocking.

**Must have (table stakes for v1.3):**
- Sentry SDK installed with DSN + all three config files (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)
- Unhandled error auto-capture (free with SDK init)
- Global `error.tsx` boundary — prevents white-screen crashes for the whole app
- Gameroom `error.tsx`/`GameroomErrorBoundary` with silent recovery — players mid-game must not see a crash screen
- User identity in Sentry scope via `SentryUserSync` + Supabase auth
- Game room context in Sentry scope (`roomId`, `phase`)
- Source maps uploaded to Sentry with `hideSourceMaps: true` — unreadable stack traces make the monitoring useless
- Bundle analysis baseline before any fix work
- Web Vitals baseline (LCP, CLS, INP) before any fix work
- React re-render hotspots profiled on `UnifiedMessages`, `LeaderBoard`, `SlotGrid`
- Top 3 highest-impact bottlenecks fixed and verified against baselines

**Should have (P2, add after core is working):**
- Sentry breadcrumbs on key game events (room join, round start, answer submit) — lightweight reproduction trail
- Game phase context tag in Sentry (`answering` / `intermission` / `game_over`)
- Socket overhead profiling via `performance.mark()` in `useGameEvents.ts`

**Defer (v2+):**
- Sentry Alerts / notification thresholds — requires stable baseline and ops ownership
- OpenTelemetry server-side tracing — only relevant if backend observability is added
- Sentry Session Replay — privacy violation for a live quiz game; adds ~50KB bundle; high quota cost

**Anti-features (do not implement):**
- Sentry Session Replay (privacy risk outweighs benefit for a quiz game)
- `window.onerror` / custom global handler (duplicates SDK, risks double-reporting)
- Continuous production profiler (`@sentry/profiling-node` is server-side only, irrelevant here)

### Architecture Approach

The architecture is a layered set of new files and targeted modifications to existing ones. Sentry config files live at the project root (not inside `src/`); `src/instrumentation.ts` is the only correct server-side init point in App Router. All Sentry calls from application code route through `src/lib/sentry.ts` helpers — no component imports `@sentry/nextjs` directly. Error boundaries are layered: `global-error.tsx` is the last resort (destroys root layout), `GameroomErrorBoundary` is the first line of defence (attempts silent recovery, keeps app shell alive). `SentryUserSync` is a side-effect-only Client Component mounted in `provider.tsx` that subscribes to Supabase auth state and keeps Sentry user context current.

**Major components:**
1. `sentry.{client,server,edge}.config.ts` (root) — SDK init for each runtime; all three required
2. `src/instrumentation.ts` — App Router contract for server-side init; `register()` hook
3. `src/lib/sentry.ts` — thin wrappers (`setSentryUser`, `setSentryGameContext`, `clearSentryUser`) isolating Sentry from components
4. `src/components/SentryUserSync.tsx` — mounts in Provider; syncs Supabase auth state to Sentry user context
5. `src/app/global-error.tsx` — top-level React boundary; captures to Sentry via `useEffect`
6. `src/components/GameroomErrorBoundary.tsx` — class-based boundary; silent recovery attempt; captures with room context
7. `next.config.mjs` (modified) — `withSentryConfig(withBundleAnalyzer(nextConfig), sentryOptions)` (order matters)

**Build order is dependency-driven:**
SDK init → `lib/sentry.ts` helpers → `SentryUserSync` + Provider → `global-error.tsx` → `GameroomErrorBoundary` → gameroom page wrapping → socket hook captures → optional `error.tsx`

### Critical Pitfalls

1. **Source maps publicly accessible** — `hideSourceMaps: true` AND `deleteSourcemapsAfterUpload: true` are both required in `withSentryConfig`. The wizard does not always set both. Verify with `find .next -name "*.map"` after production build — expect zero results. Treat as a security gate in Phase 1.

2. **Sentry events blocked by ad blockers** — For a consumer game platform, a significant fraction of users run ad blockers that block `*.ingest.sentry.io`. Add a tunnel route (`src/app/api/sentry-tunnel/route.ts`) that proxies events through your own domain. Include DSN host validation to prevent SSRF. This is a single file — add it in Phase 1, not later.

3. **Socket.IO errors invisible to React error boundaries** — Error boundaries only catch render-time errors. Socket.IO `connect_error`, `useEffect` errors, and async errors are outside React's rendering cycle. Three layers are required together: error boundary (render crashes) + Sentry automatic global capture (async/unhandledrejection) + explicit `Sentry.captureException` in `connect_error` handlers. Missing any layer leaves a category of errors silent.

4. **Event flood exhausting Sentry quota** — `lobby_tick` and similar high-frequency events can generate thousands of Sentry events per minute if a handler throws. Set `tracesSampleRate: 0.1` (never `1.0` in production for a real-time app) and add a `beforeSend` filter to drop known-benign transport errors. Add a deduplication guard on `connect_error` (once per 30 seconds max). Configure this in Phase 1 before any production traffic.

5. **`@next/bundle-analyzer` + `withSentryConfig` composition order** — `withSentryConfig` must be the outermost wrapper: `withSentryConfig(withBundleAnalyzer(nextConfig), sentryOptions)`. Reversed order breaks Sentry's webpack plugin injection silently — source maps stop uploading with no error message.

---

## Implications for Roadmap

Research strongly suggests three phases with a clear dependency chain: foundation first, then boundaries, then profiling and fixes.

### Phase 1: Sentry Foundation
**Rationale:** Every other monitoring feature depends on the SDK being initialized. Source map security and event flood prevention must be configured before any production traffic hits the new SDK — these cannot be retrofitted safely. The tunnel route must also be present from the start to avoid a gap in observability for ad-blocker users.
**Delivers:** Working Sentry pipeline — errors captured, stack traces readable, user context attached, events flowing through tunnel, quota-safe config
**Addresses:** Sentry SDK install, unhandled error auto-capture, user identity, game room context, source maps, tunnel route
**Avoids:** Source maps public (Pitfall 1), ad-blocker data loss (Pitfall 2), event flood (Pitfall 6), PII in events

### Phase 2: Error Boundaries
**Rationale:** With Sentry initialized, error boundaries can be wired to `Sentry.captureException`. The gameroom boundary's silent recovery pattern requires `GameroomErrorBoundary` to be a class component (React 19 has no hook equivalent for `componentDidCatch`). Socket error capture belongs here because it closes the coverage gap left by boundaries-only thinking.
**Delivers:** Layered error containment — gameroom crashes attempt silent recovery; global crashes show minimal fallback; socket errors are captured explicitly
**Addresses:** Global `error.tsx`, `GameroomErrorBoundary` with silent recovery, socket error capture in `useGameSocket` + `useChatWs`
**Avoids:** Silent socket error swallowing (Pitfall 3), single-boundary strategy anti-pattern, error boundary reset mismatching Socket.IO lifecycle

### Phase 3: Performance Baselines
**Rationale:** Baselines must be established before any fix work — without them there is no way to verify improvement. This phase is measurement-only: bundle analysis, Web Vitals, and re-render profiling. The v1.2 granular atom refactor is a prerequisite that is already complete.
**Delivers:** Documented baselines for bundle size, Web Vitals (LCP, CLS, INP), and re-render counts for `UnifiedMessages`, `LeaderBoard`, `SlotGrid`
**Addresses:** Bundle analysis baseline, Web Vitals baseline, React re-render profiling, socket overhead measurement
**Avoids:** `why-did-you-render` production leak (Pitfall 4), bundle analyzer in production (Pitfall 5), profiling with browser extensions active, measuring only the home page

### Phase 4: Performance Fixes
**Rationale:** Fixes without baselines are guesswork. This phase executes after baselines are documented and uses them as acceptance criteria. The top 3 bottlenecks identified in Phase 3 are addressed and verified against baselines.
**Delivers:** Measurable improvement in the top 3 highest-impact bottlenecks, verified against Phase 3 baselines
**Addresses:** Top 3 bottlenecks from bundle analysis + re-render + Web Vitals data
**Avoids:** Fixing the wrong things (fixes must be chosen from Phase 3 data, not assumptions)

### Phase Ordering Rationale

- Phase 1 before everything else because Sentry init is a hard dependency for all capture features; source map security and quota config cannot be deferred to a follow-up phase without production risk.
- Phase 2 after Phase 1 because `GameroomErrorBoundary.componentDidCatch` calls `Sentry.captureException` — if SDK is not initialized, boundary capture is a no-op and errors are still lost.
- Phase 3 after Phase 2 because the performance profiling tools (`why-did-you-render`, React DevTools Profiler) produce misleading results if the error boundary layer is unstable — crashes during profiling sessions contaminate measurements.
- Phase 4 after Phase 3 because baselines are the acceptance criteria for fixes. Shipping fixes before baselines means the milestone cannot be verified as complete.

### Research Flags

**Phases needing verification before execution:**
- **Phase 1:** Sentry SDK v8 file locations and `withSentryConfig` options must be verified against current SDK docs (https://docs.sentry.io/platforms/javascript/guides/nextjs/) — training knowledge cutoff August 2025, minor breaking changes possible
- **Phase 2:** `react-error-boundary` `resetKeys` API should be verified against https://github.com/bvaughn/react-error-boundary before using it as the recovery mechanism
- **Phase 3:** Verify `@welldone-software/why-did-you-render` React 19 compatibility at https://github.com/welldone-software/why-did-you-render before installing — use React DevTools Profiler exclusively if incompatible

**Phases with standard, well-documented patterns (low research need):**
- **Phase 4:** Performance fix patterns (memoization, atom subscription granularity, lazy loading) are well-established; specific fixes will be guided by Phase 3 data

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | `@sentry/nextjs` v8 and `@next/bundle-analyzer` patterns are well-established; `web-vitals` v4 INP support is HIGH confidence; `why-did-you-render` React 19 compat is LOW confidence — verify before Phase 3 |
| Features | MEDIUM | Sentry SDK file names and config option names drawn from training knowledge; Next.js 16 bundle docs were verified via live fetch; flag Sentry-specific config for live verification before Phase 1 |
| Architecture | MEDIUM | File placement, `instrumentation.ts` pattern, and `withSentryConfig` composition are established SDK patterns; `global-error.tsx` contract and class component requirement for `componentDidCatch` are HIGH confidence |
| Pitfalls | MEDIUM-HIGH | Most pitfalls derived from codebase analysis (direct source) and stable API semantics; `hideSourceMaps` / `deleteSourcemapsAfterUpload` flag names should be verified against current SDK docs |

**Overall confidence:** MEDIUM — sufficient to proceed with planning; flag Sentry-specific API details for live verification at the start of Phase 1 execution.

### Gaps to Address

- **Sentry SDK exact config option names:** Training knowledge (August 2025). Verify `hideSourceMaps`, `deleteSourcemapsAfterUpload`, and `withSentryConfig` option shape against current docs before writing `next.config.mjs`. The Sentry wizard output is the ground truth — run it, review what it generates, then apply project-specific additions.
- **`why-did-you-render` React 19 support:** LOW confidence. Check the library's GitHub issues before Phase 3. If unsupported, React DevTools Profiler covers the same ground for the profiling session — WDYR is a convenience, not a requirement.
- **Sentry v8 vs v9:** Training cutoff is August 2025; Sentry may have released v9 by execution time. The wizard (`npx @sentry/wizard@latest`) selects the current stable version automatically — accept what the wizard installs rather than pinning manually.
- **`instrumentation.ts` location (`src/` vs root):** Next.js 15/16 supports both; the project uses `src/` layout. Verify the wizard places it correctly or check Next.js 16 instrumentation docs for the `src/` variant.

---

## Sources

### Primary (HIGH confidence)
- Next.js 16 Bundle Optimization docs (official, fetched 2026-03-16): https://nextjs.org/docs/app/guides/package-bundling
- Next.js 16 Instrumentation docs (official, fetched 2026-03-16): https://nextjs.org/docs/app/guides/instrumentation
- React 19 error boundary docs: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- Codebase analysis: `src/app/gameroom/hooks/useGameSocket.ts`, `useChatWs.ts`, `useGameEvents.ts`, `provider.tsx`, `src/lib/supabase/client.ts`

### Secondary (MEDIUM confidence)
- Sentry Next.js SDK v8 patterns — training knowledge (August 2025 cutoff); verify at https://docs.sentry.io/platforms/javascript/guides/nextjs/
- `@sentry/wizard` install flow and `instrumentation.ts` pattern — verify at Sentry docs before Phase 1 execution
- `@next/bundle-analyzer` version-matching convention — documented Next.js pattern
- Socket.IO client v4 `connect_error` event API — stable, HIGH confidence

### Tertiary (LOW confidence)
- `@welldone-software/why-did-you-render` React 19 compatibility — unverified; check https://github.com/welldone-software/why-did-you-render before Phase 3
- `react-error-boundary` `resetKeys` API — training knowledge; verify at https://github.com/bvaughn/react-error-boundary before Phase 2

---
*Research completed: 2026-03-17*
*Ready for roadmap: yes*
