# Roadmap: Quiz Game Frontend

## Overview

Four phases that address the four active improvement areas in sequence: first make the game reliable (state sync), then make in-game feedback readable (chat UX), then guide new players in (onboarding), then surface player progress on the landing page. Each phase delivers one coherent capability that can be verified end-to-end.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: State Sync** - Client reliably recovers game state across round transitions and reconnections (completed 2026-02-26)
- [x] **Phase 2: Chat UX** - Message types in the unified feed are visually distinct at a glance (completed 2026-03-02)
- [x] **Phase 3: Onboarding** - New users are guided through game mechanics before their first round (completed 2026-03-11, outside GSD)
- [x] **Phase 4: Landing Page** - Authenticated players see their progression stats, high scores, and playstyle data on the home page (completed 2026-03-11, outside GSD)

## Phase Details

### Phase 1: State Sync
**Goal**: Players are never stuck looking at stale or missing game state after a round transition or reconnect
**Depends on**: Nothing (first phase)
**Requirements**: STATE-01, STATE-02, STATE-03
**Success Criteria** (what must be TRUE):
  1. Player in an active game sees the correct intermission UI automatically after a round ends — no manual page reload or rejoin
  2. When the client is mid-transition and state is uncertain, a visible reconnecting indicator is shown rather than a frozen or incorrect game screen
  3. Player who loses WebSocket connection and reconnects lands in the correct game phase (lobby, intermission, or active round) without manual intervention
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Fix scheduleReconnect stale closure + loading gate covers reconnecting state (STATE-02)
- [ ] 01-02-PLAN.md — Emit request_state_sync on reconnect + fix handleLobbySyncRef divergence + round_over sync request (STATE-01, STATE-03)

### Phase 2: Chat UX
**Goal**: Players can instantly tell what kind of message they are reading in the unified chat feed
**Depends on**: Phase 1
**Requirements**: CHAT-01, CHAT-02, CHAT-03
**Success Criteria** (what must be TRUE):
  1. A correct answer submission in the chat feed is visually distinct from a regular chat message (different color, badge, or treatment)
  2. Bot Bob hint messages are immediately recognizable in the feed without reading the sender name
  3. A duplicate or already-answered attempt looks different from a fresh answer attempt, so players understand why their input was rejected
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — CSS classes for all message type variants (botBobMessage, duplicateMessage, badge classes, performance-mode guards) (CHAT-01, CHAT-02, CHAT-03)
- [ ] 02-02-PLAN.md — Refactor getMessageTypeClass + add getMessageBadge + render badges in UnifiedMessages.tsx (CHAT-01, CHAT-02, CHAT-03)

### Phase 3: Onboarding
**Goal**: New users understand how to play before their first round, and are not shown the walkthrough again afterward
**Depends on**: Phase 2
**Requirements**: ONBRD-01, ONBRD-02, ONBRD-03, ONBRD-04, ONBRD-05
**Success Criteria** (what must be TRUE):
  1. A first-time user sees a multi-step walkthrough modal automatically on their first visit to the app
  2. Each walkthrough step includes a screenshot of the actual game UI being described
  3. The walkthrough explains how to submit an answer, how Bot Bob hints work, and how scoring works
  4. A user can exit the walkthrough at any step via a visible skip option
  5. A user who completed or skipped the walkthrough does not see it again on subsequent visits
**Plans**: TBD

### Phase 4: Landing Page
**Goal**: Authenticated players see a rich player card with progression stats, high scores, playstyle breakdown, and a global leaderboard on the home page
**Depends on**: Phase 3
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04, LAND-05
**Success Criteria** (what must be TRUE):
  1. Logged-in player sees their Progresjonsscore on a player card on the landing page
  2. Player card shows high scores for daily, weekly, monthly, and yearly timeframes
  3. Landing page shows a playstyle dashboard with the player's percentile ranking per quiz category
  4. Landing page includes a global leaderboard visible to all authenticated users
  5. The existing lobby browser remains accessible on the landing page alongside the new stats sections
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. State Sync | 2/2 | Complete   | 2026-02-26 |
| 2. Chat UX | 1/2 | Complete    | 2026-03-02 |
| 3. Onboarding | 1/1 | Complete    | 2026-03-11 |
| 4. Landing Page | 1/1 | Complete    | 2026-03-11 |
