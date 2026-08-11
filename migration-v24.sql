-- ============================================================
-- UPLY — Migration v24
-- SECURITY FIX (critical): the "Admins can update any profile" policy on
-- public.profiles only ever checked `id = auth.uid()`, on both the USING
-- clause and the implicitly-matching WITH CHECK — it never restricted
-- which columns a non-admin could change on their own row.
--
-- Confirmed exploitable: any authenticated client account could call
--   PATCH /rest/v1/profiles?id=eq.<own-id>  body: {"role":"admin"}
-- using nothing but its own normal session, and become a full admin.
-- The same gap also let a client set restaurant_id to any other real
-- restaurant's id, instantly gaining read/write access to that
-- restaurant's orders, products, and invoices — a cross-tenant data
-- breach that doesn't even require the role escalation.
--
-- Fix: a trigger blocks non-admins from changing role or restaurant_id
-- on their own profile row, regardless of which RLS policy let the
-- UPDATE statement through. service_role (Edge Functions) and admins
-- (including the legacy admin_create_user RPC, which runs under the
-- calling admin's own session) are explicitly allowed through, since
-- those are the legitimate paths that set these columns today.
-- Safe to re-run.
-- ============================================================

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Seuls les administrateurs peuvent modifier le rôle.';
  end if;

  if new.restaurant_id is distinct from old.restaurant_id then
    raise exception 'Seuls les administrateurs peuvent modifier le restaurant associé.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_privilege_escalation on public.profiles;
create trigger prevent_profile_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();
