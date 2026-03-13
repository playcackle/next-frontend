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

### Active (v1.2 — Code Health)

- [ ] Split `gameroom.module.css` (1,739 lines) into per-component CSS modules
- [ ] Rationalize `PostGameModal.module.css` vs `postgame.module.css` duplication
- [ ] Audit and tidy oversized module CSS files across admin and other routes
- [ ] Fix Rules of Hooks violation in `page.tsx` — crash risk (FINDING-A01)
- [ ] Fix answer reveal animation type mismatch — never fires (FINDING-T10)
- [ ] Gate all effects in `triggerCorrectAnswerEffects` on `performanceModeAtom` (FINDING-P06)
- [ ] Fix `onEvent` cleanup discard in `useGameEvents` — listener accumulation (FINDING-Q13/A09)
- [ ] Replace `useGameState()` with granular atom selectors across 4 components (FINDING-P01–P04)

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

## Current Milestone: v1.2 Code Health

**Goal:** Eliminate confirmed runtime bugs, split the monolithic gameroom CSS into per-component modules, and fix the highest-impact structural findings from the v1.1 audit.

**Target features:**
- CSS split: `gameroom.module.css` → per-component modules; rationalize postgame CSS duplication; tidy other large module files
- Bug fixes: Rules of Hooks crash risk (`page.tsx`), answer reveal animation never firing (`AnswerReveal.tsx`)
- Performance: Gate `triggerCorrectAnswerEffects` on `performanceModeAtom`; replace `useGameState()` with granular atom selectors
- Reliability: Fix `onEvent` cleanup discard to prevent listener accumulation

---
*Last updated: 2026-03-13 after v1.2 milestone started*
