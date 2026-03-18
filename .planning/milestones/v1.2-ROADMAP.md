# Roadmap: Quiz Game Frontend

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-11)
- ✅ **v1.1 Audit** — Phase 5 (shipped 2026-03-12)
- 🚧 **v1.2 Code Health** — Phases 6-8 (in progress)

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

### 🚧 v1.2 Code Health (In Progress)

**Milestone Goal:** Eliminate confirmed runtime bugs, split the monolithic gameroom CSS into per-component modules, and fix the highest-impact structural findings from the v1.1 audit.

- [x] **Phase 6: Gameroom CSS Split** - Split `gameroom.module.css` into per-component modules and rationalize postgame CSS duplication (completed 2026-03-13)
- [x] **Phase 7: Admin/Route CSS Tidy** - Audit and reorganize oversized module CSS files across admin and other routes (completed 2026-03-17)
- [x] **Phase 8: Bug Fixes and Performance** - Fix confirmed runtime bugs, gate effects on performance mode, fix listener accumulation, and replace full-state subscriptions with granular selectors (completed 2026-03-17)
- [x] **Phase 9: CSS-01 Gap Closure** - Fixed manually (completed 2026-03-17)

## Phase Details

### Phase 6: Gameroom CSS Split
**Goal**: Developers can navigate and modify gameroom styles without opening a 1,739-line monolith
**Depends on**: Phase 5
**Requirements**: CSS-01, CSS-02
**Success Criteria** (what must be TRUE):
  1. Each of the 8 components (PlayerAvatar, UnifiedInputForm, StatsRow, BotBobPinnedMessage, RoomHeader, SlotTile, SlotGrid, UnifiedMessages) has its own CSS module containing only its styles
  2. `gameroom.module.css` contains only layout and page-level styles — no component-scoped rules
  3. `PostGameModal.module.css` and `postgame.module.css` are rationalized — overlapping post-game concerns are resolved into clearly scoped files with no duplicated class responsibilities
  4. The game room renders identically to pre-split in the browser (no visual regressions)
**Plans**: 6 plans

Plans:
- [ ] 06-01-PLAN.md — Extract PlayerAvatar, RoomHeader, BotBobPinnedMessage CSS modules
- [ ] 06-02-PLAN.md — Extract StatsRow CSS module
- [ ] 06-03-PLAN.md — Extract SlotTile CSS module (tile, badge, animations)
- [ ] 06-04-PLAN.md — Extract SlotGrid and UnifiedInputForm CSS modules
- [ ] 06-05-PLAN.md — Extract UnifiedMessages CSS module
- [ ] 06-06-PLAN.md — Strip gameroom.module.css and rationalize post-game CSS (CSS-02)

### Phase 7: Admin/Route CSS Tidy
**Goal**: No single CSS module file in admin or other routes is oversized or difficult to navigate
**Depends on**: Phase 6
**Requirements**: CSS-03
**Success Criteria** (what must be TRUE):
  1. All oversized admin and route module CSS files (page.module.css 568L, admin pages 450-601L) are audited and split or reorganized
  2. No single module CSS file outside the gameroom exceeds a reasonable size threshold (e.g., no file larger than the largest per-component module from Phase 6)
  3. Admin pages render correctly after reorganization (no visual regressions)
**Plans**: 3 plans

Plans:
- [ ] 07-01-PLAN.md — Split src/app/page.module.css into per-consumer modules (home-leaderboard, home-user-stats, home-gamerooms)
- [ ] 07-02-PLAN.md — Add section navigation headers to 5 single-consumer oversized admin/route CSS files
- [ ] 07-03-PLAN.md — Build verification and visual regression checkpoint

### Phase 8: Bug Fixes and Performance
**Goal**: The game room runs without confirmed bugs, respects performance mode fully, and avoids unnecessary re-renders and listener accumulation
**Depends on**: Phase 7
**Requirements**: BUG-01, BUG-02, PERF-01, PERF-02, REL-01
**Success Criteria** (what must be TRUE):
  1. Game room page loads without a React invariant violation — Rules of Hooks violation in `page.tsx` is resolved (hooks are never called conditionally)
  2. Answer reveal animation fires correctly when a correct answer is submitted — `AnswerReveal.tsx` type mismatch is fixed and `styles.visible` is applied as expected
  3. All DOM animations, screen shake, and overlays in `triggerCorrectAnswerEffects` are gated on `performanceModeAtom` — performance mode off means no effects fire
  4. Socket event listeners do not accumulate across re-renders — `useGameEvents` cleanup correctly captures and calls all `onEvent` return values on unmount
  5. `LeaderBoard`, `AnswerReveal`, `PostGameShowcase`, and `page.tsx` subscribe to granular atom selectors instead of full `gameStateAtom` — no unnecessary re-renders on game ticks that don't affect their data
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md — Fix Rules of Hooks in page.tsx and replace useGameState() with useSetAtom(updateGameStateAtom)
- [ ] 08-02-PLAN.md — Fix AnswerReveal type mismatch and replace with slotsAtom subscription
- [ ] 08-03-PLAN.md — Gate DOM effects on performanceModeAtom, fix listener cleanup, replace LeaderBoard/PostGameShowcase subscriptions

### Phase 9: CSS-01 Gap Closure
**Goal**: SlotGrid renders with correct styles and no broken imports; no production-unsafe code artifacts
**Status**: Fixed manually — no GSD plans executed
**Completed**: 2026-03-17

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. State Sync | v1.0 | 2/2 | Complete | 2026-02-26 |
| 2. Chat UX | v1.0 | 2/2 | Complete | 2026-03-02 |
| 3. Onboarding | v1.0 | 1/1 | Complete | 2026-03-11 |
| 4. Landing Page | v1.0 | 1/1 | Complete | 2026-03-11 |
| 5. Codebase Audit | v1.1 | 2/2 | Complete | 2026-03-12 |
| 6. Gameroom CSS Split | 6/6 | Complete    | 2026-03-17 | - |
| 7. Admin/Route CSS Tidy | 3/3 | Complete    | 2026-03-17 | - |
| 8. Bug Fixes and Performance | 3/3 | Complete   | 2026-03-17 | - |
| 9. CSS-01 Gap Closure | v1.2 | manual | Complete | 2026-03-17 |
