# Retrospective: Quiz Game Frontend

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-11
**Phases:** 4 | **Plans:** 6

### What Was Built

1. State sync reliability: client auto-recovers to correct game phase on round transitions and reconnects via `request_state_sync`/`lobby_state_sync` pattern
2. Chat visual differentiation: correct answers (neon green + CORRECT badge), Bot Bob hints (purple + BOT badge), duplicate attempts (amber + TAKEN badge)
3. New user onboarding: multi-step walkthrough modal with screenshots, skippable, shown only once using persistence
4. Landing page redesign: player card with Progresjonsscore, high scores (daily/weekly/monthly/yearly), playstyle percentile dashboard, global leaderboard

### What Worked

- **Ref-indirection pattern for circular useCallback** worked cleanly with zero rework — minimal invasive change that solved a tricky React patterns problem
- **Extending existing event system** (`lobby_state_sync`) rather than adding new backend events kept scope tight and the fix isolated to frontend
- **CSS Modules class-per-message-type** approach made the Chat UX phase fast (1 plan, 1 commit for all CSS, 1 plan for TypeScript wiring)
- **Outside-GSD completion** for Phases 3 & 4 worked pragmatically — summaries captured the full success criteria with all checkboxes

### What Was Inefficient

- REQUIREMENTS.md checkboxes weren't kept in sync for Phases 3 & 4 (implemented outside GSD) — traceability table showed "Pending" even after completion
- Plans in ROADMAP.md Phase 1 had unchecked checkboxes even after completion — minor but creates ambiguity
- No milestone audit before completing — could have missed integration gaps

### Patterns Established

- `setSocketState((prev) => ...)` functional update pattern for reading state in async Socket.IO callbacks
- `sendEventRef` ref-capture pattern for calling `sendEvent` from stale-closure-prone callbacks
- CSS Modules base + modifier classes (`.messageBadge` + `.messageBadgeBot`, etc.) for variant styling
- `:global(.performance-mode)` CSS guard at CSS layer for animation suppression (no React atom reads needed)

### Key Lessons

- **Check REQUIREMENTS.md checkboxes at each phase completion**, not just at milestone end — avoids the 3/16 mismatch at close
- **Run `/gsd:audit-milestone` before completing** — even if all phases are done, the audit catches integration gaps
- For phases implemented outside GSD, still update ROADMAP.md plan checkboxes and REQUIREMENTS.md at the time of completion

### Cost Observations

- Sessions: ~6 sessions across 14 days
- Phases 1 & 2: Fast execution via GSD (2 min/plan avg) — well-scoped plans
- Phases 3 & 4: Implemented manually outside GSD — no execution time tracked

---

## Milestone: v1.1 — Audit

**Shipped:** 2026-03-12
**Phases:** 1 | **Plans:** 2

### What Was Built

1. Code quality audit (AUDIT-01): 13 findings covering oversized files (`sound-effects.tsx` at 1,448 lines), 3 duplication patterns, 4 naming inconsistencies, 2 dead code items, 2 complexity hotspots
2. Performance audit (AUDIT-02): 15 findings covering 4 components subscribing to full `gameStateAtom` instead of derived selectors, performance mode bypass in effects, 3 bundle concerns, 4 slow render paths
3. Architecture audit (AUDIT-03): 9 findings including Rules of Hooks violation (crash risk), dual performance mode systems with incompatible localStorage keys, Bot Bob detection in 3 places
4. Type safety audit (AUDIT-04): 13 findings covering 2 `@ts-ignore`, 7 `as any`, 1 `as unknown as` (confirmed runtime bug), EventPayloadMap gaps
5. Consolidated `FINDINGS.md` — 41 findings, executive summary, confirmed bugs section, 45-entry priority table for v1.2

### What Worked

- **Audit-only milestone before improvements** — surfaced 2 confirmed bugs that were invisible at the codebase surface level: answer reveal animation that has never worked, and a crash-level React hook order violation
- **Two-plan wave structure** — Wave 1 (quality + performance) produced a draft that Wave 2 (architecture + type safety + consolidation) consumed directly. No rework, clean dependency
- **Findings format with stable IDs** (FINDING-Q##, FINDING-P##, FINDING-A##, FINDING-T##) — enables precise cross-references in v1.2 planning without ambiguity
- **Read-only audit discipline** — auditors modified zero source files; all output went to documentation only, keeping audit findings clean and uncontaminated by fixes

### What Was Inefficient

- ESLint could not run during the audit (binary not in PATH, config format mismatch with ESLint 9.x) — manual lint coverage filled the gap but automated output would have been cleaner
- No `/gsd:audit-milestone` before completing — acceptable for a single-phase audit milestone, but worth noting for future multi-phase milestones

### Patterns Established

- Audit findings indexed with stable IDs per dimension: `FINDING-Q##` (quality), `FINDING-P##` (performance), `FINDING-A##` (architecture), `FINDING-T##` (type safety)
- "Bugs" section in FINDINGS.md surfaces confirmed runtime failures separately from smell/risk — higher visibility for planners
- Cross-referencing bugs across sections (FINDING-T10 = FINDING-P13) rather than duplicating content — priority table de-duplicates correctly

### Key Lessons

- **A clean `tsc` output does not mean type safety** — it means suppressions are in place. Documenting this explicitly in audit tooling output sets the right expectation for future readers.
- **Audit before improve** — the audit revealed that the answer reveal animation has never worked since its introduction. This would not have been caught in a features-first v1.2 sprint.
- **Performance mode bypass should be gated at the constraint level** — the PROJECT.md constraint exists but wasn't enforced during v1.0 feature development. The audit surfaced it; enforcement goes in v1.2.

### Cost Observations

- Sessions: 1 session (single day, 2026-03-12)
- Both plans: ~25 min each via GSD executor agents
- Fully automated — zero manual implementation steps

---

## Milestone: v1.3 — Observability & Performance

**Shipped:** 2026-03-19
**Phases:** 5 (Phases 10-14) | **Plans:** 10
**Timeline:** 2026-03-18 → 2026-03-19 (2 days)

### What Was Built

1. **Sentry foundation** (Phase 10): SDK initialized across browser/Node.js/Edge, `src/lib/sentry.ts` abstraction layer, tunnel route /monitoring, quota-safe sampling (0.1), source map upload verification scripts
2. **Sentry context wiring** (Phase 10): `SentryUserSync` component keeps user identity in sync with Supabase auth; `setSentryGameContext` attaches game_ws_url + real game phase (answering/round_break/post_game) to all events
3. **Error boundaries** (Phase 11): `error.tsx` segment boundary for non-gameroom pages; `GameroomErrorBoundary` class component with two-state silent-retry machine (renders null on first crash, shows fallback only on second)
4. **Performance baselines** (Phase 12): `@next/bundle-analyzer` treemaps (webpack mode), `WebVitalsLogger` with `useReportWebVitals`, React Profiler wrappers on UnifiedMessages/SlotGrid/LeaderBoard, `PerfProbe` on all 9 `useGameEvents` handlers, `PERF-BASELINE.md` with real numbers
5. **LCP fix** (Phase 13): `INITIAL_SESSION` early return in `useUser.ts` — Supabase fires this on passive session restore; blocking `router.refresh()` eliminates the Server Component re-fetch that was recorded as LCP
6. **Bundle fix** (Phase 13): `SentryUserSync` converted to `next/dynamic(ssr:false)` in `Provider.tsx` — defers Supabase 645KB chunk out of the main entry bundle
7. **Hot-path fix** (Phase 13): `currentUserIdAtom` added to `gameAtoms.ts`; set once at page level in `page.tsx`, read in `UnifiedMessages` — eliminates `useUser()` Supabase subscription from the 1Hz gameroom re-render path
8. **Observability polish** (Phase 14): Real game phase passed to `setSentryGameContext`, WebVitalsLogger made unconditional (all environments), `12-02-SUMMARY.md` doc corrected for WDYR files

### What Worked

- **Tech debt was audited before shipping** — the milestone audit (`v1.3-MILESTONE-AUDIT.md`) found three gaps before archival; Phase 14 gap closure resolved all of them cleanly in ~2 minutes
- **Module-level deduplication guard pattern** (Sentry rate limiting in `useGameSocket`) solved a subtle hook remount problem that a `useRef` would have missed — identified and documented early
- **React Profiler as WDYR fallback** worked better than expected — Profiler data was sufficient to identify LCP (not render counts) as the primary fix target, making Phase 13 decisions evidence-based
- **Plans were right-sized** — 10 plans across 5 phases, most under 15 min each; no plan ran over 30 min; total wall time was 2 days
- **`INITIAL_SESSION` guard** was a single-line early return that fixed LCP 4324ms (poor) — high-impact, low-effort fix that only came from having baseline data first

### What Was Inefficient

- **WDYR incompatibility** wasted ~30 min in Phase 12 — 4 fix attempts before removing it from layout; the React 19 / Next.js 16 incompatibility was flagged as a risk in STATE.md before starting but not pre-validated before installation
- **WebVitalsLogger was dev-only** (Phase 12 decision, Phase 14 correction) — this required a separate gap-closure phase to fix a decision that should have been production-ready from the start; cost was low but the pattern of "gate for dev only, fix later" added an unnecessary task
- **Production LCP measurement gap** — the LCP fix was accepted as code-correct without direct production measurement because WebVitalsLogger was dev-only at fix time; this is a monitoring quality gap carried forward
- **`12-02-SUMMARY.md` was inaccurate** at merge time (WDYR files listed as `created` not `created_then_removed`) — SUMMARY files should be written after all deviations resolve, not during

### Patterns Established

- Sentry abstraction boundary: all application code imports from `src/lib/sentry.ts` — never `@sentry/nextjs` directly (exception: `global-error.tsx`)
- Quota-safe sampling: `tracesSampleRate: 0.1` across all runtimes in real-time apps — full sampling exhausts quota
- Silent-retry error boundary: class component required (not `error.tsx`) — two-state machine (hasError + recoveryAttempted), `componentDidCatch` for side effects, `getDerivedStateFromError` for state only
- Named export dynamic import: `dynamic(() => import('@/...').then((m) => ({ default: m.Named })), { ssr: false })` — for null-rendering client components that pull large dependencies
- Atom bridging for hot paths: when a hook introduces a heavy dependency (Supabase, external service) into a 1Hz render loop, bridge via a Jotai atom set at page level

### Key Lessons

1. **Pre-validate high-risk dependencies before installation** — WDYR incompatibility was a known risk in STATE.md but was installed without prior validation; a 1-minute check would have saved ~30 min of debugging
2. **Production observability should be on from day one** — dev-only gating of WebVitalsLogger created a gap that required a separate fix phase; if it's worth measuring, measure in production from the start
3. **Baseline data makes fix selection obvious** — without `PERF-BASELINE.md`, Phase 13 would have been guess-driven; LCP was clearly the priority once measured (4324ms vs <1ms component render times)
4. **SUMMARY files should reflect final state, not intent** — write them after all deviations and fixes are committed; the WDYR created→removed mismatch in `12-02-SUMMARY.md` required a doc fix phase

### Cost Observations

- Sessions: ~4 sessions across 2 days
- Fastest plan: Phase 14-01 (~2 min — 3 targeted fixes, 3 commits)
- Slowest phase: Phase 12 (~34 min total — WDYR incompatibility investigation dominated)
- All requirements satisfied: 11/11 — no scope changes mid-milestone

---

## Cross-Milestone Trends

| Metric | v1.0 | v1.1 | v1.3 |
|--------|------|------|------|
| Phases | 4 | 1 | 5 |
| Plans | 6 | 2 | 10 |
| Avg plan duration | ~2 min (GSD phases) | ~25 min | ~10 min |
| Timeline | 14 days | 1 day | 2 days |
| LOC | ~13,000 TS | ~13,000 TS (audit-only) | ~13,755 TS |
| Outside-GSD phases | 2 (Phases 3, 4) | 0 | 0 |
| Confirmed bugs found | 0 | 2 | 0 (1 LCP performance root cause) |
| Requirements satisfied | 6/6 | 4/4 | 11/11 |
