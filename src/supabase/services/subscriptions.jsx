import { supabase } from '@/supabase/supabaseClient';

// Función auxiliar para fechas (privada del servicio)
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const computeNextValidUntil = (currentValidUntil, extraDays = 30) => {
  const now = new Date();
  const base =
    currentValidUntil && new Date(currentValidUntil) > now
      ? new Date(currentValidUntil)
      : now;

  return addDays(base, extraDays).toISOString();
};

/**
 * Obtiene todas las suscripciones usando la VISTA 'subscriptions_details'
 * Esto evita el error de relaciones y trae el nombre de la organización limpio.
 */
export const getAllSubscriptions = async () => {
  const { data, error } = await supabase
    .from('subscriptions_details') // Usamos la VISTA, no la tabla directa
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Mapeamos para que coincida con lo que espera tu UI
  return data.map(sub => ({
    id: sub.id,
    organization_id: sub.organization_id, // Puede ser null si borraste la org
    org_name: sub.organization_name || 'Sin Organización', // Viene de la vista
    user_email: sub.user_email, // Extra: ahora tenemos el mail del dueño
    plan_type: sub.plan_type,
    status: sub.status,
    valid_until: sub.valid_until,
    created_at: sub.created_at,
  }));
};

/**
 * Actualiza el estado de una suscripción
 */
export const updateSubscriptionStatus = async (id, status) => {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
  return true;
};

/**
 * Registra un pago y extiende la fecha 30 días
 */
export const extendSubscription = async (id, currentValidUntil) => {
  const newValidUntil = computeNextValidUntil(currentValidUntil, 30);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      status: 'active', 
      valid_until: newValidUntil 
    })
    .eq('id', id);

  if (error) throw error;
  return true;
};