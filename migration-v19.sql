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
