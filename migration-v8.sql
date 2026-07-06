-- ============================================================
-- UPLY — Migration v8
-- Add "En livraison" (out for delivery) as its own order status,
-- distinct from "Livrée" (delivered) — client asked for notifications
-- covering: commande validée, en préparation, en livraison, livrée.
-- ============================================================

alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('En attente', 'En préparation', 'En livraison', 'Livrée'));
