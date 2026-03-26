---
phase: 16
slug: oauth-ui-and-profile-sync
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest / Next.js build |
| **Config file** | vitest.config.ts (if exists) or next.config.mjs |
| **Quick run command** | `npx next build` |
| **Full suite command** | `npx next build && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx next build`
- **After every plan wave:** Run `npx next build && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | OAUTH-01 | manual | Browser OAuth flow | N/A | ⬜ pending |
| TBD | TBD | TBD | OAUTH-02 | manual | Browser OAuth flow | N/A | ⬜ pending |
| TBD | TBD | TBD | OAUTH-03 | manual | Browser OAuth flow | N/A | ⬜ pending |
| TBD | TBD | TBD | PROF-01 | manual | Browser first-sign-in | N/A | ⬜ pending |
| TBD | TBD | TBD | PROF-02 | build | `npx next build` | N/A | ⬜ pending |
| TBD | TBD | TBD | PROF-03 | manual | Browser re-sign-in | N/A | ⬜ pending |
| TBD | TBD | TBD | SETUP-05 | build | `npx next build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OAuth redirect flow | OAUTH-01, OAUTH-02, OAUTH-03 | Requires real browser interaction with provider | Click OAuth button, complete provider flow, verify redirect back |
| Display name pre-populated | PROF-01 | Requires fresh OAuth account | Sign in with new OAuth account, check display name matches provider |
| Avatar rendered | PROF-02 | Requires visual verification | Check avatar renders from provider CDN URL |
| No overwrite on re-login | PROF-03 | Requires sequential sign-ins | Customize name/avatar, re-login via OAuth, verify unchanged |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
