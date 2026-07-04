-- Add stock status to products (separate from active/inactive)
-- active = shown in admin catalog management at all
-- in_stock = whether clients can currently order it
alter table public.products
  add column if not exists in_stock boolean default true;

-- Add a general comment field to orders (for feature #6)
alter table public.orders
  add column if not exists comment text;

-- Add expected delivery window (for feature #8)
alter table public.orders
  add column if not exists delivery_date date,
  add column if not exists delivery_window text;

-- Add favorites table (for feature #3)
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (profile_id, product_id)
);

alter table public.favorites enable row level security;

create policy "Users manage their own favorites" on public.favorites
  for all using (profile_id = auth.uid());

-- Add notifications table (for feature #9)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users see their own notifications" on public.notifications
  for select using (profile_id = auth.uid());

create policy "Users can mark their own notifications read" on public.notifications
  for update using (profile_id = auth.uid());

create policy "Admins can create notifications" on public.notifications
  for insert with check (public.is_admin() or profile_id = auth.uid());
