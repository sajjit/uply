-- ============================================================
-- v26: health-check ping function
-- ============================================================
-- The automated keep-alive ping (.github/workflows/keep-supabase-alive.yml)
-- was hitting a table the anon role has no SELECT grant on (by design —
-- see the v793d959 defense-in-depth grant revocation). That request was
-- getting a 401 every time, and it turns out Supabase's free-tier pause
-- detector does NOT count a permission-denied response as real activity —
-- only a genuinely successful request does. Result: uply-staging paused
-- anyway despite the ping running successfully on schedule.
--
-- Fix: a dedicated function that does nothing except confirm the database
-- is reachable. No table data, no security regression — anon can only ever
-- get back the literal string 'ok'.

create or replace function public.ping()
returns text
language sql
as $$
  select 'ok';
$$;

grant execute on function public.ping() to anon;
