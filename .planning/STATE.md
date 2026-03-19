---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: Observability & Performance
status: planning
stopped_at: Completed 13-02-PLAN.md
last_updated: "2026-03-19T08:46:44.448Z"
last_activity: 2026-03-17 — Roadmap created, ready to begin Phase 10 planning
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 9
  completed_plans: 9
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-17)

**Core value:** Players must always know where they are in the game and what their actions mean — reliable state, readable feedback, and visible progress are what keep them coming back.
**Current focus:** Phase 10 — Sentry Foundation

## Current Position

Phase: 10 of 13 (Sentry Foundation)
Plan: — of —
Status: Ready to plan
Last activity: 2026-03-17 — Roadmap created, ready to begin Phase 10 planning

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (this milestone)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

## Accumulated Context
| Phase 10-sentry-foundation P01 | 25 | 3 tasks | 8 files |
| Phase 10-sentry-foundation P02 | 9min | 2 tasks | 5 files |
| Phase 10-sentry-foundation P02 | 10 | 3 tasks | 5 files |
| Phase 11-error-boundaries P01 | 2 | 1 tasks | 1 files |
| Phase 11-error-boundaries P02 | 15 | 3 tasks | 2 files |
| Phase 12-performance-baselines P01 | 4 | 2 tasks | 5 files |
| Phase 12-performance-baselines P02 | 30 | 3 tasks | 7 files |
| Phase 13-performance-fixes P02 | 5 | 1 tasks | 1 files |
| Phase 13-performance-fixes P03 | 8 | 2 tasks | 3 files |
| Phase 13-performance-fixes P01 | 15 | 3 tasks | 1 files |
| Phase 13-performance-fixes P03 | 8 | 3 tasks | 3 files |
| Phase 13-performance-fixes P02 | 10 | 2 tasks | 1 files |

### Decisions

See PROJECT.md Key Decisions table for all decisions from v1.0–v1.2.

**v1.3 context:**
- Sentry must be installed via wizard (`npx @sentry/wizard@latest`), not manually — wizard sets all three config files and `next.config.mjs` correctly
- `withSentryConfig` must be outermost wrapper in `next.config.mjs`: `withSentryConfig(withBundleAnalyzer(config), sentryOpts)` — reversed order breaks source map upload silently
- `tracesSampleRate` must NOT be 1.0 in production — real-time app will exhaust quota; target 0.1
- Tunnel route required from Phase 10 start — not retrofittable without a gap in observability
- Sentry v8 vs v9: accept what wizard installs, do not pin manually
- `why-did-you-render` React 19 compat is LOW confidence — verify before Phase 12; fall back to React DevTools Profiler if incompatible
- [Phase 10-sentry-foundation]: Wizard placed instrumentation files in src/ — edited at actual location, not relocated
- [Phase 10-sentry-foundation]: tracesSampleRate: 0.1 across all runtimes — real-time game would exhaust Sentry quota at 1.0
- [Phase 10-sentry-foundation]: sendDefaultPii removed — user identity set explicitly via setSentryUser() in Plan 02
- [Phase 10-sentry-foundation]: game_ws_url used as Sentry room identifier — LobbyJoinSuccess type has no id field; game_ws_url uniquely identifies the room
- [Phase 10-sentry-foundation]: Module-level lastConnectErrorCapture guard in useGameSocket — per-instance ref resets on hook remount; module scope persists across reconnect cycles
- [Phase 10-sentry-foundation]: game_ws_url used as Sentry room identifier — LobbyJoinSuccess type has no id field; game_ws_url uniquely identifies the room
- [Phase 10-sentry-foundation]: Module-level lastConnectErrorCapture guard in useGameSocket — per-instance ref resets on hook remount; module scope persists across reconnect cycles
- [Phase 11-error-boundaries]: error.tsx uses captureException from @/lib/sentry (not @sentry/nextjs directly) — only global-error.tsx imports Sentry SDK directly
- [Phase 11-error-boundaries]: No html/body wrapper in error.tsx — renders inside existing layout unlike global-error.tsx
- [Phase 11-error-boundaries]: Silent-retry boundary requires class component, not error.tsx — Next.js error.tsx always shows fallback immediately; class component two-state machine is the only way to attempt silent recovery first
- [Phase 11-error-boundaries]: recoveryAttempted gate mandatory in componentDidCatch — without it a persistent error causes infinite setState->crash loop
- [Phase 11-error-boundaries]: componentStack NOT passed as Sentry tag in GameroomErrorBoundary — multi-line value truncated by Sentry; boundary='gameroom' tag sufficient for triage
- [Phase 11-error-boundaries]: GameroomErrorBoundary OBS-04 verified: transient crash recovers silently, persistent crash shows minimal fallback, Sentry captures with boundary=gameroom tag
- [Phase 12-performance-baselines]: npm run analyze uses --webpack flag: Next.js 16 defaults to Turbopack which is incompatible with @next/bundle-analyzer
- [Phase 12-performance-baselines]: WebVitalsLogger only logs in NODE_ENV=development — gating ensures no production console noise before baselines are recorded
- [Phase 12-performance-baselines]: WDYR removed from layout.tsx after crashing on Next.js 16 router internals — wdyr.ts and WdyrInit.tsx remain as artifacts but are not mounted; React Profiler callbacks replaced WDYR for re-render profiling
- [Phase 12-performance-baselines]: LCP 4324ms (poor) is highest-priority fix target for Phase 13; lobby_tick handler overhead is low (~0.2ms); React component render times are fast (<1ms) — Phase 13 should focus on LCP/bundle size first
- [Phase 13-performance-fixes]: SentryUserSync dynamic import uses ssr: false — component only sets Sentry user context, no server-side HTML, safe to defer
- [Phase 13-performance-fixes]: Dynamic import in Provider.tsx (Client Component) not layout.tsx (Server Component) — Next.js only code-splits dynamic imports from Client Components
- [Phase 13-performance-fixes]: INITIAL_SESSION early return in onAuthStateChange prevents router.refresh() on passive session restore — initial state handled by loadUser() only
- [Phase 13-performance-fixes]: currentUserIdAtom set in page.tsx (not hot-render path) via useUser() + useEffect — acceptable because page.tsx re-renders are rare compared to 1Hz lobby_tick
- [Phase 13-performance-fixes]: LCP measurement via WebVitalsLogger not visible in production build (NODE_ENV=production suppresses it — Phase 12 decision); fix accepted as code-correct based on user approval
- [Phase 13-performance-fixes]: currentUserIdAtom set in page.tsx (not hot-render path) via useUser() + useEffect — acceptable because page.tsx re-renders are rare compared to 1Hz lobby_tick
- [Phase 13-performance-fixes]: SentryUserSync dynamic import uses ssr: false — component only sets Sentry user context, no server-side HTML output, safe to defer to client
- [Phase 13-performance-fixes]: Dynamic import placed in Provider.tsx (Client Component) not layout.tsx (Server Component) — Next.js only code-splits dynamic imports from Client Components

### Pending Todos

None.

### Blockers/Concerns

- [Phase 10] Sentry SDK config option names (`hideSourceMaps`, `deleteSourcemapsAfterUpload`) must be verified against current docs before writing `next.config.mjs` — training cutoff August 2025
- [Phase 12] `@welldone-software/why-did-you-render` React 19 compatibility unverified — check before installing

## Session Continuity

Last session: 2026-03-19T08:46:44.446Z
Stopped at: Completed 13-02-PLAN.md
Resume file: None
