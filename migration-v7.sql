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
