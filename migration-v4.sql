-- ============================================================
-- UPLY — Migration v4
-- Storage bucket for invoice/purchase-order PDFs
-- ============================================================

-- Unit price snapshot at time of order (needed to compute invoice totals
-- even if the product's catalog price changes later)
alter table public.order_items
  add column if not exists unit_price numeric(10,2) default 0;

-- Run the rest of this file in the Supabase SQL editor AFTER creating the
-- "invoices" bucket in Storage (see instructions in chat) — bucket creation
-- itself must be done from the dashboard UI, not SQL.

-- Allow admins to upload to the invoices bucket
create policy "Admins can upload invoices"
on storage.objects for insert
with check (
  bucket_id = 'invoices' and public.is_admin()
);

-- Allow admins to read all invoices
create policy "Admins can read all invoices"
on storage.objects for select
using (
  bucket_id = 'invoices' and public.is_admin()
);

-- Allow clients to read only their own restaurant's invoices
-- (relies on file path convention: invoices/{restaurant_id}/{order_id}.pdf)
create policy "Clients can read their restaurant's invoices"
on storage.objects for select
using (
  bucket_id = 'invoices'
  and (storage.foldername(name))[1] = public.my_restaurant_id()::text
);
