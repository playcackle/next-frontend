---
phase: 16-oauth-ui-and-profile-sync
plan: "01"
subsystem: auth-ui
tags: [oauth, google, discord, next-config, css, images]
dependency_graph:
  requires: []
  provides: [remotePatterns-avatar-cdns, disabled-google-button-login, disabled-google-button-register]
  affects: [next.config.mjs, src/app/login/page.tsx, src/app/register/page.tsx, src/app/login/auth.module.css]
tech_stack:
  added: []
  patterns: [disabled-oauth-button-placeholder, css-module-disabled-state]
key_files:
  created: []
  modified:
    - next.config.mjs
    - src/app/login/auth.module.css
    - src/app/login/page.tsx
    - src/app/register/page.tsx
decisions:
  - "Google button rendered as disabled placeholder with no onClick — Google OAuth (SETUP-01) not yet configured in Supabase"
  - "remotePatterns added for cdn.discordapp.com /avatars/** and lh3.googleusercontent.com /** to support avatar rendering"
  - ".socialButton:disabled overrides translateY and box-shadow from hover state to make disabled state visually clear"
metrics:
  duration: ~5min
  completed: "2026-03-30"
  tasks_completed: 2
  files_modified: 4
---

# Phase 16 Plan 01: OAuth UI — Avatar CDN Config and Google Button Placeholder Summary

**One-liner:** Added Next.js Image remotePatterns for Discord/Google avatar CDNs and disabled Google OAuth button placeholder on both auth pages, preserving Discord and email/password flows unchanged.

## What Was Built

- `next.config.mjs` — Added `images.remotePatterns` for `cdn.discordapp.com/avatars/**` and `lh3.googleusercontent.com/**`; Sentry wrapping and bundle analyzer ordering unchanged
- `auth.module.css` — Added `.googleButton` (blue #4285f4, retro font, uppercase), `.socialButton:disabled` (opacity 0.45, cursor not-allowed, no transform), and `.socialButton:disabled:hover` (override hover animation)
- `src/app/login/page.tsx` — Disabled Google button inserted after Discord button inside `.socialButtons` div; no onClick, title "Google sign-in coming soon"
- `src/app/register/page.tsx` — Same disabled Google button with "Sign up with Google" label

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add remotePatterns to next.config.mjs and Google button CSS | 95aa405 |
| 2 | Add disabled Google button to login and register pages | e07aa7a |

## Verification

- Build: `npm run build` — passed, all routes compiled without errors
- `grep "cdn.discordapp.com" next.config.mjs` — match
- `grep "lh3.googleusercontent.com" next.config.mjs` — match
- `grep "Sign in with Google" src/app/login/page.tsx` — match
- `grep "Sign up with Google" src/app/register/page.tsx` — match
- `grep "signInWithOAuth" src/app/login/page.tsx` — match (Discord unchanged)
- `grep "signInWithPassword" src/app/login/page.tsx` — match (email login unchanged)

## Requirements Satisfied

- SETUP-05: next.config.mjs has remotePatterns for avatar CDNs
- OAUTH-01: Google button visible but disabled on both auth pages
- OAUTH-02: Discord button unchanged and functional on both auth pages
- OAUTH-03: Email/password form unchanged on both pages

## Deviations from Plan

None — plan executed exactly as written.
