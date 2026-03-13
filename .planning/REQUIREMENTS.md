# Requirements: Quiz Game Frontend

**Defined:** 2026-03-13
**Core Value:** Players must always know where they are in the game and what their actions mean — reliable state, readable feedback, and visible progress are what keep them coming back.

## v1.2 Requirements

Requirements for the Code Health milestone. Each maps to roadmap phases.

### CSS

- [x] **CSS-01**: Developer can navigate gameroom styles by component — `gameroom.module.css` is split into per-component modules for each component that currently imports it (PlayerAvatar, UnifiedInputForm, StatsRow, BotBobPinnedMessage, RoomHeader, SlotTile, SlotGrid, UnifiedMessages), with only layout/page-level styles remaining in `gameroom.module.css`
- [x] **CSS-02**: Post-game CSS is consolidated — `PostGameModal.module.css` and `postgame.module.css` are rationalized into a single coherent file (or clearly scoped separate files with no overlapping concerns)
- [ ] **CSS-03**: Oversized module CSS files in admin and other routes are split or reorganized — no single module file exceeds a reasonable size threshold

### Bugs

- [ ] **BUG-01**: Game room loads without React invariant violation — Rules of Hooks violation in `page.tsx` is fixed (hooks moved before conditional return)
- [ ] **BUG-02**: Answer reveal animation fires correctly — `AnswerReveal.tsx` type mismatch (`string` vs `number[]`) is resolved and `styles.visible` is applied when expected

### Performance

- [ ] **PERF-01**: All visual effects in `triggerCorrectAnswerEffects` respect performance mode — DOM animations, screen shake, and overlays are gated on `performanceModeAtom`
- [ ] **PERF-02**: `LeaderBoard`, `AnswerReveal`, `PostGameShowcase`, and `page.tsx` subscribe to granular atom selectors instead of full `gameStateAtom` — eliminating unnecessary re-renders on every game tick

### Reliability

- [ ] **REL-01**: Socket event listeners do not accumulate — `useGameEvents.ts` `onEvent` cleanup callbacks are captured and called on unmount

## Future Requirements

### Architecture

- **ARCH-01**: Dual performance mode systems consolidated — `performance-atom.ts` and `performance-context.tsx` use different localStorage keys; requires product decision on `prefers-reduced-motion` handling before migration
- **ARCH-02**: `sound-effects.tsx` extracted — 1,448-line file split into pure audio engine module + thin React wrapper with dynamic import
- **ARCH-03**: `AdminApiClient` split into domain-specific clients (`LobbyAdminClient`, `ContentAdminClient`, `AIAdminClient`)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dual performance mode consolidation (FINDING-A06) | Requires product decision on prefers-reduced-motion handling — deferred to future milestone |
| sound-effects.tsx extraction (FINDING-Q01) | Large refactor with bundle implications — separate milestone |
| AdminApiClient split (FINDING-Q02) | Not on game-critical path — deferred |
| Backend game logic changes | Frontend-only project, game server is external |
| New game modes | Scope limited to code health improvements |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CSS-01 | Phase 6 | Complete |
| CSS-02 | Phase 6 | Complete |
| CSS-03 | Phase 7 | Pending |
| BUG-01 | Phase 8 | Pending |
| BUG-02 | Phase 8 | Pending |
| PERF-01 | Phase 8 | Pending |
| PERF-02 | Phase 8 | Pending |
| REL-01 | Phase 8 | Pending |

**Coverage:**
- v1.2 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap creation*
