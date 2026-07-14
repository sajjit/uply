// Supabase Edge Function: admin-create-user
//
// Invites a client account by email through Supabase's official Admin API
// (auth.admin.inviteUserByEmail) — the admin never sees or sets a password.
// Supabase sends its built-in invite email; clicking the link signs the
// person in and our app's forced-password-reset screen (triggered by the
// must_reset_password flag) lets them set their own password.
//
// Deploy: paste this file's contents into Supabase Dashboard →
// Edge Functions → "admin-create-user" → Code tab → deploy.
//
// Requires a SERVICE_ROLE_KEY secret (Edge Functions → Secrets) set to
// the project's service_role key — the auto-injected SUPABASE_SERVICE_ROLE_KEY
// isn't used here. Also requires migration-v12.sql to have been run, which
// grants service_role table access (schemas created via the SQL Editor
// don't automatically pick up Supabase's default grants for every role).

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

    // Client scoped to the caller's own session, just to find out who's asking.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: 'Session invalide.' }, 401);
    }

    // Service-role client for the privileged checks + the actual user creation.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileError || callerProfile?.role !== 'admin') {
      return jsonResponse({ error: 'Permission refusée : réservé aux administrateurs.' }, 403);
    }

    const { email, name, restaurantId, redirectTo } = await req.json();

    if (!email) {
      return jsonResponse({ error: 'Adresse e-mail requise.' }, 400);
    }

    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      String(email).toLowerCase(),
      { data: { name }, redirectTo }
    );

    if (inviteError) {
      return jsonResponse({ error: inviteError.message }, 400);
    }

    // The on_auth_user_created trigger already inserted a default profile row —
    // fill in the restaurant/role/forced-reset flag on top of it. must_reset_password
    // stays true until they click the invite link and set their own password.
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ name, restaurant_id: restaurantId, role: 'client', must_reset_password: true })
      .eq('id', invited.user.id);

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 400);
    }

    return jsonResponse({ success: true, id: invited.user.id, email: invited.user.email });
  } catch (err) {
    return jsonResponse({ error: err.message || 'Erreur inconnue.' }, 500);
  }
});
