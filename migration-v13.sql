-- ============================================================
-- UPLY — Migration v13
-- Fix: notifications INSERT policy only allowed admins, or a user
-- inserting a row for themselves. This silently blocked two real
-- flows: a client's order notifying the admin (client isn't admin,
-- and the row's profile_id is the admin's, not the client's own),
-- and notifyRestaurant() broadcasting to *other* client accounts at
-- the same restaurant when more than one user shares a restaurant.
-- Any authenticated user creating a notification is low-risk (no
-- sensitive data, app-triggered only), so this just requires login.
-- ============================================================

drop policy if exists "Admins can create notifications" on public.notifications;

create policy "Authenticated users can create notifications" on public.notifications
  for insert with check (auth.uid() is not null);
