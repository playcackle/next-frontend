# Milestones

## v1.3 Observability & Performance (Shipped: 2026-03-19)

**Phases completed:** 5 phases, 10 plans
**Timeline:** 2026-03-18 → 2026-03-19 (2 days)
**Codebase:** ~13,755 LOC TypeScript (+632 insertions, -127 deletions across 29 files)

**Key accomplishments:**
1. Sentry pipeline live across all three runtimes (browser, Node.js, Edge) with quota-safe sampling (0.1), tunnel route /monitoring for ad-blocker bypass, and `src/lib/sentry.ts` abstraction keeping SDK imports contained
2. User identity and game room context wired into Sentry via `SentryUserSync` (Supabase auth) and `setSentryGameContext` (game_ws_url + real phase: answering/round_break/post_game)
3. Global error boundary (`error.tsx`) catches non-gameroom render crashes; `GameroomErrorBoundary` class component adds silent-retry recovery before showing minimal fallback
4. Performance baselines documented in `PERF-BASELINE.md`: LCP 4324ms (poor), bundle Supabase chunk 645KB, lobby_tick handler ~0.2ms, UnifiedMessages ~0.18ms/render, SlotGrid ~0.78ms/render
5. LCP fixed: `INITIAL_SESSION` early return in `useUser.ts` prevents passive session restore from triggering `router.refresh()` and a hero repaint
6. Bundle split: `SentryUserSync` lazy-loaded via `next/dynamic(ssr:false)` in `Provider.tsx`, deferring Supabase 645KB out of the main entry chunk
7. Hot-path decoupled: `useUser()` removed from `UnifiedMessages`; user ID now flows through `currentUserIdAtom` set once at page level, eliminating Supabase auth subscription from the 1Hz gameroom re-render path
8. WebVitalsLogger (LCP/CLS/INP/FCP/TTFB) now logs unconditionally in all environments including production

**Archive:** `.planning/milestones/v1.3-ROADMAP.md`, `.planning/milestones/v1.3-REQUIREMENTS.md`, `.planning/milestones/v1.3-MILESTONE-AUDIT.md`

---

## v1.2 Code Health (Shipped: 2026-03-17)

**Phases completed:** 3 phases, 12 plans, 0 tasks

---

## v1.1 Audit (Shipped: 2026-03-12)

**Phases completed:** 1 phase, 2 plans, 4 tasks
**Timeline:** 2026-03-12 (single session)
**Codebase:** ~13,000 LOC TypeScript

**Key accomplishments:**
1. 28 verified findings across code quality (AUDIT-01) and performance (AUDIT-02) — each with confirmed file path, line number, impact, effort, and concrete remediation
2. 9 architecture findings (AUDIT-03) — Rules of Hooks crash risk, dual performance mode systems, Bot Bob detection triplication, onEvent cleanup discard
3. 13 type safety findings (AUDIT-04) — 2 `@ts-ignore`, 7 `as any`, 1 `as unknown as`, EventPayloadMap gaps
4. 2 confirmed runtime bugs surfaced: answer reveal animation has never fired (string vs number id type mismatch); Rules of Hooks violation in `page.tsx` is a crash risk on first render
5. Consolidated `FINDINGS.md` with 45-entry priority table ordered by impact/effort — direct input for v1.2 planning

**Archive:** `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`

---

## v1.0 MVP (Shipped: 2026-03-11)

**Phases completed:** 4 phases, 6 plans
**Timeline:** 2026-02-25 → 2026-03-11 (14 days)
**Codebase:** ~13,000 LOC TypeScript

**Key accomplishments:**
1. Fixed round→intermission state sync: client auto-recovers to correct game phase without manual rejoin
2. Fixed reconnect state recovery: `request_state_sync` emitted on reconnect so client lands in correct phase after network loss
3. Chat message visual differentiation: correct answers (neon green + CORRECT badge), Bot Bob hints (purple + BOT badge), duplicate attempts (amber + TAKEN badge)
4. New user onboarding: multi-step walkthrough modal with screenshots, skippable, persisted so it's never shown twice
5. Landing page redesign: player card with Progresjonsscore, high scores (daily/weekly/monthly/yearly), playstyle percentile dashboard, global leaderboard

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

---

