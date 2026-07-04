import { supabase } from '../supabaseClient';

/* ============================================================
   Favorites (client-side product pinning)
   ============================================================ */

export async function fetchFavorites(profileId) {
  const { data, error } = await supabase.from('favorites').select('product_id').eq('profile_id', profileId);
  return { data: (data || []).map((f) => f.product_id), error };
}

export async function toggleFavorite(profileId, productId, isFavorite) {
  if (isFavorite) {
    const { error } = await supabase.from('favorites').insert({ profile_id: profileId, product_id: productId });
    return { error };
  }
  const { error } = await supabase.from('favorites').delete().eq('profile_id', profileId).eq('product_id', productId);
  return { error };
}
