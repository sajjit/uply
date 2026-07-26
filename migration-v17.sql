-- ============================================================
-- UPLY — Migration v17
-- Fix: "permission denied for table categories" (42501) — same root
-- cause as migration-v12, but for authenticated/anon this time.
-- Tables created via the SQL Editor don't inherit Supabase's default
-- grants; RLS policies are a separate layer from the base GRANT, and
-- RLS alone doesn't substitute for it. Safe to re-run.
-- ============================================================

grant usage on schema public to authenticated, anon;
grant all on all tables in schema public to authenticated, anon;
grant all on all sequences in schema public to authenticated, anon;
grant all on all functions in schema public to authenticated, anon;

-- So any future tables/sequences/functions get the same treatment
-- automatically, without needing another migration like this one.
alter default privileges in schema public grant all on tables to authenticated, anon;
alter default privileges in schema public grant all on sequences to authenticated, anon;
alter default privileges in schema public grant all on functions to authenticated, anon;
