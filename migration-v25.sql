-- ============================================================
-- UPLY — Migration v25
-- HARDENING: migration-v17 granted ALL privileges on every table,
-- sequence, and function in the public schema to BOTH `authenticated`
-- AND `anon` — including via `alter default privileges`, so every
-- future table inherits the same broad grant automatically.
--
-- Verified this isn't currently exploitable: every existing table has
-- complete RLS coverage (confirmed anon gets 0 rows / an RLS-denied
-- error on every table tested against the live database). But it
-- means a single future migration that adds a table and forgets
-- `enable row level security` would be fully readable and writable by
-- literally anyone on the internet with zero login required — not
-- just by a signed-in-but-wrong-role user, which is the much smaller
-- blast radius RLS is meant to leave as the fallback.
--
-- The app never needs anon (unauthenticated) table access — every
-- real screen requires signing in first. This revokes the table,
-- sequence, and function grants (and their default-privilege
-- equivalents) from anon specifically, leaving `authenticated`
-- untouched, since RLS is what's meant to do the real per-row
-- restriction there. Safe to re-run.
-- ============================================================

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;
