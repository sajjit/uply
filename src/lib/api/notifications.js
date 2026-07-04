import { supabase } from '../supabaseClient';

/* ============================================================
   Notifications
   ============================================================ */

export async function fetchNotifications(profileId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(30);
  return { data: data || [], error };
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  return { error };
}

export async function createNotification(profileId, message) {
  const { error } = await supabase.from('notifications').insert({ profile_id: profileId, message });
  return { error };
}

// Notify every client profile belonging to a restaurant
export async function notifyRestaurant(restaurantId, message) {
  const { data: profiles } = await supabase.from('profiles').select('id').eq('restaurant_id', restaurantId);
  if (!profiles || profiles.length === 0) return;
  const rows = profiles.map((p) => ({ profile_id: p.id, message }));
  await supabase.from('notifications').insert(rows);
}

// Notify every admin profile (used e.g. when a client submits a new product request)
export async function notifyAdmins(message) {
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  if (!admins || admins.length === 0) return;
  const rows = admins.map((a) => ({ profile_id: a.id, message }));
  await supabase.from('notifications').insert(rows);
}
