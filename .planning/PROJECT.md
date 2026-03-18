# Quiz Game Frontend

## What This Is

A real-time multiplayer quiz/trivia game platform built on Next.js 16 with Socket.IO. Players join game rooms, answer questions through a shared chat feed, and compete on live leaderboards. The platform serves returning players through a progression system and new players through onboarding. v1.0 shipped reliable state sync, readable chat feedback, user onboarding, and a rich player stats landing page.

## Core Value

Players must always know where they are in the game and what their actions mean — reliable state, readable feedback, and visible progress are what keep them coming back.

## Requirements

### Validated

- ✓ User authentication (signup, login, session persistence) — existing
- ✓ Lobby browser on home page — existing
- ✓ Game room joining via Lobby Manager backend — existing
- ✓ Real-time game state via Socket.IO (rounds, slots, scores) — existing
- ✓ Unified chat + answer feed (UnifiedMessages) — existing
- ✓ Bot Bob hint messages tracked and pinned — existing
- ✓ Leaderboard with animated rank changes — existing
- ✓ Performance mode toggle (reduced effects) — existing
- ✓ Round lifecycle events (new_round_started, round_over, game_over) — existing
- ✓ Client auto-recovers game state at round→intermission transition — v1.0
- ✓ Reconnecting indicator shown when game state is uncertain — v1.0
- ✓ Client recovers to correct game phase after WebSocket reconnection — v1.0
- ✓ Chat message type differentiation: correct answers, Bot Bob hints, duplicate attempts — v1.0
- ✓ New user onboarding walkthrough modal with screenshots, skippable, shown only once — v1.0
- ✓ Landing page player card with Progresjonsscore, high scores, playstyle dashboard, global leaderboard — v1.0
- ✓ Codebase audited across 4 dimensions (code quality, performance, architecture, type safety) — v1.1
- ✓ 41 findings documented in prioritized FINDINGS.md with impact/effort ratings and concrete remediation — v1.1
- ✓ 2 confirmed runtime bugs surfaced: Rules of Hooks violation (crash risk) and answer reveal animation never firing — v1.1

### Validated (continued)

- ✓ `gameroom.module.css` split into 8 per-component CSS modules; monolith trimmed 1,739→611 lines — v1.2
- ✓ `PostGameModal.module.css` and `postgame.module.css` rationalized with non-overlapping scopes — v1.2
- ✓ Admin/route CSS files reorganized with section headers; `page.module.css` trimmed 601→240 lines — v1.2
- ✓ Rules of Hooks violation fixed in `page.tsx` — hooks unconditional before guard — v1.2
- ✓ Answer reveal animation fixed — `QuizAnswer.id` type aligned to `string`, `styles.visible` now fires — v1.2
- ✓ All DOM effects in `triggerCorrectAnswerEffects` gated on `performanceModeAtom` — v1.2
- ✓ `onEvent` cleanup captures fixed in `useGameEvents` — 9 listeners properly unmounted — v1.2
- ✓ `useGameState()` replaced with granular atom selectors in `LeaderBoard`, `AnswerReveal`, `PostGameShowcase`, `page.tsx` — v1.2

### Active (v1.3 — Observability & Performance)

- [ ] Sentry SDK installed and configured with DSN
- [ ] Unhandled errors and promise rejections automatically captured in Sentry
- [ ] Global error boundary catches unexpected React render crashes at app level
- [ ] Gameroom error boundary silently attempts recovery; shows minimal fallback only if crash is unrecoverable
- [ ] Sentry events include user identity and current game room context
- [ ] React re-render hotspots profiled across gameroom components
- [ ] Next.js bundle analyzed for size, code splitting, and unused imports
- [ ] Core Web Vitals (LCP, CLS, INP) measured and baselined
- [ ] Socket event handling overhead profiled
- [ ] All performance findings documented with impact/effort ratings
- [ ] Top 3 highest-impact bottlenecks fixed

### Out of Scope

- Backend game logic changes — frontend-only project, game server is external
- Mobile native app — web-first
- New game modes — scope limited to UX and reliability improvements
- Leaderboard filtering by friends — v2 social features deferred

## Context

**Current state (v1.1):** ~13,000 LOC TypeScript. Next.js 16 App Router, React 19, TypeScript, Jotai atoms, Socket.IO client 4.8, Supabase auth, Radix UI, GSAP for animations. See `.planning/codebase/` for full analysis. See `.planning/phases/05-codebase-audit/FINDINGS.md` for the full audit report with 41 findings and a 45-entry remediation priority table.

**Real-time architecture:** Two separate WebSocket connections — `useGameSocket` for game events, `useChatSocket` for messaging. Game state stored in `gameStateAtom`; messages in `unifiedMessagesAtom`. Events flow through `useGameEvents` hook which updates atoms.

**State sync:** `round_over` and reconnect both emit `request_state_sync`; `lobby_state_sync` response delivers full game state. Client always lands in correct phase.

**Message types:** `UnifiedMessage.message_type` drives visual differentiation in `UnifiedMessages.tsx`. `getMessageTypeClass()` and `getMessageBadge()` handle all variants. CSS classes in `gameroom.module.css`.

**Progression:** Player stats (Progresjonsscore, category percentiles, high scores) are fetched from Supabase/backend at landing page load and displayed in the player card component.

## Constraints

- **Tech Stack**: Next.js 16 + React 19 + Jotai + Socket.IO — stay within existing stack
- **Backend**: Game server is external — frontend can only handle events and request state, not change game logic
- **Performance**: Animations must respect `performanceModeAtom` — no new animations that bypass the performance toggle

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use `lobby_state_sync` event for state recovery | Already exists in event system — extend rather than add new events | ✓ Good — clean, no new backend events needed |
| Visual differentiation via existing `message_type` field | `UnifiedMessage` already categorizes messages — add styling layer | ✓ Good — zero schema changes |
| Player card data fetched from Supabase/backend at page load | Progression data already partially tracked server-side | ✓ Good — implemented in v1.0 |
| Use initializeSocketRef for circular useCallback dependency | Ref indirection breaks scheduleReconnect ↔ initializeSocket circular dep | ✓ Good — minimal invasive change |
| Functional setSocketState for async state reads | Eliminates stale closure risk in reconnect callbacks | ✓ Good — pattern adopted throughout hooks |
| Correct answers = neon green (not gold) | Consistent with slot tiles which use `--neon-green` for answered state | ✓ Good — coherent "green = success" visual language |
| Own failed answer = neutral (not blue) | `.ownFailedAnswerMessage` resets `.ownMessage` blue !important | ✓ Good — avoids confusing blue styling for wrong answers |
| Audit-only v1.1 milestone before v1.2 improvements | Ship audit findings first so v1.2 planning is evidence-based, not assumption-based | ✓ Good — surfaced 2 confirmed bugs that would otherwise ship undetected |
| Dual performance systems must be consolidated (not patched) | `performance-atom.ts` and `performance-context.tsx` use different localStorage keys — patching one leaves the other wrong | ⚠️ Revisit — requires product decision on `prefers-reduced-motion` handling before migration |

## Current Milestone: v1.3 Observability & Performance

**Goal:** Add Sentry error monitoring with smart error boundaries, and systematically profile + fix the top performance bottlenecks.

**Target features:**
- Sentry SDK integration (install from scratch, DSN config, user/room context)
- Global + gameroom error boundaries (silent recovery where possible)
- Performance profiling across re-renders, bundle, Web Vitals, socket overhead
- Fix top 3 highest-impact findings

## Current State (v1.2 — shipped 2026-03-17)

**Shipped:** Code Health milestone complete. All 8 requirements satisfied across 4 phases (3 GSD + 1 manual fix). Codebase now has per-component CSS modules, no confirmed runtime bugs, performance-mode-gated DOM effects, and stable listener cleanup.

**Tech debt carried forward:**
- `useGameEvents.ts` still uses full `gameStateAtom` internally (intentional — orchestrating hook)
- ARCH-01: Dual performance mode systems need product decision before consolidation
- ARCH-02: `sound-effects.tsx` (1,448 lines) split deferred
- ARCH-03: `AdminApiClient` domain split deferred

---
*Last updated: 2026-03-17 after v1.3 milestone started*
