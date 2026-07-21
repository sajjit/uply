-- ============================================================
-- UPLY — Migration v14
-- Fix: notifyAdmins() silently did nothing when called by a client.
-- It first SELECTs profiles where role = 'admin' to find who to
-- notify — but a client's RLS visibility into profiles only covers
-- their own row (or all rows, if *they're* an admin). So the SELECT
-- always came back empty for a client caller, and the function
-- returned early before ever inserting a notification. No error was
-- raised anywhere, which is why this went unnoticed.
--
-- Fix: a SECURITY DEFINER function (same pattern as is_admin() /
-- admin_create_user()) that looks up admins and inserts their
-- notifications with elevated privileges, bypassing this RLS gap
-- entirely — instead of broadening what clients can see in profiles.
-- ============================================================

create or replace function public.notify_admins(p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (profile_id, message)
  select id, p_message from public.profiles where role = 'admin';
end;
$$;

grant execute on function public.notify_admins(text) to authenticated;
