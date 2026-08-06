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
