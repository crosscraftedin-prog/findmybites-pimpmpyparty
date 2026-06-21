-- Fix ALL foreign key constraints that reference profiles(id)
-- Run this in Supabase SQL Editor
--
-- Problem: Multiple tables reference profiles(id) for their FK constraints,
-- but when a new user signs in via Google OAuth, their profile may not
-- exist yet (race condition with the auth trigger). This causes:
--   "violates foreign key constraint ..._fkey"
--
-- Fix: Change ALL profile FKs to reference auth.users(id) instead.

-- 1. audit_logs.actor_id → auth.users(id)
ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;
ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. vendor_claims.reviewed_by → auth.users(id)
ALTER TABLE public.vendor_claims
  DROP CONSTRAINT IF EXISTS vendor_claims_reviewed_by_fkey;
ALTER TABLE public.vendor_claims
  ADD CONSTRAINT vendor_claims_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. vendor_invite_tokens.used_by → auth.users(id) (already fixed, but re-apply)
ALTER TABLE public.vendor_invite_tokens
  DROP CONSTRAINT IF EXISTS vendor_invite_tokens_used_by_fkey;
ALTER TABLE public.vendor_invite_tokens
  ADD CONSTRAINT vendor_invite_tokens_used_by_fkey
    FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. vendor_invite_tokens.created_by → auth.users(id) (already fixed, but re-apply)
ALTER TABLE public.vendor_invite_tokens
  DROP CONSTRAINT IF EXISTS vendor_invite_tokens_created_by_fkey;
ALTER TABLE public.vendor_invite_tokens
  ADD CONSTRAINT vendor_invite_tokens_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. vendor_claims.user_id → auth.users(id) (already fixed, but re-apply)
ALTER TABLE public.vendor_claims
  DROP CONSTRAINT IF EXISTS vendor_claims_user_id_fkey;
ALTER TABLE public.vendor_claims
  ADD CONSTRAINT vendor_claims_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. notifications.user_id → auth.users(id)
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify all constraints are updated
SELECT 'All FK constraints fixed — try claiming again' as result;
