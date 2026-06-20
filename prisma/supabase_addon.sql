-- =============================================================================
-- Claim My Business — ADDON for existing Prisma schema
-- Run this in Supabase SQL Editor. Non-destructive: only ADDS new tables and
-- columns. Touches your existing "Vendor" table only to append 2 columns.
-- Re-runnable.
-- =============================================================================

create extension if not exists "pgcrypto";

-- =============================================================================
-- Extend existing Vendor table with claim-system columns
-- =============================================================================
alter table public."Vendor"
  add column if not exists ownership_status text
    not null default 'unclaimed'
    check (ownership_status in ('unclaimed','pending_claim','claimed'));

alter table public."Vendor"
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_vendor_owner on public."Vendor"(owner_user_id);
create index if not exists idx_vendor_ownership_status on public."Vendor"(ownership_status);

-- =============================================================================
-- profiles (mirrors auth.users with role)
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer','vendor','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.phone,
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- vendor_claims (vendor_id TEXT to match Vendor.id cuid)
-- =============================================================================
create table if not exists public.vendor_claims (
  id uuid primary key default gen_random_uuid(),
  vendor_id text not null references public."Vendor"(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  claim_method text not null check (claim_method in ('otp','invite_token')),
  claim_token text,
  verification_phone text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create unique index if not exists uniq_active_claim_per_user_vendor
  on public.vendor_claims(vendor_id, user_id)
  where status = 'pending';

create index if not exists idx_claims_status on public.vendor_claims(status);
create index if not exists idx_claims_vendor on public.vendor_claims(vendor_id);

-- =============================================================================
-- vendor_invite_tokens
-- =============================================================================
create table if not exists public.vendor_invite_tokens (
  id uuid primary key default gen_random_uuid(),
  vendor_id text not null references public."Vendor"(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used boolean not null default false,
  used_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_invite_tokens_vendor on public.vendor_invite_tokens(vendor_id);

-- =============================================================================
-- notifications, audit_logs
-- =============================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, read);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_actor on public.audit_logs(actor_id);

-- =============================================================================
-- Helpers
-- =============================================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RPC: submit_claim (vendor_id is TEXT)
-- =============================================================================
create or replace function public.submit_claim(
  p_vendor_id text,
  p_method text,
  p_phone text default null,
  p_token text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_claim_id uuid;
  v_token public.vendor_invite_tokens;
  v_vendor public."Vendor";
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_method not in ('otp','invite_token') then raise exception 'Invalid method'; end if;

  select * into v_vendor from public."Vendor" where id = p_vendor_id for update;
  if not found then raise exception 'Vendor not found'; end if;
  if v_vendor.ownership_status = 'claimed' then
    raise exception 'Vendor is already claimed';
  end if;

  if p_method = 'invite_token' then
    if p_token is null then raise exception 'Token required'; end if;
    select * into v_token from public.vendor_invite_tokens
      where token = p_token and vendor_id = p_vendor_id for update;
    if not found then raise exception 'Invalid token'; end if;
    if v_token.used then raise exception 'Token already used'; end if;
    if v_token.expires_at < now() then raise exception 'Token expired'; end if;
    update public.vendor_invite_tokens
      set used = true, used_by = v_user where id = v_token.id;
  end if;

  insert into public.vendor_claims(vendor_id, user_id, claim_method, claim_token, verification_phone)
    values (p_vendor_id, v_user, p_method, p_token, p_phone)
    returning id into v_claim_id;

  update public."Vendor" set ownership_status = 'pending_claim'
    where id = p_vendor_id and ownership_status = 'unclaimed';

  insert into public.audit_logs(actor_id, action, target_table, target_id, metadata)
    values (v_user, 'claim.submit', 'vendor_claims', v_claim_id::text,
            jsonb_build_object('vendor_id', p_vendor_id, 'method', p_method));

  return v_claim_id;
end; $$;

-- =============================================================================
-- RPC: approve_claim
-- =============================================================================
create or replace function public.approve_claim(p_claim_id uuid, p_notes text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_claim public.vendor_claims;
begin
  if not public.is_admin() then raise exception 'Only admins can approve claims'; end if;
  select * into v_claim from public.vendor_claims where id = p_claim_id for update;
  if not found then raise exception 'Claim not found'; end if;
  if v_claim.status <> 'pending' then raise exception 'Claim is not pending'; end if;

  update public.vendor_claims
    set status = 'approved', admin_notes = coalesce(p_notes, admin_notes),
        reviewed_at = now(), reviewed_by = auth.uid()
    where id = p_claim_id;

  update public."Vendor"
    set ownership_status = 'claimed',
        owner_user_id = v_claim.user_id,
        verified = true
    where id = v_claim.vendor_id;

  update public.profiles set role = 'vendor'
    where id = v_claim.user_id and role = 'customer';

  update public.vendor_claims
    set status = 'rejected',
        admin_notes = coalesce(admin_notes,'') || ' [auto-rejected: another claim approved]',
        reviewed_at = now(), reviewed_by = auth.uid()
    where vendor_id = v_claim.vendor_id and status = 'pending' and id <> p_claim_id;

  insert into public.notifications(user_id, title, message, link)
    values (v_claim.user_id, 'Claim approved',
            'Your business claim has been approved. Welcome aboard!', '/dashboard');

  insert into public.audit_logs(actor_id, action, target_table, target_id, metadata)
    values (auth.uid(), 'claim.approve', 'vendor_claims', p_claim_id::text,
            jsonb_build_object('vendor_id', v_claim.vendor_id, 'user_id', v_claim.user_id));
end; $$;

-- =============================================================================
-- RPC: reject_claim
-- =============================================================================
create or replace function public.reject_claim(p_claim_id uuid, p_notes text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_claim public.vendor_claims; v_other int;
begin
  if not public.is_admin() then raise exception 'Only admins can reject claims'; end if;
  select * into v_claim from public.vendor_claims where id = p_claim_id for update;
  if not found then raise exception 'Claim not found'; end if;
  if v_claim.status <> 'pending' then raise exception 'Claim is not pending'; end if;

  update public.vendor_claims
    set status = 'rejected', admin_notes = p_notes, reviewed_at = now(), reviewed_by = auth.uid()
    where id = p_claim_id;

  select count(*) into v_other from public.vendor_claims
    where vendor_id = v_claim.vendor_id and status = 'pending';

  if v_other = 0 then
    update public."Vendor" set ownership_status = 'unclaimed'
      where id = v_claim.vendor_id and ownership_status = 'pending_claim';
  end if;

  insert into public.notifications(user_id, title, message, link)
    values (v_claim.user_id, 'Claim rejected',
            coalesce(p_notes, 'Your business claim was not approved.'), '/claim-status');

  insert into public.audit_logs(actor_id, action, target_table, target_id, metadata)
    values (auth.uid(), 'claim.reject', 'vendor_claims', p_claim_id::text,
            jsonb_build_object('vendor_id', v_claim.vendor_id, 'notes', p_notes));
end; $$;

-- =============================================================================
-- RPC: generate_invite_token (admin only)
-- =============================================================================
create or replace function public.generate_invite_token(
  p_vendor_id text,
  p_ttl_hours int default 168
) returns table(id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_token text; v_id uuid; v_expires timestamptz;
begin
  if not public.is_admin() then raise exception 'Only admins can generate invite tokens'; end if;
  v_token := encode(gen_random_bytes(24), 'hex');
  v_expires := now() + (p_ttl_hours || ' hours')::interval;
  insert into public.vendor_invite_tokens(vendor_id, token, expires_at, created_by)
    values (p_vendor_id, v_token, v_expires, auth.uid())
    returning vendor_invite_tokens.id into v_id;
  insert into public.audit_logs(actor_id, action, target_table, target_id, metadata)
    values (auth.uid(), 'invite_token.generate', 'vendor_invite_tokens', v_id::text,
            jsonb_build_object('vendor_id', p_vendor_id, 'expires_at', v_expires));
  return query select v_id, v_token, v_expires;
end; $$;

-- =============================================================================
-- RPC: resolve_invite_token (returns TEXT vendor_id)
-- =============================================================================
create or replace function public.resolve_invite_token(p_token text)
returns text language plpgsql security definer set search_path = public as $$
declare v_vendor_id text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select vendor_id into v_vendor_id from public.vendor_invite_tokens
    where token = p_token and used = false and expires_at > now();
  if v_vendor_id is null then raise exception 'Invalid, expired, or used token'; end if;
  return v_vendor_id;
end; $$;

-- =============================================================================
-- RPC: update_vendor_profile (owner-only, bypasses RLS safely)
-- Avoids exposing direct Vendor UPDATE permissions to authenticated role.
-- =============================================================================
create or replace function public.update_vendor_profile(
  p_vendor_id text,
  p_patch jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select owner_user_id into v_owner from public."Vendor" where id = p_vendor_id;
  if v_owner is null or (v_owner <> auth.uid() and not public.is_admin()) then
    raise exception 'Not authorized to edit this vendor';
  end if;

  update public."Vendor" set
    name        = coalesce(p_patch->>'name', name),
    tagline     = coalesce(p_patch->>'tagline', tagline),
    description = coalesce(p_patch->>'description', description),
    city        = coalesce(p_patch->>'city', city),
    state       = coalesce(p_patch->>'state', state),
    country     = coalesce(p_patch->>'country', country),
    address     = coalesce(p_patch->>'address', address),
    "zipCode"   = coalesce(p_patch->>'zipCode', "zipCode"),
    website     = coalesce(p_patch->>'website', website),
    instagram   = coalesce(p_patch->>'instagram', instagram),
    whatsapp    = coalesce(p_patch->>'whatsapp', whatsapp),
    "heroImage"   = coalesce(p_patch->>'heroImage', "heroImage"),
    "avatarImage" = coalesce(p_patch->>'avatarImage', "avatarImage")
  where id = p_vendor_id;

  insert into public.audit_logs(actor_id, action, target_table, target_id, metadata)
    values (auth.uid(), 'vendor.update_profile', 'Vendor', p_vendor_id, p_patch);
end; $$;

-- =============================================================================
-- RLS for NEW tables only (existing Vendor/Product/Category untouched)
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.vendor_claims enable row level security;
alter table public.vendor_invite_tokens enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "claims_select_own_or_admin" on public.vendor_claims;
create policy "claims_select_own_or_admin" on public.vendor_claims for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "claims_insert_block" on public.vendor_claims;
create policy "claims_insert_block" on public.vendor_claims for insert with check (false);

drop policy if exists "claims_update_admin" on public.vendor_claims;
create policy "claims_update_admin" on public.vendor_claims for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "invite_tokens_admin_all" on public.vendor_invite_tokens;
create policy "invite_tokens_admin_all" on public.vendor_invite_tokens for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "audit_select_admin" on public.audit_logs;
create policy "audit_select_admin" on public.audit_logs for select using (public.is_admin());

-- =============================================================================
-- DONE.
-- After running this, sign in once, then promote yourself:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- =============================================================================
