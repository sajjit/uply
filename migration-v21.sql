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
