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
