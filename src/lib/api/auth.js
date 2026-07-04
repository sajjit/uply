import { supabase } from '../supabaseClient';

/* ============================================================
   Authentication & user profile
   ============================================================ */

export async function signIn(email, password) {
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) return { profile: null, error: "Adresse e-mail ou mot de passe incorrect." };

  const { profile, error: profileError } = await getMyProfile();
  if (profileError) {
    return { profile: null, error: "Connexion réussie, mais impossible de charger le profil. Réessayez ou contactez le support." };
  }
  if (!profile) {
    return { profile: null, error: "Aucun profil trouvé pour ce compte. Contactez l'administrateur." };
  }
  return { profile, error: null };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Returns { profile, error } — callers should check `error` explicitly rather than
 * assuming a falsy profile always means "not logged in". */
export async function getMyProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { profile: null, error: null }; // genuinely not logged in
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single();
  if (error) {
    console.error('getMyProfile error:', error);
    return { profile: null, error };
  }
  return { profile: data, error: null };
}

export async function updateLanguage(profileId, language) {
  const { error } = await supabase.from('profiles').update({ language }).eq('id', profileId);
  return { error };
}

export async function fetchUsers() {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'client');
  return { data: data || [], error };
}

export async function adminCreateUser(email, password, name, restaurantId) {
  const { data, error } = await supabase.rpc('admin_create_user', {
    p_email: email,
    p_password: password,
    p_name: name,
    p_restaurant_id: restaurantId,
  });
  if (error) return { data: null, error: error.message };
  if (data && !data.success) return { data: null, error: data.error };
  return { data, error: null };
}
