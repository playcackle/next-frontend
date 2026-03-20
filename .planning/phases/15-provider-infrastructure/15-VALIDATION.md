---
phase: 15
slug: provider-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — no automated test runner (all verification is manual/SQL) |
| **Config file** | none |
| **Quick run command** | n/a — manual verification only |
| **Full suite command** | n/a |
| **Estimated runtime** | n/a |

---

## Sampling Rate

- **After every task commit:** Verify via Supabase Dashboard or SQL Editor as described in Per-Task Verification Map
- **After every plan wave:** Run manual acceptance steps listed below
- **Before `/gsd:verify-work`:** All manual verifications must be confirmed
- **Max feedback latency:** n/a (manual)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | SETUP-04 | manual-SQL | Run trigger SQL in Supabase SQL Editor, verify function exists and no syntax errors | N/A | ⬜ pending |
| 15-01-02 | 01 | 1 | SETUP-01 | manual | GCP Console: OAuth app created, callback URL set, credentials downloaded | N/A | ⬜ pending |
| 15-01-03 | 01 | 1 | SETUP-02 | manual | Discord Developer Portal: app created, OAuth2 redirect URI set | N/A | ⬜ pending |
| 15-02-01 | 02 | 2 | SETUP-01 | manual | Supabase Dashboard → Auth → Providers: Google enabled, Client ID/Secret saved | N/A | ⬜ pending |
| 15-02-02 | 02 | 2 | SETUP-02 | manual | Supabase Dashboard → Auth → Providers: Discord enabled, Client ID/Secret saved | N/A | ⬜ pending |
| 15-02-03 | 02 | 2 | SETUP-03 | manual | Supabase Dashboard → Auth → Settings: Manual Linking disabled (automatic linking active) | N/A | ⬜ pending |
| 15-03-01 | 03 | 3 | SETUP-01 | manual | Developer performs Google OAuth flow; valid player record created in public.players | N/A | ⬜ pending |
| 15-03-02 | 03 | 3 | SETUP-02 | manual | Developer performs Discord OAuth flow; valid player record created in public.players | N/A | ⬜ pending |
| 15-03-03 | 03 | 3 | SETUP-03 | manual | Email/password user signs in via OAuth with same email → single auth.users record | N/A | ⬜ pending |
| 15-03-04 | 03 | 3 | SETUP-04 | manual | Inspect raw_user_meta_data in auth.users after Discord OAuth; confirm user_name field present | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation or stub files are needed — this phase is configuration + SQL migration only.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth app registered with correct callback URLs | SETUP-01 | Requires live Google Cloud Console access and real OAuth credentials | GCP Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID; set Authorized Redirect URI to Supabase callback URL |
| Discord OAuth app registered with correct redirect URI | SETUP-02 | Requires live Discord Developer Portal access | Discord Developer Portal → New Application → OAuth2 → add Supabase callback URL as redirect |
| Same-email OAuth merges to one auth.users record | SETUP-03 | Requires active OAuth flow against real providers | Sign up via email/password, verify email, then sign in via Google/Discord with same address; check auth.users for single row |
| Trigger handles all provider metadata without NULL errors | SETUP-04 | Requires Supabase SQL Editor access + live OAuth test | Apply trigger migration via SQL Editor; perform Google + Discord sign-in; check public.players for valid rows |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < n/a (manual-only phase)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
