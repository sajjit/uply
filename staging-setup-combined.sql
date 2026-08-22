-- ============================================================
-- Uply — combined schema + migrations, for replaying on a fresh
-- (staging) Supabase project in one paste. Generated 2026-08-11.
-- ============================================================

-- ============================================================
-- UPLY — Schéma de base de données (MVP)
-- ============================================================

-- 1. RESTAURANTS
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. PROFILS UTILISATEUR (lié à auth.users de Supabase)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'client' check (role in ('admin', 'client')),
  restaurant_id uuid references public.restaurants(id) on delete set null,
  created_at timestamptz default now()
);

-- 3. PRODUITS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  category text,
  unit text,
  supplier text,
  price numeric(10,2) default 0,
  photo text,
  active boolean default true,
  created_at timestamptz default now()
);

-- 4. COMMANDES
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  status text not null default 'En attente' check (status in ('En attente', 'En préparation', 'Livrée')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 5. LIGNES DE COMMANDE
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  name text not null,
  unit text,
  qty numeric(10,2) not null default 1,
  comment text
);

-- 6. DEMANDES DE NOUVEAUX PRODUITS
create table public.product_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  comment text,
  photo_url text,
  status text not null default 'En attente' check (status in ('En attente', 'Validée', 'Refusée')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.restaurants enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.product_requests enable row level security;

-- Helper function: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper function: current user's restaurant_id
create or replace function public.my_restaurant_id()
returns uuid
language sql
security definer
stable
as $$
  select restaurant_id from public.profiles where id = auth.uid();
$$;

-- ---------- PROFILES ----------
create policy "Users can view their own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "Admins can insert profiles" on public.profiles
  for insert with check (public.is_admin() or id = auth.uid());

create policy "Admins can update any profile" on public.profiles
  for update using (public.is_admin() or id = auth.uid());

-- ---------- RESTAURANTS ----------
create policy "Clients see their own restaurant, admins see all" on public.restaurants
  for select using (public.is_admin() or id = public.my_restaurant_id());

create policy "Admins manage restaurants" on public.restaurants
  for all using (public.is_admin());

-- ---------- PRODUCTS ----------
create policy "Clients see their own products, admins see all" on public.products
  for select using (public.is_admin() or restaurant_id = public.my_restaurant_id());

create policy "Admins manage products" on public.products
  for all using (public.is_admin());

-- ---------- ORDERS ----------
create policy "Clients see their own orders, admins see all" on public.orders
  for select using (public.is_admin() or restaurant_id = public.my_restaurant_id());

create policy "Clients can create orders for their restaurant" on public.orders
  for insert with check (restaurant_id = public.my_restaurant_id() or public.is_admin());

create policy "Admins can update orders" on public.orders
  for update using (public.is_admin());

-- ---------- ORDER ITEMS ----------
create policy "View order items via parent order access" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and (public.is_admin() or o.restaurant_id = public.my_restaurant_id())
    )
  );

create policy "Insert order items via parent order access" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and (public.is_admin() or o.restaurant_id = public.my_restaurant_id())
    )
  );

-- ---------- PRODUCT REQUESTS ----------
create policy "Clients see their own requests, admins see all" on public.product_requests
  for select using (public.is_admin() or restaurant_id = public.my_restaurant_id());

create policy "Clients can create requests for their restaurant" on public.product_requests
  for insert with check (restaurant_id = public.my_restaurant_id() or public.is_admin());

create policy "Admins can update requests" on public.product_requests
  for update using (public.is_admin());

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'client');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ==================== migration-v2.sql ====================
-- Add stock status to products (separate from active/inactive)
-- active = shown in admin catalog management at all
-- in_stock = whether clients can currently order it
alter table public.products
  add column if not exists in_stock boolean default true;

-- Add a general comment field to orders (for feature #6)
alter table public.orders
  add column if not exists comment text;

-- Add expected delivery window (for feature #8)
alter table public.orders
  add column if not exists delivery_date date,
  add column if not exists delivery_window text;

-- Add favorites table (for feature #3)
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (profile_id, product_id)
);

alter table public.favorites enable row level security;

create policy "Users manage their own favorites" on public.favorites
  for all using (profile_id = auth.uid());

-- Add notifications table (for feature #9)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users see their own notifications" on public.notifications
  for select using (profile_id = auth.uid());

create policy "Users can mark their own notifications read" on public.notifications
  for update using (profile_id = auth.uid());

create policy "Admins can create notifications" on public.notifications
  for insert with check (public.is_admin() or profile_id = auth.uid());

-- ==================== migration-v3.sql ====================
-- ============================================================
-- UPLY — Migration v3
-- Suppliers (multiple per product), price history, language pref
-- ============================================================

-- Multiple suppliers per product
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.product_suppliers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  unique (product_id, supplier_id)
);

alter table public.suppliers enable row level security;
alter table public.product_suppliers enable row level security;

create policy "Clients see their own suppliers, admins see all" on public.suppliers
  for select using (public.is_admin() or restaurant_id = public.my_restaurant_id());
create policy "Admins manage suppliers" on public.suppliers
  for all using (public.is_admin());

create policy "View product_suppliers via product access" on public.product_suppliers
  for select using (
    exists (select 1 from public.products p where p.id = product_suppliers.product_id
      and (public.is_admin() or p.restaurant_id = public.my_restaurant_id()))
  );
create policy "Admins manage product_suppliers" on public.product_suppliers
  for all using (public.is_admin());

-- Price history
create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  price numeric(10,2) not null,
  recorded_at timestamptz default now()
);

alter table public.price_history enable row level security;

create policy "View price history via product access" on public.price_history
  for select using (
    exists (select 1 from public.products p where p.id = price_history.product_id
      and (public.is_admin() or p.restaurant_id = public.my_restaurant_id()))
  );
create policy "Admins manage price history" on public.price_history
  for all using (public.is_admin());

-- Trigger: whenever a product's price changes, log the OLD price to history
create or replace function public.log_price_change()
returns trigger
language plpgsql
as $$
begin
  if old.price is distinct from new.price then
    insert into public.price_history (product_id, price, recorded_at)
    values (old.id, old.price, now());
  end if;
  return new;
end;
$$;

drop trigger if exists on_product_price_change on public.products;
create trigger on_product_price_change
  before update on public.products
  for each row execute function public.log_price_change();

-- Language preference on profile
alter table public.profiles
  add column if not exists language text default 'fr' check (language in ('fr', 'en'));

-- Invoice reference fields on orders (to match real supplier invoice format)
alter table public.orders
  add column if not exists invoice_number text,
  add column if not exists invoice_url text,
  add column if not exists purchase_order_sent boolean default false;

-- ==================== migration-v4.sql ====================
-- ============================================================
-- UPLY — Migration v4
-- Storage bucket for invoice/purchase-order PDFs
-- ============================================================

-- Unit price snapshot at time of order (needed to compute invoice totals
-- even if the product's catalog price changes later)
alter table public.order_items
  add column if not exists unit_price numeric(10,2) default 0;

-- Run the rest of this file in the Supabase SQL editor AFTER creating the
-- "invoices" bucket in Storage (see instructions in chat) — bucket creation
-- itself must be done from the dashboard UI, not SQL.

-- Allow admins to upload to the invoices bucket
create policy "Admins can upload invoices"
on storage.objects for insert
with check (
  bucket_id = 'invoices' and public.is_admin()
);

-- Allow admins to read all invoices
create policy "Admins can read all invoices"
on storage.objects for select
using (
  bucket_id = 'invoices' and public.is_admin()
);

-- Allow clients to read only their own restaurant's invoices
-- (relies on file path convention: invoices/{restaurant_id}/{order_id}.pdf)
create policy "Clients can read their restaurant's invoices"
on storage.objects for select
using (
  bucket_id = 'invoices'
  and (storage.foldername(name))[1] = public.my_restaurant_id()::text
);

-- ==================== migration-v5.sql ====================
-- ============================================================
-- UPLY — Migration v5
-- Fix: profiles SELECT policy was fragile (self-referencing is_admin()
-- check caused unreliable reads right after login for some accounts).
-- This replaces it with a simpler, more robust version.
-- ============================================================

drop policy if exists "Users can view their own profile" on public.profiles;

-- Every logged-in user can always read their own row — no function call,
-- no dependency on any other table, so this can never fail or recurse.
create policy "Users can view their own profile" on public.profiles
  for select using (id = auth.uid());

-- Admins can additionally view all profiles (separate policy; Postgres
-- combines multiple permissive policies with OR automatically).
create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());

-- ==================== migration-v6.sql ====================
-- ============================================================
-- UPLY — Migration v6
-- Secure admin user-creation function
-- Allows the app to create new client accounts without exposing
-- the service role key in the browser.
-- ============================================================

-- This function runs as SECURITY DEFINER (elevated privileges)
-- so it can insert into auth.users. It checks the caller is admin first.
create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_name text,
  p_restaurant_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_encrypted_pw text;
begin
  -- Security check: only admins can call this
  if not public.is_admin() then
    raise exception 'Permission refusée : réservé aux administrateurs';
  end if;

  -- Validate inputs
  if p_email is null or p_email = '' then
    raise exception 'Adresse e-mail requise';
  end if;

  if length(p_password) < 6 then
    raise exception 'Le mot de passe doit contenir au moins 6 caractères';
  end if;

  -- Check if email already exists
  if exists (select 1 from auth.users where email = lower(p_email)) then
    raise exception 'Un compte existe déjà avec cette adresse e-mail';
  end if;

  -- Generate user id
  v_user_id := gen_random_uuid();

  -- Encrypt password using Supabase's internal method
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  -- Insert into auth.users (Supabase internal auth table)
  insert into auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    aud,
    role
  ) values (
    v_user_id,
    lower(p_email),
    v_encrypted_pw,
    now(), -- auto-confirm
    jsonb_build_object('name', p_name),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- The trigger on_auth_user_created will create the profile row automatically.
  -- We just need to update it with the right restaurant and name.
  update public.profiles
  set
    name = p_name,
    restaurant_id = p_restaurant_id,
    role = 'client'
  where id = v_user_id;

  return json_build_object(
    'id', v_user_id,
    'email', lower(p_email),
    'success', true
  );

exception when others then
  return json_build_object(
    'success', false,
    'error', SQLERRM
  );
end;
$$;

-- Grant execute permission to authenticated users
-- (is_admin() check inside the function prevents non-admins from actually using it)
grant execute on function public.admin_create_user(text, text, text, uuid) to authenticated;

-- ==================== migration-v7.sql ====================
-- ============================================================
-- UPLY — Migration v7
-- Product brand field + real supplier management (phone, email,
-- lead time, delivery days)
-- ============================================================

-- Brand on products (feature: product fields requested by client)
alter table public.products
  add column if not exists brand text;

-- Real supplier contact/logistics info
alter table public.suppliers
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists lead_time_days integer,
  add column if not exists delivery_days text;

-- Admins need to update/delete suppliers directly (management screen), not just
-- create them from the product detail modal — the existing "for all" policy on
-- public.suppliers already covers this (created in migration-v3.sql), no change needed.

-- ==================== migration-v8.sql ====================
-- ============================================================
-- UPLY — Migration v8
-- Add "En livraison" (out for delivery) as its own order status,
-- distinct from "Livrée" (delivered) — client asked for notifications
-- covering: commande validée, en préparation, en livraison, livrée.
-- ============================================================

alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('En attente', 'En préparation', 'En livraison', 'Livrée'));

-- ==================== migration-v9.sql ====================
-- ============================================================
-- UPLY — Migration v9
-- Restaurant contact details (address, phone) so PDFs (invoices,
-- purchase orders, delivery notes) can show full restaurant info.
-- ============================================================

alter table public.restaurants
  add column if not exists address text,
  add column if not exists phone text;

-- ==================== migration-v10.sql ====================
-- ============================================================
-- UPLY — Migration v10
-- Forced password reset for admin-created accounts, plus support
-- for the self-service "forgot password" flow (which uses Supabase's
-- built-in resetPasswordForEmail — no schema change needed for that
-- part, it's handled entirely by Supabase Auth).
-- ============================================================

alter table public.profiles
  add column if not exists must_reset_password boolean default false;

-- Re-create admin_create_user so newly created client accounts are
-- flagged to change their temporary password on first login.
create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_name text,
  p_restaurant_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_encrypted_pw text;
begin
  if not public.is_admin() then
    raise exception 'Permission refusée : réservé aux administrateurs';
  end if;

  if p_email is null or p_email = '' then
    raise exception 'Adresse e-mail requise';
  end if;

  if length(p_password) < 6 then
    raise exception 'Le mot de passe doit contenir au moins 6 caractères';
  end if;

  if exists (select 1 from auth.users where email = lower(p_email)) then
    raise exception 'Un compte existe déjà avec cette adresse e-mail';
  end if;

  v_user_id := gen_random_uuid();
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  insert into auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, aud, role
  ) values (
    v_user_id, lower(p_email), v_encrypted_pw, now(),
    jsonb_build_object('name', p_name), now(), now(), 'authenticated', 'authenticated'
  );

  -- The trigger on_auth_user_created creates the profile row automatically.
  -- We update it with the right restaurant, name, and force a password
  -- change on first login since the admin picked this temporary password.
  update public.profiles
  set
    name = p_name,
    restaurant_id = p_restaurant_id,
    role = 'client',
    must_reset_password = true
  where id = v_user_id;

  return json_build_object(
    'id', v_user_id,
    'email', lower(p_email),
    'success', true
  );

exception when others then
  return json_build_object(
    'success', false,
    'error', SQLERRM
  );
end;
$$;

grant execute on function public.admin_create_user(text, text, text, uuid) to authenticated;

-- ==================== migration-v11.sql ====================
-- ============================================================
-- UPLY — Migration v11
-- Fix: admin_create_user failed with "function gen_salt(unknown)
-- does not exist". crypt()/gen_salt() come from the pgcrypto
-- extension, which Supabase installs into the "extensions" schema —
-- not "public". The function's `search_path = public` hid them.
-- ============================================================

create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_name text,
  p_restaurant_id uuid
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_encrypted_pw text;
begin
  if not public.is_admin() then
    raise exception 'Permission refusée : réservé aux administrateurs';
  end if;

  if p_email is null or p_email = '' then
    raise exception 'Adresse e-mail requise';
  end if;

  if length(p_password) < 6 then
    raise exception 'Le mot de passe doit contenir au moins 6 caractères';
  end if;

  if exists (select 1 from auth.users where email = lower(p_email)) then
    raise exception 'Un compte existe déjà avec cette adresse e-mail';
  end if;

  v_user_id := gen_random_uuid();
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  insert into auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, aud, role
  ) values (
    v_user_id, lower(p_email), v_encrypted_pw, now(),
    jsonb_build_object('name', p_name), now(), now(), 'authenticated', 'authenticated'
  );

  update public.profiles
  set
    name = p_name,
    restaurant_id = p_restaurant_id,
    role = 'client',
    must_reset_password = true
  where id = v_user_id;

  return json_build_object(
    'id', v_user_id,
    'email', lower(p_email),
    'success', true
  );

exception when others then
  return json_build_object(
    'success', false,
    'error', SQLERRM
  );
end;
$$;

grant execute on function public.admin_create_user(text, text, text, uuid) to authenticated;

-- ==================== migration-v12.sql ====================
-- ============================================================
-- UPLY — Migration v12
-- Fix: service_role gets "permission denied for table profiles"
-- (and presumably other tables) despite BYPASSRLS. RLS bypass does
-- NOT substitute for base table GRANTs — since this schema was built
-- via manual SQL Editor runs rather than Supabase's dashboard table
-- editor, service_role was never explicitly granted access.
-- Safe to re-run.
-- ============================================================

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- So any future tables/sequences/functions get the same treatment
-- automatically, without needing another migration like this one.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;

-- ==================== migration-v13.sql ====================
-- ============================================================
-- UPLY — Migration v13
-- Fix: notifications INSERT policy only allowed admins, or a user
-- inserting a row for themselves. This silently blocked two real
-- flows: a client's order notifying the admin (client isn't admin,
-- and the row's profile_id is the admin's, not the client's own),
-- and notifyRestaurant() broadcasting to *other* client accounts at
-- the same restaurant when more than one user shares a restaurant.
-- Any authenticated user creating a notification is low-risk (no
-- sensitive data, app-triggered only), so this just requires login.
-- ============================================================

drop policy if exists "Admins can create notifications" on public.notifications;

create policy "Authenticated users can create notifications" on public.notifications
  for insert with check (auth.uid() is not null);

-- ==================== migration-v14.sql ====================
-- ============================================================
-- UPLY — Migration v14
-- Fix: notifyAdmins() silently did nothing when called by a client.
-- It first SELECTs profiles where role = 'admin' to find who to
-- notify — but a client's RLS visibility into profiles only covers
-- their own row (or all rows, if *they're* an admin). So the SELECT
-- always came back empty for a client caller, and the function
-- returned early before ever inserting a notification. No error was
-- raised anywhere, which is why this went unnoticed.
--
-- Fix: a SECURITY DEFINER function (same pattern as is_admin() /
-- admin_create_user()) that looks up admins and inserts their
-- notifications with elevated privileges, bypassing this RLS gap
-- entirely — instead of broadening what clients can see in profiles.
-- ============================================================

create or replace function public.notify_admins(p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (profile_id, message)
  select id, p_message from public.profiles where role = 'admin';
end;
$$;

grant execute on function public.notify_admins(text) to authenticated;

-- ==================== migration-v15.sql ====================
-- ============================================================
-- UPLY — Migration v15
-- Add restaurant owner name (client request: track who owns each
-- restaurant account, not just its address/phone).
-- ============================================================

alter table public.restaurants
  add column if not exists owner_name text;

-- ==================== migration-v16.sql ====================
-- ============================================================
-- UPLY — Migration v16
-- 1. Fixed, admin-manageable category list (replaces free-text
--    category entry, which had produced duplicates/garbage values
--    like "4,11").
-- 2. Suppliers become a single global list instead of being owned
--    by one restaurant, linked to restaurants via a many-to-many
--    join table (a supplier can serve several restaurants).
-- ============================================================

-- 1. CATEGORIES ------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Anyone signed in can view categories" on public.categories
  for select using (auth.uid() is not null);

create policy "Admins manage categories" on public.categories
  for all using (public.is_admin());

insert into public.categories (name) values
  ('Fruits et légumes'),
  ('Viandes'),
  ('Poissons et fruits de mer'),
  ('Produits frais'),
  ('Produits surgelés'),
  ('Épicerie'),
  ('Boissons sans alcool'),
  ('Alcools'),
  ('Boulangerie et pâtisserie'),
  ('Charcuterie'),
  ('Sauces, sirops et purées'),
  ('Emballages'),
  ('Produits d''entretien'),
  ('Matériel et équipements'),
  ('Non classé')
on conflict (name) do nothing;

-- 2. GLOBAL SUPPLIERS -------------------------------------------
create table if not exists public.restaurant_suppliers (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  primary key (restaurant_id, supplier_id)
);

alter table public.restaurant_suppliers enable row level security;

create policy "Admins manage restaurant_suppliers" on public.restaurant_suppliers
  for all using (public.is_admin());

-- Preserve existing supplier -> restaurant links before suppliers become global.
insert into public.restaurant_suppliers (restaurant_id, supplier_id)
select restaurant_id, id from public.suppliers
where restaurant_id is not null
on conflict do nothing;

drop policy if exists "Clients see their own suppliers, admins see all" on public.suppliers;
drop policy if exists "Admins manage suppliers" on public.suppliers;

alter table public.suppliers drop column if exists restaurant_id;

create policy "Anyone signed in can view suppliers" on public.suppliers
  for select using (auth.uid() is not null);

create policy "Admins manage suppliers" on public.suppliers
  for all using (public.is_admin());

-- ==================== migration-v17.sql ====================
-- ============================================================
-- UPLY — Migration v17
-- Fix: "permission denied for table categories" (42501) — same root
-- cause as migration-v12, but for authenticated/anon this time.
-- Tables created via the SQL Editor don't inherit Supabase's default
-- grants; RLS policies are a separate layer from the base GRANT, and
-- RLS alone doesn't substitute for it. Safe to re-run.
-- ============================================================

grant usage on schema public to authenticated, anon;
grant all on all tables in schema public to authenticated, anon;
grant all on all sequences in schema public to authenticated, anon;
grant all on all functions in schema public to authenticated, anon;

-- So any future tables/sequences/functions get the same treatment
-- automatically, without needing another migration like this one.
alter default privileges in schema public grant all on tables to authenticated, anon;
alter default privileges in schema public grant all on sequences to authenticated, anon;
alter default privileges in schema public grant all on functions to authenticated, anon;

-- ==================== migration-v18.sql ====================
-- ============================================================
-- UPLY — Migration v18
-- One-time cleanup: normalize existing products.category free-text
-- values (typos, accents, trailing spaces, old naming) onto the
-- fixed category list from migration-v16. This is what was causing
-- duplicate-looking entries in the Commander category filter.
-- Safe to re-run.
-- ============================================================

update public.products set category = 'Fruits et légumes'
  where category in ('Fruit et légume', 'Fruit et légume ', 'Légume ', 'Legume');

update public.products set category = 'Viandes'
  where category = 'Viande';

update public.products set category = 'Poissons et fruits de mer'
  where category = 'Poisson';

update public.products set category = 'Produits frais'
  where category in ('Produit frais ', 'Produit frais', 'BOF');

update public.products set category = 'Produits surgelés'
  where category in ('Produit congelé ', 'Congelé');

update public.products set category = 'Épicerie'
  where category in ('Épicerie ', 'Epicerie', 'Épicerir', 'Epiceriey');

update public.products set category = 'Boissons sans alcool'
  where category in ('Boisson', 'Boisson ', ' Boisson');

update public.products set category = 'Alcools'
  where category in ('Vin', 'Boisson avec alcool ', 'Boisson  avec alcool ');

update public.products set category = 'Charcuterie'
  where category = 'Charcuterie ';

update public.products set category = 'Emballages'
  where category = 'Emballage';

update public.products set category = 'Produits d''entretien'
  where category in ('Entretien', 'Entretien ');

update public.products set category = 'Sauces, sirops et purées'
  where category = 'Sirop et purée ';

update public.products set category = 'Non classé'
  where category = '' or category is null;

-- ==================== migration-v19.sql ====================
-- ============================================================
-- UPLY — Migration v19
-- Allow admins to delete orders (needed for the new "delete from
-- archives" button). order_items also needs its own delete policy —
-- its FK to orders cascades at the DB level, but RLS still gates any
-- direct DELETE issued by the client (e.g. when clearing order_items
-- before deleting a restaurant/product), and it had none.
-- ============================================================

create policy "Admins can delete orders" on public.orders
  for delete using (public.is_admin());

create policy "Admins can delete order_items" on public.order_items
  for delete using (public.is_admin());

-- ==================== migration-v20.sql ====================
-- ============================================================
-- UPLY — Migration v20
-- 1. order_items.prepared — lets the admin tick items off while
--    physically preparing an order (tablet checklist).
-- 2. Clients can add products directly to their own restaurant's
--    catalog, instead of waiting for the admin to create them.
-- ============================================================

alter table public.order_items
  add column if not exists prepared boolean not null default false;

create policy "Admins can update order_items" on public.order_items
  for update using (public.is_admin());

create policy "Clients can add products to their own restaurant" on public.products
  for insert with check (restaurant_id = public.my_restaurant_id());

-- ==================== migration-v21.sql ====================
-- ============================================================
-- UPLY — Migration v21
-- Batch of client-requested improvements:
-- 1. Supplier reference per product, carried onto order_items so it
--    shows on purchase orders even if the product changes later.
-- 2. created_by on products, to identify client-self-added items.
-- 3. delivered_qty on order_items, for the delivery recap (item 4).
-- 4. RLS so clients can edit their own orders while still "En attente",
--    and admins can edit/delete client profiles.
-- ============================================================

-- 1. Supplier reference --------------------------------------------
alter table public.products add column if not exists supplier_ref text;
alter table public.order_items add column if not exists supplier_ref text;

-- 2. Track which client self-added a product ------------------------
alter table public.products add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- 3. Delivered quantity (for the delivery recap) ---------------------
alter table public.order_items add column if not exists delivered_qty numeric(10,2);

-- 4a. Clients can edit their own orders while still "En attente" -----
create policy "Clients can update their own pending orders" on public.orders
  for update using (restaurant_id = public.my_restaurant_id() and status = 'En attente')
  with check (restaurant_id = public.my_restaurant_id() and status = 'En attente');

create policy "Clients can manage order_items on their own pending orders" on public.order_items
  for all using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and o.restaurant_id = public.my_restaurant_id()
      and o.status = 'En attente'
    )
  )
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and o.restaurant_id = public.my_restaurant_id()
      and o.status = 'En attente'
    )
  );

-- 4b. Admins can edit/delete client profiles (Utilisateurs tab) ------
create policy "Admins can delete profiles" on public.profiles
  for delete using (public.is_admin());

-- ==================== migration-v22.sql ====================
-- ============================================================
-- UPLY — Migration v22
-- Fix: deleting a client user via the admin-delete-user Edge Function
-- failed with "Database error deleting user" — orders.created_by and
-- product_requests.created_by had no ON DELETE action, so deleting a
-- profile that had ever placed an order or product request was blocked
-- by the foreign key. Orders/requests should survive account deletion
-- (just lose the author reference), matching products.created_by's
-- existing "on delete set null" from migration-v21.
-- Safe to re-run.
-- ============================================================

alter table public.orders drop constraint if exists orders_created_by_fkey;
alter table public.orders add constraint orders_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.product_requests drop constraint if exists product_requests_created_by_fkey;
alter table public.product_requests add constraint product_requests_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

-- ==================== migration-v23.sql ====================
-- ============================================================
-- UPLY — Migration v23
-- Fix: editing an order item (marking it prepared / changing its delivered
-- quantity) made the line appear to "jump" or disappear from the order on
-- refresh. Root cause: order_items has no natural ordering column (uuid
-- primary key only), so Postgres doesn't guarantee row order on SELECT —
-- an UPDATE can relocate the row's physical position, changing the order
-- rows come back in. Adding created_at lets the app order results
-- consistently (see fetchOrders in src/lib/api/orders.js).
-- Safe to re-run.
-- ============================================================

alter table public.order_items add column if not exists created_at timestamptz not null default now();
