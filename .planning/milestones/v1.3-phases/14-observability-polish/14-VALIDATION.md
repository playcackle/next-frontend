---
phase: 14
slug: observability-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework detected in project |
| **Config file** | none |
| **Quick run command** | Code inspection via grep (see per-task map) |
| **Full suite command** | Manual verification — all three tasks verified by observation |
| **Estimated runtime** | ~10 seconds (grep commands) |

---

## Sampling Rate

- **After every task commit:** Run the grep command for that task
- **After every plan wave:** Review all three changed files
- **Before `/gsd:verify-work`:** All three observable truths must be confirmed
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | OBS-05 | inspection | `grep -n "setSentryGameContext" src/app/gameroom/page.tsx` — verify second arg present | ✅ | ⬜ pending |
| 14-02-01 | 02 | 1 | PERF-03 | inspection | `grep -n "NODE_ENV" src/app/_components/WebVitalsLogger.tsx` — verify guard is gone | ✅ | ⬜ pending |
| 14-03-01 | 03 | 1 | PERF-06 | inspection | Review `.planning/phases/12-performance-baselines/12-02-SUMMARY.md` — verify wdyr files listed as removed, not created | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test files need to be created. Verification is code inspection + manual browser testing.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sentry captures real game phase in events | OBS-05 | Requires live Sentry dashboard to confirm event context | Join a gameroom, check Sentry for `gameroom.phase` tag showing `answering` / `round_break` / `post_game` |
| WebVitals logged in production | PERF-03 | Requires production build and browser DevTools | Run `npm run build && npm run start`, open DevTools console, reload page, look for `[WebVitals]` LCP/CLS entries |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
