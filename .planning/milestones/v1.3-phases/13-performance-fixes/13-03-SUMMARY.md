---
phase: 13-performance-fixes
plan: "03"
subsystem: gameroom
tags: [performance, jotai, supabase, atoms]
dependency_graph:
  requires: []
  provides: [currentUserIdAtom]
  affects: [UnifiedMessages, GameroomPage]
tech_stack:
  added: []
  patterns: [jotai-atom-for-auth-state]
key_files:
  created: []
  modified:
    - src/app/gameroom/store/gameAtoms.ts
    - src/app/gameroom/components/UnifiedMessages.tsx
    - src/app/gameroom/page.tsx
decisions:
  - "currentUserIdAtom set in page.tsx (not hot-render path) via useUser() + useEffect — acceptable because page.tsx re-renders are rare compared to 1Hz lobby_tick"
  - "atom<string | null>(null) — null means unauthenticated or not yet set; own-message styling simply won't apply, which is correct behavior"
metrics:
  duration: "~8min"
  completed: "2026-03-19"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 13 Plan 03: Remove Supabase from UnifiedMessages Hot Path Summary

Remove `useUser()` from `UnifiedMessages` by routing user ID through a Jotai atom (`currentUserIdAtom`) set once at page level, eliminating the Supabase auth subscription from the 1Hz gameroom re-render path.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add currentUserIdAtom to gameAtoms.ts | 7452772 | src/app/gameroom/store/gameAtoms.ts |
| 2 | Remove useUser() from UnifiedMessages and wire setter | b92e9bf | src/app/gameroom/components/UnifiedMessages.tsx, src/app/gameroom/page.tsx |
| 3 | Verify own-message styling works during gameplay | — | human-verify checkpoint: approved |

## What Was Built

- `currentUserIdAtom`: a writable `atom<string | null>(null)` added to `gameAtoms.ts` after `answerAtom` (line 64)
- `UnifiedMessages.tsx`: removed `import { useUser } from "@/hooks/useUser"`, replaced `const { user } = useUser()` with `const currentUserId = useAtomValue(currentUserIdAtom)`, replaced `user?.id` with `currentUserId` in the own-message comparison
- `page.tsx` (GameroomPage): added `useUser()` call + `useSetAtom(currentUserIdAtom)` + `useEffect` to sync `user?.id` to the atom — this runs at page level, not in the 1Hz hot-render component

## Verification

- `grep "useUser" src/app/gameroom/components/UnifiedMessages.tsx` returns no results — confirmed zero Supabase dependency in component
- `npx tsc --noEmit` passes after both changes
- `npm run build` completes without errors
- Own-message comparison semantics unchanged: `null === string` is `false`, matching prior `undefined === string` behavior

## Deviations from Plan

None — plan executed exactly as written. The "no other useUser() call in gameroom" branch was followed as specified: `useUser()` added to `page.tsx` at page level.

## Self-Check

- [x] `src/app/gameroom/store/gameAtoms.ts` — modified, exports `currentUserIdAtom`
- [x] `src/app/gameroom/components/UnifiedMessages.tsx` — modified, no useUser import
- [x] `src/app/gameroom/page.tsx` — modified, sets currentUserIdAtom via effect
- [x] Commit 7452772 exists (Task 1)
- [x] Commit b92e9bf exists (Task 2)
- [x] TypeScript clean
- [x] Build clean

## Self-Check: PASSED

## Task 3 Verification

**Task 3 (human-verify):** User confirmed own-message styling works during gameplay. No Supabase import in UnifiedMessages. Build clean. Approved 2026-03-19.
