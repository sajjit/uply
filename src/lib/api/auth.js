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

/** Sends a password-reset email via Supabase's built-in flow. Always
 * "succeeds" from the caller's perspective (Supabase doesn't reveal
 * whether the address has an account, to avoid leaking that info). */
export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  return { error: error ? error.message : null };
}

/** Sets a new password for the currently authenticated session — used
 * both for the recovery-link flow and the forced first-login reset. */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error ? error.message : null };
}

export async function clearMustResetPassword(profileId) {
  const { error } = await supabase.from('profiles').update({ must_reset_password: false }).eq('id', profileId);
  return { error };
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

/** Edits a client's name/restaurant assignment — a plain profile update,
 * covered by the existing "admins can update any profile" RLS policy. */
export async function updateUser(id, updates) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', id);
  return { error };
}

/** Permanently deletes a client login via the admin-delete-user Edge Function
 * (Supabase Admin API, service-role key) — removes the auth.users row, which
 * cascades to the profile automatically. Not reversible. */
export async function deleteUser(userId) {
  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { userId },
  });
  if (error) {
    let message = error.message;
    try {
      const body = await error.context.json();
      if (body?.error) message = body.error;
    } catch {
      // fall back to the generic error.message above
    }
    return { error: message };
  }
  if (data && data.error) return { error: data.error };
  return { error: null };
}

/** Invites a client account by email via the admin-create-user Edge Function
 * (Supabase Admin API, service-role key, server-side only). No password is
 * set by the admin — Supabase sends a real invite email, and the recipient
 * sets their own password after clicking the link. */
export async function adminCreateUser(email, name, restaurantId) {
  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: { email, name, restaurantId, redirectTo: window.location.origin },
  });
  if (error) {
    let message = error.message;
    try {
      const body = await error.context.json();
      if (body?.error) message = body.error;
    } catch {
      // fall back to the generic error.message above
    }
    return { data: null, error: message };
  }
  if (data && data.error) return { data: null, error: data.error };
  return { data, error: null };
}
