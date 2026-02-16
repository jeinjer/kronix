import { supabase } from '@/supabase/supabaseClient';

const PLANES_VALIDOS = new Set(['trial', 'pro', 'enterprise']);

const ESTADOS_VALIDOS = new Set(['active', 'inactive']);

const normalizePlan = (planType) =>
  PLANES_VALIDOS.has(String(planType || '').toLowerCase())
    ? String(planType).toLowerCase()
    : 'pro';

const normalizeStatus = (status) =>
  ESTADOS_VALIDOS.has(String(status || '').toLowerCase())
    ? String(status).toLowerCase()
    : null;

/**
 * Obtiene todas las suscripciones usando la vista subscriptions_details.
 */
export const getAllSubscriptions = async () => {
  const { data, error } = await supabase
    .from('subscriptions_details')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((sub) => ({
    id: sub.id,
    organization_id: sub.organization_id,
    org_name: sub.organization_name || 'Sin organizacion',
    user_email: sub.user_email,
    plan_type: sub.plan_type,
    status: sub.status,
    valid_until: sub.valid_until,
    created_at: sub.created_at,
    deactivation_reason: sub.deactivation_reason || null,
    deactivated_at: sub.deactivated_at || null,
  }));
};

/**
 * Elimina definitivamente una invitacion.
 */
export const deleteInvitation = async (id) => {
  const { error } = await supabase
    .from('saas_invitations')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

/**
 * Actualiza el estado de una suscripcion.
 */
export const updateSubscriptionStatus = async (id, status) => {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'active' || normalized === 'inactive') {
    return setSubscriptionActivity({ id, isActive: normalized === 'active' });
  }

  if (normalized === 'trial' || normalized === 'pro' || normalized === 'enterprise') {
    return applySubscriptionAdjustment({
      id,
      planType: normalized,
      extraDays: 0,
    });
  }

  throw new Error('Estado de suscripcion invalido');
};

/**
 * Ajuste manual de suscripcion:
 * - Cambiar plan (trial/pro/enterprise)
 * - Extender vigencia sumando dias
 */
export const applySubscriptionAdjustment = async ({
  id,
  planType = null,
  extraDays = 0,
}) => {
  const normalizedPlan = planType == null ? null : normalizePlan(planType);
  const normalizedDays = Number.isFinite(Number(extraDays))
    ? Math.max(0, Math.trunc(Number(extraDays)))
    : 0;

  const { data, error } = await supabase.rpc('admin_apply_subscription_adjustment', {
    p_subscription_id: id,
    p_plan_type: normalizedPlan,
    p_status: null,
    p_extra_days: normalizedDays,
  });

  if (error) {
    if (String(error.code || '') === '42883') {
      throw new Error(
        'Falta ejecutar la migracion SQL de ajustes de suscripcion (admin_apply_subscription_adjustment).'
      );
    }
    throw error;
  }
  if (data?.success === false) {
    throw new Error(data?.message || 'No se pudo aplicar el ajuste');
  }

  return true;
};

/**
 * Activa o desactiva una suscripcion.
 * `isActive = true` => estado activo
 * `isActive = false` => estado inactivo
 */
export const setSubscriptionActivity = async ({ id, isActive }) => {
  const normalizedStatus = normalizeStatus(isActive ? 'active' : 'inactive');
  if (!normalizedStatus) throw new Error('Estado de suscripcion invalido');

  const { data, error } = await supabase.rpc('admin_apply_subscription_adjustment', {
    p_subscription_id: id,
    p_plan_type: null,
    p_status: normalizedStatus,
    p_extra_days: 0,
  });

  if (error) {
    if (String(error.code || '') === '42883') {
      throw new Error(
        'Falta ejecutar la migracion SQL de ajustes de suscripcion (admin_apply_subscription_adjustment).'
      );
    }
    throw error;
  }

  if (data?.success === false) {
    throw new Error(data?.message || 'No se pudo actualizar el estado');
  }

  return true;
};

/**
 * Desactiva una suscripcion con motivo y envia correo al usuario.
 * Requiere Edge Function: notificar-baja-suscripcion
 */
export const deactivateSubscriptionWithReason = async ({
  subscriptionId,
  reason,
  userEmail,
  organizationName,
}) => {
  const cleanReason = String(reason || '').trim();
  if (!cleanReason) {
    throw new Error('Debes ingresar un motivo');
  }

  const { data, error } = await supabase.functions.invoke(
    'notificar-baja-suscripcion',
    {
      body: {
        subscription_id: subscriptionId,
        reason: cleanReason,
        user_email: userEmail || null,
        organization_name: organizationName || null,
      },
    }
  );

  if (error) throw error;
  return {
    emailSent: Boolean(data?.email_sent),
    warning: data?.warning || null,
  };
};
