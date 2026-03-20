---
phase: 11
slug: error-boundaries
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — no automated test runner in project |
| **Config file** | none |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~30 seconds (tsc), ~60 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full build must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | OBS-03 | type-check + build | `npx tsc --noEmit && npm run build` | ✅ | ⬜ pending |
| 11-01-02 | 01 | 1 | OBS-03 | manual | see Manual-Only | ❌ pre-task | ⬜ pending |
| 11-02-01 | 02 | 2 | OBS-04 | type-check + build | `npx tsc --noEmit && npm run build` | ✅ | ⬜ pending |
| 11-02-02 | 02 | 2 | OBS-04 | manual | see Manual-Only | ❌ pre-task | ⬜ pending |
| 11-02-03 | 02 | 2 | OBS-04 | manual | see Manual-Only | ❌ pre-task | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (TypeScript + build only).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Non-gameroom render crash shows fallback UI | OBS-03 | No test runner; requires DOM render in browser | Add `throw new Error("test")` inside a page component, load it, verify fallback renders |
| Gameroom crash attempts silent recovery before fallback | OBS-04 | Requires live game session and timing observation | Add throw inside gameroom tree; confirm re-render attempt fires before fallback shown |
| Fallback UI hides stack traces | OBS-04 | Visual check | Trigger unrecoverable crash; inspect fallback for absence of stack/internal state |
| Both boundaries report to Sentry with room context | OBS-03, OBS-04 | Requires live Sentry dashboard | Trigger crash in each context; verify Sentry receives event with correct context tags |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
