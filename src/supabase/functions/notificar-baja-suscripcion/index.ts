// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Metodo no permitido' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('Authorization');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !authHeader) {
      return jsonResponse({ success: false, error: 'Configuracion incompleta' }, 500);
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ success: false, error: 'No autenticado' }, 401);
    }

    const { data: requester, error: requesterError } = await adminClient
      .from('profiles')
      .select('is_superadmin')
      .eq('id', user.id)
      .single();

    if (requesterError || !requester?.is_superadmin) {
      return jsonResponse({ success: false, error: 'Sin permisos' }, 403);
    }

    const payload = await req.json();
    const subscriptionId = String(payload?.subscription_id || '').trim();
    const reason = String(payload?.reason || '').trim();
    const payloadEmail = normalizeEmail(payload?.user_email);
    const payloadOrgName = String(payload?.organization_name || '').trim();

    if (!subscriptionId || !reason) {
      return jsonResponse(
        { success: false, error: 'subscription_id y reason son obligatorios' },
        400
      );
    }

    let targetEmail = payloadEmail;
    let organizationName = payloadOrgName || 'tu organizacion';

    if (!targetEmail) {
      const { data: details, error: detailsError } = await adminClient
        .from('subscriptions_details')
        .select('user_email, organization_name')
        .eq('id', subscriptionId)
        .maybeSingle();

      if (detailsError) {
        return jsonResponse({ success: false, error: detailsError.message }, 400);
      }

      targetEmail = normalizeEmail(details?.user_email);
      organizationName = String(details?.organization_name || organizationName);
    }

    if (!targetEmail) {
      return jsonResponse(
        { success: false, error: 'No se encontro el email del suscriptor' },
        400
      );
    }

    const { data: rpcData, error: rpcError } = await adminClient.rpc(
      'admin_apply_subscription_adjustment',
      {
        p_subscription_id: subscriptionId,
        p_plan_type: null,
        p_status: 'inactive',
        p_extra_days: 0,
      }
    );

    if (rpcError) {
      return jsonResponse({ success: false, error: rpcError.message }, 400);
    }

    if (rpcData?.success === false) {
      return jsonResponse(
        { success: false, error: String(rpcData?.message || 'No se pudo desactivar la suscripcion') },
        400
      );
    }

    const { error: reasonUpdateError } = await adminClient
      .from('subscriptions')
      .update({
        deactivation_reason: reason,
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (reasonUpdateError) {
      return jsonResponse({ success: false, error: reasonUpdateError.message }, 400);
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');

    if (!resendApiKey || !fromEmail) {
      return jsonResponse({
        success: true,
        email_sent: false,
        warning: 'Falta configurar RESEND_API_KEY o RESEND_FROM_EMAIL',
      });
    }

    const subject = 'Notificacion de desactivacion de suscripcion';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Suscripcion desactivada</h2>
        <p>La suscripcion asociada a <strong>${organizationName}</strong> fue desactivada.</p>
        <p><strong>Motivo informado:</strong></p>
        <p style="background:#f5f5f5;padding:12px;border-radius:8px;">${reason}</p>
        <p>Si necesitas ayuda, responde este correo.</p>
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [targetEmail],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      return jsonResponse({
        success: true,
        email_sent: false,
        warning: `No se pudo enviar correo: ${resendError}`,
      });
    }

    return jsonResponse({
      success: true,
      email_sent: true,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error inesperado',
      },
      500
    );
  }
});
