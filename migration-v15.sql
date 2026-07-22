-- ============================================================
-- UPLY — Migration v15
-- Add restaurant owner name (client request: track who owns each
-- restaurant account, not just its address/phone).
-- ============================================================

alter table public.restaurants
  add column if not exists owner_name text;
