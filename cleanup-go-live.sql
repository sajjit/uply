-- ============================================================
-- UPLY — Go-live data cleanup
-- ⚠️ DESTRUCTIVE — this permanently deletes all restaurants,
-- products, orders, suppliers, and the test client login, so
-- Steeve can start with a completely clean slate.
--
-- Keeps: the real admin account (sajjit999@gmail.com) and the
-- schema itself. Everything else goes.
-- ============================================================

-- order_items.product_id has no ON DELETE CASCADE, so it must be cleared
-- explicitly before restaurants/products cascade-delete, or the FK blocks it.
delete from public.order_items;

-- Delete all restaurants. Cascades automatically to:
--   products, orders, suppliers, product_requests (restaurant_id)
--   → price_history/product_suppliers/favorites (via products)
delete from public.restaurants;

-- Delete the test client logins entirely — cascades to their profiles,
-- favorites, and notifications automatically.
delete from auth.users where email in (
  'client@test.fr',
  'noemielambourdiere@gmail.com',
  'steeveceva@outlook.fr'
);

-- Clear test notifications that piled up on the admin account
-- during development, so the bell starts clean.
delete from public.notifications
where profile_id = (select id from public.profiles where email = 'sajjit999@gmail.com');

-- ============================================================
-- Verify — run this after the deletes above. Every row here
-- should show 0, except profiles (should be exactly 1: the admin).
-- ============================================================
select 'restaurants' as table_name, count(*) from public.restaurants
union all select 'products', count(*) from public.products
union all select 'orders', count(*) from public.orders
union all select 'order_items', count(*) from public.order_items
union all select 'suppliers', count(*) from public.suppliers
union all select 'product_requests', count(*) from public.product_requests
union all select 'favorites', count(*) from public.favorites
union all select 'notifications', count(*) from public.notifications
union all select 'profiles (should be 1: admin only)', count(*) from public.profiles;
