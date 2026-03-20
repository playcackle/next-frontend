---
phase: 10-sentry-foundation
plan: 01
subsystem: infra
tags: [sentry, error-monitoring, next.js, instrumentation, observability]

# Dependency graph
requires: []
provides:
  - "@sentry/nextjs SDK initialized across browser, Node.js, and Edge runtimes"
  - "src/lib/sentry.ts abstraction layer with setSentryUser, setSentryGameContext, clearSentryUser, captureException"
  - "src/app/global-error.tsx App Router top-level error boundary"
  - "next.config.mjs wrapped with withSentryConfig (tunnelRoute /monitoring)"
  - "check:sourcemaps and build:check scripts in package.json"
affects:
  - 10-02
  - all-future-phases

# Tech tracking
tech-stack:
  added: ["@sentry/nextjs@^10.44.0"]
  patterns:
    - "All application code imports Sentry helpers from src/lib/sentry.ts — never @sentry/nextjs directly (exception: global-error.tsx)"
    - "tracesSampleRate: 0.1 across all runtimes — quota protection for real-time game"
    - "Tunnel route /monitoring bypasses ad-blockers for Sentry events"

key-files:
  created:
    - src/lib/sentry.ts
    - src/instrumentation-client.ts
    - src/instrumentation.ts
    - sentry.server.config.ts
    - sentry.edge.config.ts
    - src/app/global-error.tsx
  modified:
    - next.config.mjs
    - package.json

key-decisions:
  - "Wizard created instrumentation files in src/ (not root) — files at src/instrumentation-client.ts and src/instrumentation.ts"
  - "tracesSampleRate: 0.1 not 1.0 — real-time game would exhaust Sentry quota at full sampling"
  - "sendDefaultPii removed from all configs — user identity provided explicitly via Sentry.setUser() in Plan 02"
  - "Replay integration removed from client config — not part of this plan scope"
  - "global-error.tsx uses custom UI instead of NextError dependency — cleaner boundary, plan spec followed"
  - "onRequestError = Sentry.captureRequestError export preserved in src/instrumentation.ts (wizard-generated)"

patterns-established:
  - "Sentry abstraction boundary: src/lib/sentry.ts is sole import point for application code"
  - "Quota-safe sampling: all runtime configs use tracesSampleRate: 0.1, sampleRate: 1.0 (errors always captured)"

requirements-completed: [OBS-01, OBS-02]

# Metrics
duration: 25min
completed: 2026-03-18
---

# Phase 10 Plan 01: Sentry Foundation Summary

**Sentry SDK initialized across browser, Node.js, and Edge runtimes with quota-safe sampling (0.1), tunnel route /monitoring, src/lib/sentry.ts abstraction layer, and App Router global error boundary**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-18T00:00:00Z
- **Completed:** 2026-03-18T00:25:00Z
- **Tasks:** 3 (Task 1 human-action, Tasks 2-3 auto)
- **Files modified:** 8

## Accomplishments
- All three Sentry runtimes initialized (browser via instrumentation-client.ts, Node via sentry.server.config.ts, Edge via sentry.edge.config.ts)
- Tunnel route /monitoring active in next.config.mjs — Sentry events bypass ad-blockers
- src/lib/sentry.ts abstraction layer prevents @sentry/nextjs imports spreading through codebase
- App Router global-error.tsx boundary captures top-level render crashes with Sentry.captureException
- Source map verification scripts added to package.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Run Sentry wizard and add env vars** - human-action (no commit — wizard output)
2. **Task 2: Harden Sentry config files** - `9b4a087` (feat)
3. **Task 3: Create lib/sentry.ts helpers, global-error.tsx, and package.json scripts** - `f1298a2` (feat)

## Files Created/Modified
- `sentry.server.config.ts` - Node.js runtime SDK init (env var DSN, tracesSampleRate: 0.1)
- `sentry.edge.config.ts` - Edge runtime SDK init (env var DSN, tracesSampleRate: 0.1)
- `src/instrumentation-client.ts` - Browser SDK init (tracesSampleRate: 0.1, beforeSend xhr-poll filter)
- `src/instrumentation.ts` - register() hook loading server/edge configs, onRequestError export
- `next.config.mjs` - withSentryConfig wrapper with tunnelRoute: "/monitoring" enabled
- `src/lib/sentry.ts` - Central Sentry abstraction (setSentryUser, setSentryGameContext, clearSentryUser, captureException)
- `src/app/global-error.tsx` - App Router top-level boundary capturing to Sentry, custom UI with reset
- `package.json` - Added check:sourcemaps and build:check scripts

## Decisions Made
- Wizard placed instrumentation files in `src/` (not root) — edited them there, no relocation needed
- Removed `sendDefaultPii: true` from all configs — user identity will be set explicitly via `setSentryUser()` in Plan 02, not leaked automatically
- Removed Replay integration from client config — not in plan scope, reduces bundle size
- Preserved `onRequestError = Sentry.captureRequestError` in instrumentation.ts — wizard-generated, useful for server error capture
- Used custom UI in global-error.tsx instead of NextError — eliminates dependency on next/error internals

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wizard created instrumentation files in src/, not root**
- **Found during:** Task 2 (Harden wizard-generated config files)
- **Issue:** Plan expected wizard to create files at root; wizard placed them at src/instrumentation-client.ts and src/instrumentation.ts
- **Fix:** Edited files at their actual location (src/); deleted incorrectly-created root-level files
- **Files modified:** src/instrumentation-client.ts, src/instrumentation.ts (deleted root-level duplicates)
- **Verification:** TypeScript check passes with zero errors
- **Committed in:** 9b4a087 (Task 2 commit)

**2. [Rule 1 - Bug] global-error.tsx already created by wizard with NextError and missing reset prop**
- **Found during:** Task 3 (Create lib/sentry.ts helpers, global-error.tsx)
- **Issue:** Wizard created a global-error.tsx using `NextError` component and missing the `reset` prop; plan specifies custom UI with reset button
- **Fix:** Replaced with plan-specified implementation (html+body wrapper, custom UI, reset prop)
- **Files modified:** src/app/global-error.tsx
- **Verification:** TypeScript check passes, component matches plan spec
- **Committed in:** 9b4a087 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs from wizard output differing from plan expectations)
**Impact on plan:** All deviations were necessary corrections to wizard output. No scope creep. Plan requirements fully met.

## Issues Encountered
- Sentry wizard placed files in `src/` directory instead of project root as plan expected. Resolved by editing files at their actual location.

## User Setup Required
The following env vars must be set in `.env.local` (set by user in Task 1):
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

## Next Phase Readiness
- SDK fully initialized across all runtimes — Plan 02 can import from src/lib/sentry.ts immediately
- setSentryUser, setSentryGameContext, clearSentryUser, captureException all available
- Tunnel route /monitoring active — no observability gap
- Source map verification: run `npm run check:sourcemaps` after production build to confirm 0 map files leak

---
*Phase: 10-sentry-foundation*
*Completed: 2026-03-18*
