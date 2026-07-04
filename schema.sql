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
