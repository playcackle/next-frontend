---
phase: 07-admin-route-css-tidy
plan: "01"
subsystem: css-modules
tags: [css, refactor, co-location, css-modules]
dependency_graph:
  requires: []
  provides:
    - src/components/home-leaderboard.module.css
    - src/components/home-user-stats.module.css
    - src/components/home-gamerooms.module.css
  affects:
    - src/app/page.module.css
    - src/app/leaderboard/leaderboard.module.css
tech_stack:
  added: []
  patterns:
    - CSS Modules co-location — each component imports from its own module file
key_files:
  created:
    - src/components/home-leaderboard.module.css
    - src/components/home-user-stats.module.css
    - src/components/home-gamerooms.module.css
  modified:
    - src/components/home-leaderboard.tsx
    - src/components/home-user-stats.tsx
    - src/components/home-gamerooms.tsx
    - src/app/page.module.css
    - src/app/leaderboard/page.tsx
    - src/app/leaderboard/leaderboard.module.css
decisions:
  - "Moved .footer rule to leaderboard.module.css (not used by home page.tsx); removed pageStyles import from leaderboard/page.tsx entirely"
  - "Added .container and .main to leaderboard.module.css (were previously undefined no-ops via pageStyles); both now render with intentional structure styles"
metrics:
  duration: "~3 minutes"
  completed_date: "2026-03-17"
  tasks_completed: 2
  files_created: 3
  files_modified: 6
---

# Phase 7 Plan 01: Home CSS Split Summary

**One-liner:** Split page.module.css (601 lines, 5 consumers) into 3 co-located component CSS modules, trimming shared file to 240 lines of page-level layout only.

## What Was Built

Extracted all component-specific CSS from `src/app/page.module.css` into three new co-located CSS module files in `src/components/`:

| New File | Classes Extracted | Lines |
|---|---|---|
| home-leaderboard.module.css | leaderboardCard, periodToggle, periodBtn, periodBtnActive, leaderList, leaderRow, leaderRowFirst, leaderRank, rank1/2/3, leaderName, leaderScore | 112 |
| home-user-stats.module.css | statsGrid, statCard, statCard_*/statValue_* variants, statLabel, statsLoadingRow, statsSkeletonCard, @keyframes skeleton, statsError, retryBtn + responsive rules | 122 |
| home-gamerooms.module.css | gameroomsSection, gameroomsGrid, gameroomsFooter, statusBadge, status_open/in_progress/full, browseAllBtn, gameroomsEmpty + responsive rules | 84 |

`src/app/page.module.css` reduced from 601 lines to 240 lines — retains only page-level layout classes (pageWrapper, heroSection, title, neon text, auth error banner, authSection, twoColLayout, rightCol, section/sectionHeader/sectionTitle, seeAllLink, responsive rules).

`src/app/leaderboard/page.tsx` — removed `pageStyles` import, replaced `pageStyles.container/.main/.footer` with `styles.*`; added .container, .main, and .footer to `leaderboard.module.css`.

## Tasks Completed

| Task | Name | Commit | Key Files |
|---|---|---|---|
| 1 | Create home-leaderboard.module.css and home-user-stats.module.css, update imports | aba718e | home-leaderboard.module.css, home-user-stats.module.css, home-leaderboard.tsx, home-user-stats.tsx |
| 2 | Create home-gamerooms.module.css, fix leaderboard/page.tsx, trim page.module.css | 212f2be | home-gamerooms.module.css, home-gamerooms.tsx, leaderboard/page.tsx, leaderboard.module.css, page.module.css |

## Decisions Made

1. **`.footer` moved to leaderboard.module.css** — The home `page.tsx` does not render a `<footer>` element and does not use `styles.footer`. The `.footer` class was exclusively consumed by `leaderboard/page.tsx`. Moved there rather than keeping it shared.

2. **`.container` and `.main` added to leaderboard.module.css** — These were `pageStyles.container` and `pageStyles.main` references in `leaderboard/page.tsx` but neither class exists in `page.module.css` (confirmed by reading the file — undefined references). Added intentional implementations to `leaderboard.module.css` so the page now renders with proper structural styles.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed undefined .container and .main references in leaderboard/page.tsx**
- **Found during:** Task 2
- **Issue:** `leaderboard/page.tsx` referenced `pageStyles.container` and `pageStyles.main`, but neither class existed in `page.module.css` (confirmed by inspection). The classes resolved to `undefined` at runtime, producing no styling.
- **Fix:** Added `.container` (min-height: 100vh, flex column layout) and `.main` (flex: 1, padded, max-width: 900px) to `leaderboard.module.css` with appropriate structural styles. Updated all three `pageStyles.*` references to `styles.*`.
- **Files modified:** src/app/leaderboard/leaderboard.module.css, src/app/leaderboard/page.tsx
- **Commit:** 212f2be

## Verification Results

- `grep -rn "page.module.css" src/components/home-*.tsx` — no matches (PASS)
- `wc -l src/app/page.module.css` — 240 lines (PASS, under 250 limit)
- `grep -n "pageStyles" src/app/leaderboard/page.tsx` — no matches (PASS)
- `ls src/components/home-*.module.css` — all 3 files exist (PASS)
- `npx tsc --noEmit` — exits 0, no type errors (PASS)

## Self-Check: PASSED

All created files exist and both commits are verified in git history.
