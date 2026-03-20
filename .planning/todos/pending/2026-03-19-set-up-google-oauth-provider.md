---
created: 2026-03-19T12:46:12.664Z
title: Set up Google OAuth provider
area: auth
files:
  - supabase/migrations/20260319000000_handle_new_user_oauth.sql
  - src/app/privacy/page.tsx
  - src/app/terms/page.tsx
---

## Problem

Google OAuth (SETUP-01) was deferred from Phase 15. The rest of Phase 15 was completed (Discord OAuth, trigger migration, identity linking). Google was skipped to avoid blocking progress.

The trigger migration (`handle_new_user_oauth.sql`) already handles Google metadata — `name` and `picture` fields are in the COALESCE chain. The privacy policy (`/privacy`) and terms of service (`/terms`) pages are already built and live, satisfying Google's OAuth consent screen requirements.

## Solution

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Set Authorized JavaScript origins (app base URL)
4. Set Authorized redirect URI — copy exactly from Supabase Dashboard → Auth → Providers → Google
5. Copy Client ID + Client Secret
6. Supabase Dashboard → Authentication → Providers → Google → enable, paste credentials, save
7. Test: perform a Google OAuth sign-in in dev environment, verify player record created in `public.players`

**Privacy Policy URL for consent screen:** `<app-base-url>/privacy`
**Terms of Service URL for consent screen:** `<app-base-url>/terms`

Note: Do NOT select any API in the API Library — only OAuth credentials + consent screen needed.
