-- ============================================================
-- UPLY — Migration v23
-- Fix: editing an order item (marking it prepared / changing its delivered
-- quantity) made the line appear to "jump" or disappear from the order on
-- refresh. Root cause: order_items has no natural ordering column (uuid
-- primary key only), so Postgres doesn't guarantee row order on SELECT —
-- an UPDATE can relocate the row's physical position, changing the order
-- rows come back in. Adding created_at lets the app order results
-- consistently (see fetchOrders in src/lib/api/orders.js).
-- Safe to re-run.
-- ============================================================

alter table public.order_items add column if not exists created_at timestamptz not null default now();
