-- ============================================================
-- UPLY — Migration v5
-- Fix: profiles SELECT policy was fragile (self-referencing is_admin()
-- check caused unreliable reads right after login for some accounts).
-- This replaces it with a simpler, more robust version.
-- ============================================================

drop policy if exists "Users can view their own profile" on public.profiles;

-- Every logged-in user can always read their own row — no function call,
-- no dependency on any other table, so this can never fail or recurse.
create policy "Users can view their own profile" on public.profiles
  for select using (id = auth.uid());

-- Admins can additionally view all profiles (separate policy; Postgres
-- combines multiple permissive policies with OR automatically).
create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());
