---
phase: 10
slug: sentry-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Phase 10 validation is build-check + manual Sentry dashboard verification |
| **Config file** | `package.json` scripts (Wave 0 adds `check:sourcemaps`) |
| **Quick run command** | `npm run check:sourcemaps` (after production build) |
| **Full suite command** | `npm run build:check` (build + source map check) |
| **Estimated runtime** | ~60-120 seconds (includes `next build`) |

---

## Sampling Rate

- **After every task commit:** Verify changed files compile (`next build` if config changed)
- **After every plan wave:** Run `npm run build:check` (full build + source map gate)
- **Before `/gsd:verify-work`:** All manual Sentry dashboard checks completed
- **Max feedback latency:** ~120 seconds (build time)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-W0-sourcemaps-script | Wave 0 | 0 | OBS-01 | build check | `npm run check:sourcemaps` | ❌ W0 | ⬜ pending |
| 10-sdk-install | TBD | 1 | OBS-01 | manual | Wizard output review | N/A | ⬜ pending |
| 10-sentry-config | TBD | 1 | OBS-01 | build check | `npm run build:check` | ❌ W0 | ⬜ pending |
| 10-tunnel-route | TBD | 1 | OBS-01 | manual | POST /monitoring returns 200 | N/A | ⬜ pending |
| 10-sentry-helpers | TBD | 1 | OBS-05 | manual | Code review `lib/sentry.ts` | N/A | ⬜ pending |
| 10-user-sync | TBD | 2 | OBS-05 | manual | Sign in → trigger error → check Sentry user field | N/A | ⬜ pending |
| 10-gameroom-context | TBD | 2 | OBS-05 | manual | Enter gameroom → trigger error → check Sentry context.roomId | N/A | ⬜ pending |
| 10-socket-capture | TBD | 2 | OBS-02 | manual | Disconnect network → check Sentry (once per episode) | N/A | ⬜ pending |
| 10-global-error | TBD | 2 | OBS-02 | manual | Throw test error → verify Sentry dashboard readable stack trace | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add `"check:sourcemaps": "find .next -name '*.map' | wc -l"` to `package.json` scripts — covers OBS-01 source map gate
- [ ] Add `"build:check": "next build && npm run check:sourcemaps"` to `package.json` scripts — CI-friendly full check

*No test framework install needed — this phase has no unit tests. All validation is build-check + manual Sentry dashboard.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Unhandled error appears in Sentry with readable (symbolicated) stack trace | OBS-02 | Requires live Sentry project and browser session | 1. Temporarily add `throw new Error("test error")` in a Client Component. 2. Load the page. 3. Check Sentry dashboard → event should show readable source file paths, not minified. |
| Unhandled promise rejection captured automatically | OBS-02 | Requires live Sentry dashboard | 1. Add `Promise.reject(new Error("test rejection"))` in a useEffect. 2. Load page. 3. Verify Sentry captures it without explicit captureException call. |
| Socket connect_error captured once per episode | OBS-02 | Requires Socket.IO disconnect simulation | 1. Enable airplane mode or block WS connections. 2. Reload gameroom. 3. Verify Sentry shows ≤1 `connect_error` event per disconnect episode (deduplication guard working). |
| Sentry event includes user identity | OBS-05 | Requires authenticated session + live Sentry | 1. Sign in. 2. Trigger test error. 3. Check Sentry event → User field should show user ID, not anonymous. |
| Sentry event includes roomId in gameroom context | OBS-05 | Requires joining a gameroom | 1. Join a game room. 2. Trigger test error. 3. Check Sentry event → Contexts → gameroom → roomId should match the room. |
| Tunnel route accepts events from ad-blocker browser | OBS-01 | Requires browser with uBlock Origin | 1. Install uBlock Origin. 2. Trigger a test error. 3. Verify Sentry receives the event (tunnelRoute proxying through /monitoring). |
| Zero `.map` files in `.next/` after production build | OBS-01 | Build-time check | Run `npm run build:check` — `check:sourcemaps` output must be `0`. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
