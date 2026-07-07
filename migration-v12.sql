-- ============================================================
-- UPLY — Migration v12
-- Fix: service_role gets "permission denied for table profiles"
-- (and presumably other tables) despite BYPASSRLS. RLS bypass does
-- NOT substitute for base table GRANTs — since this schema was built
-- via manual SQL Editor runs rather than Supabase's dashboard table
-- editor, service_role was never explicitly granted access.
-- Safe to re-run.
-- ============================================================

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- So any future tables/sequences/functions get the same treatment
-- automatically, without needing another migration like this one.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;
