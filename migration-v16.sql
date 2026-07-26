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
