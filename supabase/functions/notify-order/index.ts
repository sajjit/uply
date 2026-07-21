// Supabase Edge Function: notify-order
//
// Emails the restaurant-order recipient (via Resend) whenever a new order
// is placed. Runs in Resend's sandbox mode — no domain required, since it
// only ever sends to one fixed, pre-verified address.
//
// Deploy: paste this file's contents into Supabase Dashboard →
// Edge Functions → Create a new function named "notify-order".
//
// Requires a RESEND_API_KEY secret (Edge Functions → Secrets).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NOTIFY_EMAIL = 'scprestaplus@gmail.com';

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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    // Just confirm the caller is logged in — this only ever fires from the
    // app's own order-creation flow, no admin check needed.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: 'Session invalide.' }, 401);
    }

    const { restaurantName, itemsSummary, orderId, pdfBase64 } = await req.json();

    const html = `
      <div style="font-family: sans-serif; color: #0D0F0D;">
        <h2 style="margin-bottom: 4px;">Nouvelle commande reçue</h2>
        <p style="margin: 4px 0;"><strong>Restaurant :</strong> ${restaurantName || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>N° commande :</strong> ${orderId ? String(orderId).slice(0, 8).toUpperCase() : ''}</p>
        <p style="margin: 12px 0 4px;"><strong>Produits :</strong></p>
        <p style="margin: 0;">${itemsSummary || ''}</p>
        <p style="color:#8A938A; font-size:12px; margin-top:24px;">Notification automatique Uply</p>
      </div>
    `;

    const emailPayload = {
      from: 'Uply <onboarding@resend.dev>',
      to: [NOTIFY_EMAIL],
      subject: `Nouvelle commande — ${restaurantName || 'Restaurant'}`,
      html,
    };
    if (pdfBase64) {
      const orderRef = orderId ? String(orderId).slice(0, 8).toUpperCase() : 'commande';
      emailPayload.attachments = [{ filename: `bon-de-commande-${orderRef}.pdf`, content: pdfBase64 }];
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      return jsonResponse({ error: `Resend error: ${errBody}` }, 400);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ error: err.message || 'Erreur inconnue.' }, 500);
  }
});
