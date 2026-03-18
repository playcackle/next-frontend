# Roadmap: Quiz Game Frontend

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-11)
- ✅ **v1.1 Audit** — Phase 5 (shipped 2026-03-12)
- ✅ **v1.2 Code Health** — Phases 6-9 (shipped 2026-03-17)
- 🚧 **v1.3 Observability & Performance** — Phases 10-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-03-11</summary>

- [x] Phase 1: State Sync (2/2 plans) — completed 2026-02-26
- [x] Phase 2: Chat UX (2/2 plans) — completed 2026-03-02
- [x] Phase 3: Onboarding (1/1 plan) — completed 2026-03-11
- [x] Phase 4: Landing Page (1/1 plan) — completed 2026-03-11

Archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Audit (Phase 5) — SHIPPED 2026-03-12</summary>

- [x] Phase 5: Codebase Audit (2/2 plans) — completed 2026-03-12

Archive: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 Code Health (Phases 6-9) — SHIPPED 2026-03-17</summary>

- [x] Phase 6: Gameroom CSS Split (6/6 plans) — completed 2026-03-13
- [x] Phase 7: Admin/Route CSS Tidy (3/3 plans) — completed 2026-03-17
- [x] Phase 8: Bug Fixes and Performance (3/3 plans) — completed 2026-03-17
- [x] Phase 9: CSS-01 Gap Closure (manual fix) — completed 2026-03-17

Archive: `.planning/milestones/v1.2-ROADMAP.md`

</details>

### 🚧 v1.3 Observability & Performance (In Progress)

**Milestone Goal:** Add Sentry error monitoring with smart error boundaries, and systematically profile and fix the top performance bottlenecks.

#### Phase Checklist

- [x] **Phase 10: Sentry Foundation** - SDK installed, errors captured, user and room context attached, quota-safe config (completed 2026-03-18)
- [x] **Phase 11: Error Boundaries** - Global and gameroom boundaries layered; socket errors explicitly captured (completed 2026-03-18)
- [ ] **Phase 12: Performance Baselines** - Re-render hotspots, bundle, Web Vitals, and socket overhead measured and documented
- [ ] **Phase 13: Performance Fixes** - Top 3 highest-impact bottlenecks fixed and verified against baselines

## Phase Details

### Phase 10: Sentry Foundation
**Goal**: The Sentry error pipeline is live — errors reach Sentry, stack traces are readable, user and room context is attached, and the config is safe for production traffic
**Depends on**: Phase 9 (v1.2 complete)
**Requirements**: OBS-01, OBS-02, OBS-05
**Success Criteria** (what must be TRUE):
  1. An unhandled JavaScript error thrown in the browser appears in Sentry with a readable (symbolicated) stack trace pointing to source files, not minified output
  2. An unhandled promise rejection appears in Sentry automatically without any explicit call in application code
  3. A Sentry event includes the logged-in user's identity (from Supabase auth) and the current game room ID and phase
  4. A production build leaves zero `.map` files in `.next/` — source maps are uploaded to Sentry only
  5. Sentry events from a browser running an ad blocker still reach Sentry via the tunnel route
**Plans**: 2 plans
Plans:
- [ ] 10-01-PLAN.md — SDK wizard install, withSentryConfig hardening, lib/sentry.ts helpers, global-error.tsx
- [ ] 10-02-PLAN.md — SentryUserSync (auth context), gameroom context, socket error capture

### Phase 11: Error Boundaries
**Goal**: React render crashes are contained at two levels — global (whole app) and gameroom (mid-game crash attempts silent recovery before showing fallback)
**Depends on**: Phase 10
**Requirements**: OBS-03, OBS-04
**Success Criteria** (what must be TRUE):
  1. A simulated render crash in a non-gameroom page shows a minimal error fallback UI instead of a white screen
  2. A simulated render crash inside the gameroom component tree triggers a silent recovery attempt before any fallback is shown
  3. When a gameroom crash is unrecoverable, the fallback UI is minimal (does not expose stack traces or internal state to the user)
  4. Both boundary types report the caught error to Sentry with the room context available at the time of the crash
**Plans**: 2 plans
Plans:
- [ ] 11-01-PLAN.md — app/error.tsx segment boundary for non-gameroom pages (OBS-03)
- [ ] 11-02-PLAN.md — GameroomErrorBoundary silent-retry class component + layout wiring (OBS-04)

### Phase 12: Performance Baselines
**Goal**: Measured, documented baselines exist for bundle size, Core Web Vitals, React re-render counts on high-frequency components, and socket event handling overhead — ready to use as acceptance criteria for Phase 13
**Depends on**: Phase 11
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05
**Success Criteria** (what must be TRUE):
  1. A `@next/bundle-analyzer` report exists showing total bundle size, per-chunk breakdown, and any imports flagged as candidates for splitting or removal
  2. Core Web Vitals (LCP, CLS, INP) are measured and recorded as baseline numbers for the home page and gameroom
  3. Re-render counts for UnifiedMessages, LeaderBoard, and SlotGrid are profiled and hotspots identified with component names and trigger atoms
  4. Socket event handling overhead in `useGameEvents` is measured (time per event dispatch, atom update frequency during active play)
  5. All findings are written to a single document with impact and effort ratings, ordered by impact
**Plans**: TBD

### Phase 13: Performance Fixes
**Goal**: The three highest-impact bottlenecks identified in Phase 12 are fixed, and each fix is verified to improve its corresponding Phase 12 baseline metric
**Depends on**: Phase 12
**Requirements**: PERF-06
**Success Criteria** (what must be TRUE):
  1. Three specific bottlenecks are identified from Phase 12 data (not assumptions) and named in the plan
  2. Each fix produces a measurable improvement compared to its Phase 12 baseline (re-render count down, bundle size down, or Web Vital improved)
  3. No existing game functionality regresses — leaderboard, chat feed, slot grid, and answer reveal all work correctly after fixes
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. State Sync | v1.0 | 2/2 | Complete | 2026-02-26 |
| 2. Chat UX | v1.0 | 2/2 | Complete | 2026-03-02 |
| 3. Onboarding | v1.0 | 1/1 | Complete | 2026-03-11 |
| 4. Landing Page | v1.0 | 1/1 | Complete | 2026-03-11 |
| 5. Codebase Audit | v1.1 | 2/2 | Complete | 2026-03-12 |
| 6. Gameroom CSS Split | v1.2 | 6/6 | Complete | 2026-03-17 |
| 7. Admin/Route CSS Tidy | v1.2 | 3/3 | Complete | 2026-03-17 |
| 8. Bug Fixes and Performance | v1.2 | 3/3 | Complete | 2026-03-17 |
| 9. CSS-01 Gap Closure | v1.2 | manual | Complete | 2026-03-17 |
| 10. Sentry Foundation | 2/2 | Complete    | 2026-03-18 | - |
| 11. Error Boundaries | 2/2 | Complete   | 2026-03-18 | - |
| 12. Performance Baselines | v1.3 | 0/? | Not started | - |
| 13. Performance Fixes | v1.3 | 0/? | Not started | - |
