---
phase: 12-performance-baselines
plan: "01"
subsystem: infra
tags: [bundle-analyzer, web-vitals, performance, next.config, webpack]

# Dependency graph
requires:
  - phase: 10-sentry-foundation
    provides: withSentryConfig wrapping next.config.mjs — must remain outermost
provides:
  - "@next/bundle-analyzer wired as ANALYZE=true npm run analyze script (webpack mode)"
  - "WebVitalsLogger client component logging LCP, CLS, INP, FCP, TTFB to console in dev"
  - "Bundle treemap HTML reports at .next/analyze/{client,edge,nodejs}.html"
affects:
  - 12-performance-baselines-02
  - any future next.config.mjs changes

# Tech tracking
tech-stack:
  added: ["@next/bundle-analyzer ^16.1.7 (devDependency)"]
  patterns:
    - "Bundle analysis via npm run analyze (ANALYZE=true next build --webpack) — separate from default Turbopack build"
    - "Web Vitals instrumentation via useReportWebVitals in a 'use client' component rendered in root layout"

key-files:
  created:
    - src/app/_components/WebVitalsLogger.tsx
    - .planning/phases/12-performance-baselines/deferred-items.md
  modified:
    - next.config.mjs
    - package.json
    - src/app/layout.tsx

key-decisions:
  - "npm run analyze uses --webpack flag because Next.js 16 defaults to Turbopack which is incompatible with @next/bundle-analyzer"
  - "WebVitalsLogger only logs in NODE_ENV=development — no production noise before baselines are recorded"
  - "withSentryConfig(withBundleAnalyzer(nextConfig)) ordering maintained per locked STATE.md decision"

patterns-established:
  - "WebVitalsLogger pattern: 'use client' component with useReportWebVitals rendered as first child of <body>"
  - "Bundle analysis pattern: separate analyze script using webpack mode, not default build"

requirements-completed: [PERF-02, PERF-03]

# Metrics
duration: 4min
completed: 2026-03-18
---

# Phase 12 Plan 01: Performance Baselines Summary

**@next/bundle-analyzer wired via webpack-mode analyze script and WebVitalsLogger client component added to root layout for dev-console Web Vitals capture**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-18T13:04:08Z
- **Completed:** 2026-03-18T13:07:22Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed `@next/bundle-analyzer` and wrapped `nextConfig` inside `withBundleAnalyzer`, maintaining `withSentryConfig` as outermost wrapper
- Added `npm run analyze` script using `--webpack` flag to bypass Turbopack incompatibility
- Generated `.next/analyze/client.html`, `edge.html`, `nodejs.html` treemap reports
- Created `WebVitalsLogger` client component using `useReportWebVitals` — logs all five core vitals to browser console in development
- Rendered `<WebVitalsLogger />` as first child of `<body>` in root layout for early instrumentation

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @next/bundle-analyzer and update next.config.mjs** - `fd80c4c` (feat)
2. **Task 2: Create WebVitalsLogger and wire into root layout** - `b343b44` (feat)

## Files Created/Modified
- `src/app/_components/WebVitalsLogger.tsx` - Client component using useReportWebVitals; logs LCP/CLS/INP/FCP/TTFB to console in dev mode only
- `next.config.mjs` - Added withBundleAnalyzer wrapper; ANALYZE env var controls enabling; withSentryConfig remains outermost
- `package.json` - Added @next/bundle-analyzer devDependency and analyze script
- `src/app/layout.tsx` - Import and render WebVitalsLogger as first child of body

## Decisions Made
- `npm run analyze` uses `next build --webpack` — Next.js 16 defaults to Turbopack which is incompatible with `@next/bundle-analyzer`. The `--webpack` flag forces webpack mode to generate the treemap HTML files.
- `WebVitalsLogger` only logs in `NODE_ENV === 'development'` — plan specifies removal or gating after baselines are recorded; dev-only ensures no production console noise in the interim.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added --webpack flag to analyze script for Next.js 16 Turbopack incompatibility**
- **Found during:** Task 1 (install @next/bundle-analyzer)
- **Issue:** `ANALYZE=true npm run build` produced no `.next/analyze/` output — Next.js 16 defaults to Turbopack, which is incompatible with `@next/bundle-analyzer`. The package logs "The Next Bundle Analyzer is not compatible with Turbopack builds, no report will be generated."
- **Fix:** Added dedicated `analyze` script in package.json: `ANALYZE=true next build --webpack` to force webpack mode
- **Files modified:** `package.json`
- **Verification:** `npm run analyze` generated `client.html`, `edge.html`, `nodejs.html` in `.next/analyze/`
- **Committed in:** `fd80c4c` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in build command compatibility)
**Impact on plan:** Auto-fix necessary for the core deliverable. The `--webpack` flag is the documented approach for `@next/bundle-analyzer` on Turbopack projects. No scope creep.

## Issues Encountered

Pre-existing TypeScript errors in `.next/types/app/api/[...path]/route.ts` were exposed by the webpack build (`.next/types/` is generated by webpack but not Turbopack). The errors are in `RouteParams` type definitions incompatible with Next.js 16's async params — they pre-exist and are unrelated to Phase 12 work. Logged to `deferred-items.md`. The `WebVitalsLogger.tsx` and `layout.tsx` changes are TypeScript clean.

## Next Phase Readiness
- Bundle analysis tooling operational — run `npm run analyze` to regenerate treemap reports
- WebVitalsLogger active — start `npm run dev`, navigate to `/` or `/gameroom/[id]`, open browser console to see `[WebVitals]` lines
- Plan 02 checkpoint will capture actual baseline measurements from both instruments

---
*Phase: 12-performance-baselines*
*Completed: 2026-03-18*
