# Quiz Game Frontend

## What This Is

A real-time multiplayer quiz/trivia game platform built on Next.js 16 with Socket.IO. Players join game rooms, answer questions through a shared chat feed, and compete on live leaderboards. The platform serves returning players through a progression system and new players through onboarding. v1.0 shipped reliable state sync, readable chat feedback, user onboarding, and a rich player stats landing page. v1.3 added Sentry error monitoring, layered error boundaries, measured performance baselines, and fixed the top three performance bottlenecks (LCP, bundle size, hot-path Supabase call).

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

### Validated (continued — v1.3)

- ✓ Sentry SDK installed and configured with DSN, source maps, quota-safe sampling (0.1), and tunnel route — OBS-01 v1.3
- ✓ Unhandled errors, promise rejections, and Socket.IO connection errors automatically captured in Sentry — OBS-02 v1.3
- ✓ Global error boundary catches unexpected React render crashes at app level — OBS-03 v1.3
- ✓ Gameroom error boundary silently attempts recovery; shows minimal fallback only if crash is unrecoverable — OBS-04 v1.3
- ✓ Sentry events include user identity (Supabase auth) and current game room context (roomId, game phase) — OBS-05 v1.3
- ✓ React re-render hotspots profiled across UnifiedMessages, LeaderBoard, SlotGrid — PERF-01 v1.3
- ✓ Next.js bundle analyzed for total size, code splitting opportunities, and unused imports — PERF-02 v1.3
- ✓ Core Web Vitals (LCP, CLS, INP) measured and baselined; WebVitalsLogger active in all environments — PERF-03 v1.3
- ✓ Socket event handling overhead profiled (lobby_tick ~0.2ms, all 9 onEvent handlers instrumented) — PERF-04 v1.3
- ✓ All performance findings documented with impact/effort ratings in PERF-BASELINE.md — PERF-05 v1.3
- ✓ Top 3 highest-impact bottlenecks fixed: LCP (INITIAL_SESSION guard), bundle (SentryUserSync lazy), UnifiedMessages hot path (currentUserIdAtom) — PERF-06 v1.3

### Out of Scope

- Backend game logic changes — frontend-only project, game server is external
- Mobile native app — web-first
- New game modes — scope limited to UX and reliability improvements
- Leaderboard filtering by friends — v2 social features deferred

## Context

**Current state (v1.3 — shipped 2026-03-19):** ~13,755 LOC TypeScript. Next.js 16 App Router, React 19, TypeScript, Jotai atoms, Socket.IO client 4.8, Supabase auth, Radix UI, GSAP for animations, `@sentry/nextjs` (tracesSampleRate: 0.1). Phases 10-14 complete — Sentry monitoring live, error boundaries layered, performance baselines documented, top 3 bottlenecks fixed. See `.planning/codebase/` for full analysis. See `.planning/phases/05-codebase-audit/FINDINGS.md` for the full audit report. See `.planning/milestones/v1.3-MILESTONE-AUDIT.md` for v1.3 requirements coverage and tech debt log.

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
| `withSentryConfig` must be outermost wrapper in `next.config.mjs` | Reversed order breaks source map upload silently — `withSentryConfig(withBundleAnalyzer(config))` is the required ordering | ✓ Good — locked in STATE.md |
| `game_ws_url` as Sentry room identifier | `LobbyJoinSuccess` type has no `id` field — `game_ws_url` uniquely identifies the room connection | ✓ Good — used in `setSentryGameContext` |
| Module-level deduplication guard in `useGameSocket` | Per-instance `useRef` resets on hook remount during reconnect cycles; module scope persists across reconnect storms | ✓ Good — prevents Sentry event flooding |
| Silent-retry boundary requires class component | Next.js `error.tsx` shows fallback immediately — class component two-state machine is the only way to attempt silent recovery first | ✓ Good — `GameroomErrorBoundary` implemented this way |
| `npm run analyze` uses `--webpack` flag | Next.js 16 defaults to Turbopack which is incompatible with `@next/bundle-analyzer` | ✓ Good — webpack flag generates treemap HTML reports |
| INITIAL_SESSION early return in `useUser.ts` | Supabase fires INITIAL_SESSION then SIGNED_IN on load; without guard, `router.refresh()` triggers a Server Component re-fetch that delays LCP to 4324ms | ✓ Good — LCP fix; initial state handled by `loadUser()` only |
| Dynamic import of `SentryUserSync` in `Provider.tsx` (Client Component) | Next.js only code-splits dynamic imports from Client Components, not Server Components | ✓ Good — Supabase 645KB chunk deferred out of main entry bundle |
| `currentUserIdAtom` set at page level, read in `UnifiedMessages` | Eliminates Supabase auth subscription from 1Hz gameroom hot-render path without losing own-message styling | ✓ Good — page.tsx re-renders are rare vs 1Hz lobby_tick |

## Current Milestone: v1.4 Social Auth

**Goal:** Let players sign in and register with Google and Discord OAuth alongside existing email/password auth, with profile data auto-filled from the provider on first sign-in.

**Target features:**
- Google OAuth sign-in and registration
- Discord OAuth sign-in and registration
- Auto-fill display name and avatar from provider on first sign-in
- Email/password auth preserved alongside OAuth options

### Active

- [ ] User can sign in or register with Google account
- [ ] User can sign in or register with Discord account
- [ ] OAuth buttons appear on both login and register pages
- [ ] Email/password auth remains available alongside OAuth
- [ ] Display name pre-populated from provider on first OAuth sign-in
- [ ] Avatar pre-populated from provider on first OAuth sign-in

---

## Completed Milestone: v1.3 Observability & Performance (shipped 2026-03-19)

**Delivered:** Sentry error monitoring live, layered error boundaries, measured performance baselines, and top-3 bottleneck fixes. All 11 requirements satisfied (OBS-01–05, PERF-01–06).

**Tech debt carried forward into v1.4+:**
- `useGameEvents.ts` still uses full `gameStateAtom` internally (intentional — orchestrating hook)
- ARCH-01: Dual performance mode systems need product decision before consolidation
- ARCH-02: `sound-effects.tsx` (1,448 lines) split deferred
- ARCH-03: `AdminApiClient` domain split deferred
- Production LCP improvement not directly measured — WebVitalsLogger now unconditional but no RUM endpoint
- Nyquist VALIDATION.md files for phases 10-13 remain in draft status

---
*Last updated: 2026-03-19 after v1.4 milestone start*
