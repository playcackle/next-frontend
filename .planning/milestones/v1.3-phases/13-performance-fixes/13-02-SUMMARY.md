---
phase: 13-performance-fixes
plan: 02
subsystem: infra
tags: [next/dynamic, bundle-optimization, supabase, sentry, webpack, code-splitting]

# Dependency graph
requires:
  - phase: 12-performance-baselines
    provides: PERF-BASELINE.md with Supabase 645KB chunk baseline measurement

provides:
  - next/dynamic lazy-loading of SentryUserSync in Provider.tsx
  - Supabase chunk deferred out of main entry bundle

affects:
  - 13-performance-fixes

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "next/dynamic with ssr: false for components that have no SSR value and pull in large dependencies"
    - "Named export dynamic import pattern: .then((m) => ({ default: m.NamedExport }))"

key-files:
  created: []
  modified:
    - src/app/provider.tsx

key-decisions:
  - "SentryUserSync dynamic import uses ssr: false — component only sets Sentry user context, no server-side HTML output, safe to defer to client"
  - "Dynamic import placed in Provider.tsx (Client Component) not layout.tsx (Server Component) — Next.js only code-splits dynamic imports from Client Components"

patterns-established:
  - "Named export dynamic import: dynamic(() => import('@/...').then((m) => ({ default: m.Named })), { ssr: false })"

requirements-completed: [PERF-06]

# Metrics
duration: 10min
completed: 2026-03-19
---

# Phase 13 Plan 02: SentryUserSync Dynamic Import Summary

**next/dynamic lazy-load of SentryUserSync in Provider.tsx defers Supabase 645KB chunk out of the main entry bundle via webpack code splitting — bundle split confirmed by user via npm run analyze**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-18T15:52:59Z
- **Completed:** 2026-03-19T08:45:31Z
- **Tasks:** 2 of 2 complete
- **Files modified:** 1

## Accomplishments
- Replaced static `import { SentryUserSync }` with `dynamic(() => import(...).then(m => ({ default: m.SentryUserSync })), { ssr: false })` in Provider.tsx
- TypeScript compiles cleanly — `npx tsc --noEmit` passes
- `npm run build` succeeds without errors
- Bundle analyzer confirmed: Supabase chunk moved out of main entry bundle (user-approved)
- Home page loads correctly with no regression

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert SentryUserSync to dynamic import in Provider.tsx** - `bff20b3` (feat)
2. **Task 2: Verify bundle split with npm run analyze** - human-verify checkpoint, approved by user

**Plan metadata:** (this docs commit)

## Files Created/Modified
- `src/app/provider.tsx` - Replaced static SentryUserSync import with next/dynamic lazy load (ssr: false)

## Decisions Made
- `ssr: false` is safe for SentryUserSync — it only calls `supabase.auth.getUser()` and sets Sentry user context; no visible HTML rendered server-side
- Dynamic import placed in Provider.tsx (Client Component), NOT layout.tsx (Server Component) — Next.js only produces genuine webpack code splits from Client Component dynamic imports
- Named export pattern used: `.then((m) => ({ default: m.SentryUserSync }))` — required because SentryUserSync uses named export, not default export

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Supabase 645KB chunk successfully split out of main entry bundle — ready for subsequent Phase 13 performance plans
- SentryUserSync still registers Sentry user context correctly (deferred, not removed)
- No known blockers

## Self-Check: PASSED

---
*Phase: 13-performance-fixes*
*Completed: 2026-03-19*
