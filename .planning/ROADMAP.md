# Roadmap: Quiz Game Frontend

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-11)
- ✅ **v1.1 Audit** — Phase 5 (shipped 2026-03-12)
- ✅ **v1.2 Code Health** — Phases 6-9 (shipped 2026-03-17)
- ✅ **v1.3 Observability & Performance** — Phases 10-14 (shipped 2026-03-19)
- 🚧 **v1.4 Social Auth** — Phases 15-16 (in progress)

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

<details>
<summary>✅ v1.3 Observability & Performance (Phases 10-14) — SHIPPED 2026-03-19</summary>

- [x] Phase 10: Sentry Foundation (2/2 plans) — completed 2026-03-18
- [x] Phase 11: Error Boundaries (2/2 plans) — completed 2026-03-18
- [x] Phase 12: Performance Baselines (2/2 plans) — completed 2026-03-18
- [x] Phase 13: Performance Fixes (3/3 plans) — completed 2026-03-19
- [x] Phase 14: Observability Polish (1/1 plan) — completed 2026-03-19

Archive: `.planning/milestones/v1.3-ROADMAP.md`

</details>

### 🚧 v1.4 Social Auth (In Progress)

**Milestone Goal:** Players can sign in and register with Google and Discord OAuth alongside existing email/password auth, with profile data auto-filled from the provider on first sign-in.

- [ ] **Phase 15: Provider Infrastructure** - Register OAuth apps, configure Supabase, fix DB trigger so first OAuth sign-in cannot fail with a NULL constraint error
- [ ] **Phase 16: OAuth UI and Profile Sync** - Add OAuth buttons to login/register pages, detect first sign-in in the callback route, and sync display name and avatar from the provider

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
- [x] 10-01-PLAN.md — SDK wizard install, withSentryConfig hardening, lib/sentry.ts helpers, global-error.tsx
- [x] 10-02-PLAN.md — SentryUserSync (auth context), gameroom context, socket error capture

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
- [x] 11-01-PLAN.md — app/error.tsx segment boundary for non-gameroom pages (OBS-03)
- [x] 11-02-PLAN.md — GameroomErrorBoundary silent-retry class component + layout wiring (OBS-04)

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
**Plans**: 2 plans
Plans:
- [x] 12-01-PLAN.md — Install @next/bundle-analyzer + WebVitalsLogger (PERF-02, PERF-03)
- [x] 12-02-PLAN.md — WDYR + Profiler instrumentation, socket timing probes, PERF-BASELINE.md (PERF-01, PERF-04, PERF-05)

### Phase 13: Performance Fixes
**Goal**: The three highest-impact bottlenecks identified in Phase 12 are fixed, and each fix is verified to improve its corresponding Phase 12 baseline metric
**Depends on**: Phase 12
**Requirements**: PERF-06
**Success Criteria** (what must be TRUE):
  1. Three specific bottlenecks are identified from Phase 12 data (not assumptions) and named in the plan
  2. Each fix produces a measurable improvement compared to its Phase 12 baseline (re-render count down, bundle size down, or Web Vital improved)
  3. No existing game functionality regresses — leaderboard, chat feed, slot grid, and answer reveal all work correctly after fixes
**Plans**: 3 plans
Plans:
- [x] 13-01-PLAN.md — LCP fix: gate router.refresh() in useUser.ts to exclude INITIAL_SESSION (PERF-06)
- [x] 13-02-PLAN.md — Bundle fix: dynamic import SentryUserSync in Provider.tsx to move Supabase 645KB out of main chunk (PERF-06)
- [x] 13-03-PLAN.md — Gameroom fix: replace useUser() in UnifiedMessages with currentUserIdAtom (PERF-06)

### Phase 14: Observability Polish
**Goal**: Production observability gaps closed — Sentry captures real game phase context, Web Vitals are measurable in production, and SUMMARY documentation accurately reflects codebase state
**Depends on**: Phase 13
**Requirements**: OBS-05, PERF-03, PERF-06
**Gap Closure:** Closes tech debt from v1.3 milestone audit
**Success Criteria** (what must be TRUE):
  1. `setSentryGameContext` receives the current game phase so Sentry events show real phase context (not "unknown")
  2. `WebVitalsLogger` reports web vitals in production (not just dev), or a RUM endpoint is wired so LCP/CLS/INP improvements are verifiable post-deploy
  3. `12-02-SUMMARY.md` accurately reflects that wdyr files were removed (not created)
**Plans**: 1 plan
Plans:
- [x] 14-01-PLAN.md — Sentry phase context, WebVitals production guard removal, 12-02-SUMMARY doc fix (OBS-05, PERF-03, PERF-06)

### Phase 15: Provider Infrastructure
**Goal**: Google and Discord OAuth are fully configured end-to-end — provider apps registered, Supabase enabled, identity linking confirmed, and the database trigger updated so first OAuth sign-in cannot produce a NULL constraint error
**Depends on**: Phase 14 (v1.3 complete)
**Requirements**: SETUP-01, SETUP-02, SETUP-03, SETUP-04
**Success Criteria** (what must be TRUE):
  1. A developer can initiate a Google OAuth flow in a test environment and a valid player record is created in the database with no errors
  2. A developer can initiate a Discord OAuth flow in a test environment and a valid player record is created in the database with no errors
  3. An email/password user who signs in via OAuth with the same email address is merged to one account — no duplicate records appear in auth.users
  4. The database trigger creates a player record for any OAuth sign-up regardless of which metadata fields the provider supplies (name, full_name, or user_name fallback chain)
**Plans**: 3 plans
Plans:
- [ ] 15-01-PLAN.md — SQL migration: harden handle_new_user() trigger with COALESCE fallback for OAuth providers
- [ ] 15-02-PLAN.md — Register Google & Discord OAuth apps, enable in Supabase, confirm identity linking
- [ ] 15-03-PLAN.md — End-to-end OAuth flow verification and Discord metadata shape confirmation

### Phase 16: OAuth UI and Profile Sync
**Goal**: Players can sign in or register with Google or Discord from the login and register pages, with display name and avatar pre-populated from the provider on first sign-in, and existing email/password auth preserved
**Depends on**: Phase 15
**Requirements**: SETUP-05, OAUTH-01, OAUTH-02, OAUTH-03, PROF-01, PROF-02, PROF-03
**Success Criteria** (what must be TRUE):
  1. Google and Discord OAuth buttons appear on both /auth/login and /auth/register — clicking either redirects to the provider and returns the user to the app as authenticated
  2. A new player signing in via Google or Discord has their display name populated from the provider (Google name or Discord username) without entering it manually
  3. A new player signing in via Google or Discord has their avatar set from the provider profile picture, and the image renders correctly via Next.js Image component
  4. A returning player who has customized their display name or avatar does not have those values overwritten on subsequent OAuth sign-ins
  5. Email/password login and registration continue to work correctly alongside the new OAuth buttons
**Plans**: 3 plans
Plans:
- [ ] 15-01-PLAN.md — SQL migration: harden handle_new_user() trigger with COALESCE fallback for OAuth providers
- [ ] 15-02-PLAN.md — Register Google & Discord OAuth apps, enable in Supabase, confirm identity linking
- [ ] 15-03-PLAN.md — End-to-end OAuth flow verification and Discord metadata shape confirmation

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. State Sync | v1.0 | 2/2 | Complete | 2026-02-26 |
| 2. Chat UX | v1.0 | 2/2 | Complete | 2026-03-02 |
| 3. Onboarding | v1.0 | 1/1 | Complete | 2026-03-11 |
| 4. Landing Page | v1.0 | 1/1 | Complete | 2026-03-11 |
| 5. Codebase Audit | v1.1 | 2/2 | Complete | 2026-03-12 |
| 6. Gameroom CSS Split | v1.2 | 6/6 | Complete | 2026-03-13 |
| 7. Admin/Route CSS Tidy | v1.2 | 3/3 | Complete | 2026-03-17 |
| 8. Bug Fixes and Performance | v1.2 | 3/3 | Complete | 2026-03-17 |
| 9. CSS-01 Gap Closure | v1.2 | manual | Complete | 2026-03-17 |
| 10. Sentry Foundation | v1.3 | 2/2 | Complete | 2026-03-18 |
| 11. Error Boundaries | v1.3 | 2/2 | Complete | 2026-03-18 |
| 12. Performance Baselines | v1.3 | 2/2 | Complete | 2026-03-18 |
| 13. Performance Fixes | v1.3 | 3/3 | Complete | 2026-03-19 |
| 14. Observability Polish | v1.3 | 1/1 | Complete | 2026-03-19 |
| 15. Provider Infrastructure | v1.4 | 0/TBD | Not started | - |
| 16. OAuth UI and Profile Sync | v1.4 | 0/TBD | Not started | - |
