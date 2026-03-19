# Requirements: Quiz Game Frontend

**Defined:** 2026-03-19
**Core Value:** Players must always know where they are in the game and what their actions mean — reliable state, readable feedback, and visible progress are what keep them coming back.

## v1.4 Requirements

Requirements for the Social Auth milestone. Each maps to roadmap phases.

### OAuth

- [ ] **OAUTH-01**: User can sign in or register with Google account from /auth/login and /auth/register
- [ ] **OAUTH-02**: User can sign in or register with Discord account from /auth/login and /auth/register
- [ ] **OAUTH-03**: Email/password login and registration remain available alongside OAuth options

### Profile

- [ ] **PROF-01**: On first OAuth sign-in, player's display name is pre-populated from provider (Google name / Discord username)
- [ ] **PROF-02**: On first OAuth sign-in, player's avatar is pre-populated from provider profile picture
- [ ] **PROF-03**: Profile sync fires only on first sign-in — returning users retain any customizations they have made

### Setup

- [ ] **SETUP-01**: Google OAuth app registered in Google Cloud Console with Supabase callback URLs
- [x] **SETUP-02**: Discord OAuth app registered in Discord Developer Portal with Supabase callback URLs
- [x] **SETUP-03**: Automatic identity linking enabled in Supabase so existing email users don't get duplicate accounts
- [x] **SETUP-04**: Database trigger updated to handle OAuth metadata field names without NULL constraint errors
- [ ] **SETUP-05**: `next.config.mjs` includes `remotePatterns` for Google and Discord avatar CDN hostnames

## Future Requirements

### Account Linking

- **LINK-01**: User can connect a Google account to an existing email/password account
- **LINK-02**: User can connect a Discord account to an existing email/password account

### Additional Providers

- **PROV-01**: User can sign in or register with Apple account

## Out of Scope

| Feature | Reason |
|---------|--------|
| Apple Sign In | Not requested for this milestone; requires Apple Developer account setup |
| Account linking (connect multiple providers) | Known `user_metadata` overwrite bug in current Supabase SDK — high risk, deferred |
| Auto-merge OAuth with existing email account | Security-sensitive; Supabase does not support safely without re-verification |
| Full /auth/setup onboarding page | DB trigger generates provisional name; dedicated setup page deferred to future |
| Declined consent error page | Basic redirect sufficient; dedicated error UI deferred |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 15 | Pending |
| SETUP-02 | Phase 15 | Complete |
| SETUP-03 | Phase 15 | Complete |
| SETUP-04 | Phase 15 | Complete |
| SETUP-05 | Phase 16 | Pending |
| OAUTH-01 | Phase 16 | Pending |
| OAUTH-02 | Phase 16 | Pending |
| OAUTH-03 | Phase 16 | Pending |
| PROF-01 | Phase 16 | Pending |
| PROF-02 | Phase 16 | Pending |
| PROF-03 | Phase 16 | Pending |

**Coverage:**
- v1.4 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 — traceability confirmed after roadmap creation*
