// Supabase Edge Function: admin-create-user
//
// Creates a client account through Supabase's official Admin API
// (auth.admin.createUser) instead of hand-inserting rows into
// auth.users via SQL — the raw-SQL approach in the old
// admin_create_user() Postgres function produced accounts that could
// never actually log in, because Supabase Auth (GoTrue) relies on
// internal invariants a plain INSERT can't reproduce.
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

    const { email, password, name, restaurantId } = await req.json();

    if (!email || !password || password.length < 6) {
      return jsonResponse({ error: 'Adresse e-mail et mot de passe (min. 6 caractères) requis.' }, 400);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: String(email).toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError) {
      return jsonResponse({ error: createError.message }, 400);
    }

    // The on_auth_user_created trigger already inserted a default profile row —
    // fill in the restaurant/role/forced-reset flag on top of it.
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ name, restaurant_id: restaurantId, role: 'client', must_reset_password: true })
      .eq('id', created.user.id);

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 400);
    }

    return jsonResponse({ success: true, id: created.user.id, email: created.user.email });
  } catch (err) {
    return jsonResponse({ error: err.message || 'Erreur inconnue.' }, 500);
  }
});
