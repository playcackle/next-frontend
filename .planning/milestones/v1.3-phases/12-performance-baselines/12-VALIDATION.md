---
phase: 12
slug: performance-baselines
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 12 — Validation Strategy

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
| 12-01-01 | 01 | 1 | PERF-01 | type-check + build | `npx tsc --noEmit && npm run build` | ❌ pre-task | ⬜ pending |
| 12-01-02 | 01 | 1 | PERF-01 | manual + artifact | `ANALYZE=true npm run build` | ❌ pre-task | ⬜ pending |
| 12-02-01 | 02 | 1 | PERF-02 | type-check | `npx tsc --noEmit` | ❌ pre-task | ⬜ pending |
| 12-02-02 | 02 | 1 | PERF-02 | manual | see Manual-Only | ❌ pre-task | ⬜ pending |
| 12-03-01 | 03 | 2 | PERF-03 | type-check | `npx tsc --noEmit` | ❌ pre-task | ⬜ pending |
| 12-03-02 | 03 | 2 | PERF-03 | manual | see Manual-Only | ❌ pre-task | ⬜ pending |
| 12-04-01 | 04 | 2 | PERF-04 | type-check | `npx tsc --noEmit` | ❌ pre-task | ⬜ pending |
| 12-04-02 | 04 | 2 | PERF-04 | manual | see Manual-Only | ❌ pre-task | ⬜ pending |
| 12-05-01 | 05 | 3 | PERF-05 | artifact exists | `ls .planning/phases/12-performance-baselines/BASELINES.md` | ❌ pre-task | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers automated checks (TypeScript + build).
- Manual profiling sessions required for PERF-02, PERF-03, PERF-04.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bundle analyzer report generated | PERF-01 | Requires browser to view HTML report | Run `ANALYZE=true npm run build`, open generated HTML in browser |
| Core Web Vitals measured | PERF-02 | Requires live browser session with real navigation | Run dev server, navigate pages, observe console output from WebVitalsReporter |
| Re-render counts profiled | PERF-03 | Requires React DevTools Profiler or WDYR console output | Enable WDYR in dev, navigate gameroom, observe console for re-render logs |
| Socket event overhead measured | PERF-04 | Requires active game session with performance.now() timestamps | Join active game, observe console timing logs from useGameEvents instrumentation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
