---
phase: 16-oauth-ui-and-profile-sync
plan: "02"
subsystem: profile
tags: [avatar, oauth, profile, next-image, typescript]
dependency_graph:
  requires: []
  provides: [PROF-01, PROF-02, PROF-03]
  affects: [src/app/profile/page.tsx, src/lib/api/players.ts]
tech_stack:
  added: []
  patterns: [Next.js Image with remote CDN patterns, conditional rendering with initials fallback]
key_files:
  created: []
  modified:
    - src/lib/api/players.ts
    - src/app/profile/page.tsx
decisions:
  - "avatar_url typed as string | null to handle email/password users and providers that supply no avatar"
  - "No unoptimized prop on Image — remotePatterns config (SETUP-05) handles CDN allowlist"
  - "className={styles.avatar} applied to Image component so border-radius 50% clips photo to circle matching initials style"
metrics:
  duration: "~5min"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_modified: 2
---

# Phase 16 Plan 02: Avatar Display on Profile Page Summary

**One-liner:** Added `avatar_url: string | null` to `PlayerProfileStats` type and rendered Discord/Google provider avatars as a circular `next/image` `<Image>` on `/profile` with an initials fallback.

## What Was Built

- `PlayerProfileStats` type in `src/lib/api/players.ts` extended with `avatar_url: string | null` after the `email` field
- `/profile` page now conditionally renders a `<Image>` (72x72, `className={styles.avatar}`) when `profile.avatar_url` is truthy
- Initials fallback (`(profile.name || "?")[0].toUpperCase()`) unchanged for email/password users and OAuth users whose provider supplies no avatar
- Build confirmed clean (`npm run build` — 18 static/dynamic pages generated, TypeScript OK)

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add avatar_url to PlayerProfileStats type | d15a753 | src/lib/api/players.ts |
| 2 | Render avatar image on profile page with initials fallback | d6f6c58 | src/app/profile/page.tsx |

## Success Criteria Coverage

- **PROF-01:** Display name rendering unchanged — `profile.name` displayed as before; DB trigger handles population
- **PROF-02:** Avatar renders as `<Image>` from `avatar_url` when present; initials fallback when null/undefined
- **PROF-03:** No frontend code detects or triggers profile sync — DB trigger fires on INSERT only (by design)
- **Build:** `npm run build` passes with no errors

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `src/lib/api/players.ts` contains `avatar_url: string | null` — verified
- [x] `src/app/profile/page.tsx` contains `import Image from "next/image"` — verified
- [x] `src/app/profile/page.tsx` contains `profile.avatar_url` conditional check — verified
- [x] `src/app/profile/page.tsx` contains `width={72}` and `height={72}` — verified
- [x] Initials fallback present — verified
- [x] All stat/analytics sections unchanged — verified
- [x] Commits d15a753 and d6f6c58 exist — verified
- [x] `npm run build` succeeded with no TypeScript errors
