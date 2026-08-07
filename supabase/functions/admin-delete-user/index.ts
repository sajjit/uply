// Supabase Edge Function: admin-delete-user
//
// Permanently deletes a client login through Supabase's official Admin API
// (auth.admin.deleteUser) — this can't be done with the anon/publishable key,
// only INSERT/UPDATE-scoped RLS policies exist for profiles, and deleting the
// auth.users row (not just the profile) is what actually revokes access.
// Deleting the auth.users row cascades to the profiles row automatically
// (profiles.id references auth.users(id) on delete cascade).
//
// Deploy: paste this file's contents into Supabase Dashboard →
// Edge Functions → "admin-delete-user" → Code tab → deploy.
//
// Requires the same SERVICE_ROLE_KEY secret already set up for
// admin-create-user (Edge Functions → Secrets).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Session manquante.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: 'Session invalide.' }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileError || callerProfile?.role !== 'admin') {
      return jsonResponse({ error: 'Permission refusée : réservé aux administrateurs.' }, 403);
    }

    const { userId } = await req.json();
    if (!userId) {
      return jsonResponse({ error: 'Identifiant utilisateur requis.' }, 400);
    }
    if (userId === userData.user.id) {
      return jsonResponse({ error: 'Vous ne pouvez pas supprimer votre propre compte.' }, 400);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      return jsonResponse({ error: deleteError.message }, 400);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ error: err.message || 'Erreur inconnue.' }, 500);
  }
});
