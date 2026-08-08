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
