-- ============================================================
-- UPLY — Migration v9
-- Restaurant contact details (address, phone) so PDFs (invoices,
-- purchase orders, delivery notes) can show full restaurant info.
-- ============================================================

alter table public.restaurants
  add column if not exists address text,
  add column if not exists phone text;
