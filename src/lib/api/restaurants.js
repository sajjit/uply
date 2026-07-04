import { supabase } from '../supabaseClient';

/* ============================================================
   Restaurants
   ============================================================ */

export async function fetchRestaurants() {
  const { data, error } = await supabase.from('restaurants').select('*').order('name');
  return { data: data || [], error };
}

export async function createRestaurant(name) {
  const { data, error } = await supabase.from('restaurants').insert({ name }).select().single();
  return { data, error };
}

export async function deleteRestaurant(id) {
  const { error } = await supabase.from('restaurants').delete().eq('id', id);
  return { error };
}
