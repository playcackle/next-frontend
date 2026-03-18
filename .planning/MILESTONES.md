# Milestones

## v1.2 Code Health (Shipped: 2026-03-17)

**Phases completed:** 3 phases, 12 plans, 0 tasks

**Key accomplishments:**
- (none recorded)

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

