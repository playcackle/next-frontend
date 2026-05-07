-- Migration: fix_handle_new_user_table_name
-- Purpose: Fix trigger table name (players → player), add created_at,
--          and add DEFAULT 0 to numeric stat columns so the trigger
--          never needs to supply them.

-- Add DEFAULT 0 to all NOT NULL integer stat columns
ALTER TABLE public.player
  ALTER COLUMN total_score SET DEFAULT 0,
  ALTER COLUMN games_played SET DEFAULT 0,
  ALTER COLUMN rounds_played SET DEFAULT 0,
  ALTER COLUMN total_slots_snapped SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.player (id, name, email, avatar_url, created_at)
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
    ),
    NOW()
  );
  RETURN NEW;
END;
$$;
