-- Fix: vendor_invite_tokens FK constraint violation
-- Run this in Supabase SQL Editor
--
-- Problem: used_by and created_by reference profiles(id), but when a new
-- user claims via invite token, their profile may not exist yet (race
-- condition with the auth trigger). This causes:
--   "violates foreign key constraint vendor_invite_tokens_used_by_fkey"
--
-- Fix: Change the FK to reference auth.users(id) instead of profiles(id)

ALTER TABLE public.vendor_invite_tokens
  DROP CONSTRAINT IF EXISTS vendor_invite_tokens_used_by_fkey,
  DROP CONSTRAINT IF EXISTS vendor_invite_tokens_created_by_fkey;

ALTER TABLE public.vendor_invite_tokens
  ADD CONSTRAINT vendor_invite_tokens_used_by_fkey
    FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT vendor_invite_tokens_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Also fix vendor_claims FK (user_id references profiles)
-- Change to auth.users to prevent the same race condition
ALTER TABLE public.vendor_claims
  DROP CONSTRAINT IF EXISTS vendor_claims_user_id_fkey;

ALTER TABLE public.vendor_claims
  ADD CONSTRAINT vendor_claims_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify
SELECT 'FK fixed — try claiming again' as result;
