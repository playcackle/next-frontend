---
phase: 13
slug: performance-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 13 — Validation Strategy

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
| 13-01-01 | 01 | 1 | PERF-06 | investigation | manual (DevTools LCP element check) | ❌ pre-task | ⬜ pending |
| 13-01-02 | 01 | 1 | PERF-06 | type-check + build | `npx tsc --noEmit && npm run build` | ❌ pre-task | ⬜ pending |
| 13-01-03 | 01 | 1 | PERF-06 | manual | see Manual-Only | ❌ pre-task | ⬜ pending |
| 13-02-01 | 02 | 1 | PERF-06 | type-check + build | `npx tsc --noEmit && npm run analyze` | ❌ pre-task | ⬜ pending |
| 13-02-02 | 02 | 1 | PERF-06 | manual | see Manual-Only | ❌ pre-task | ⬜ pending |
| 13-03-01 | 03 | 1 | PERF-06 | type-check | `npx tsc --noEmit` | ❌ pre-task | ⬜ pending |
| 13-03-02 | 03 | 1 | PERF-06 | type-check + build | `npx tsc --noEmit && npm run build` | ❌ pre-task | ⬜ pending |
| 13-03-03 | 03 | 1 | PERF-06 | manual | see Manual-Only | ❌ pre-task | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all automated checks (TypeScript + build).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| LCP improves below 4324ms baseline | PERF-06 | Requires live browser with WebVitals console | Run dev, navigate to `/`, compare `[WebVitals] LCP` to 4324ms baseline |
| Bundle size reduces after Supabase lazy-load | PERF-06 | Requires visual treemap inspection | Run `npm run analyze`, compare Supabase chunk placement to Phase 12 baseline |
| UnifiedMessages no longer imports useUser | PERF-06 | Code review | Confirm `useUser` removed from UnifiedMessages imports |
| No gameplay regression | PERF-06 | Live game session | Join active game, verify chat, leaderboard, slot grid, answer reveal all work |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
