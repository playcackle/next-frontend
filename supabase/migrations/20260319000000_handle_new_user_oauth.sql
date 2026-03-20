-- Migration: handle_new_user_oauth
-- Purpose: Harden the handle_new_user() trigger to support Google and Discord OAuth sign-ins
--          without producing NULL constraint errors on the players.name column.
--
-- Background:
--   The original trigger read only `raw_user_meta_data ->> 'name'`, which is set during
--   email/password signup but absent or under different keys during OAuth sign-in.
--   Google OAuth supplies `name` and `picture`; Discord OAuth supplies `user_name` (Supabase
--   normalizes Discord's `username` → `user_name`) and `avatar_url`. Without a COALESCE
--   fallback chain, the first OAuth sign-in fails with a NULL constraint error.
--
-- Schema assumptions (verify against live Supabase schema before running):
--   public.players columns assumed:
--     id         uuid        (references auth.users.id)
--     name       text NOT NULL
--     email      text
--     avatar_url text        (nullable — COALESCE may return NULL if no avatar supplied)
--   If the schema differs (different column names or additional NOT NULL columns),
--   update this file before running it. Do NOT add columns or change schema here —
--   this migration only updates the function body.
--
-- Display name COALESCE order:
--   1. `name`       — Google OAuth and email/password signup
--   2. `full_name`  — generic fallback (some providers use this key)
--   3. `user_name`  — Discord OAuth (Supabase normalizes Discord username → user_name)
--   4. SPLIT_PART(email, '@', 1) — guaranteed non-NULL final fallback
--
-- Avatar URL COALESCE order:
--   1. `picture`    — Google OAuth
--   2. `avatar_url` — Discord OAuth (CDN URL constructed by Supabase from Discord avatar hash)
--
-- Safety: CREATE OR REPLACE FUNCTION is idempotent — safe to re-run.
--         This migration does NOT drop the trigger or the function.
--         The trigger (handle_new_user ON auth.users) already exists and is unchanged.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.players (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'user_name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'picture', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'avatar_url', '')
    )
  );
  RETURN NEW;
END;
$$;
