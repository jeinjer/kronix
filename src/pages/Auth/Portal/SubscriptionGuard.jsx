import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';

export default function SubscriptionGuard({ children, user }) {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        if (!user?.id) {
          if (mounted) setIsValid(true);
          return;
        }

        // 1) Resolver organization_id del usuario (primera org)
        const { data: orgRows, error: orgErr } = await supabase
          .from('organization_members')
          .select('organization_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (orgErr) {
          console.error('[SubscriptionGuard] Error leyendo organization_members:', orgErr);
          if (mounted) setIsValid(true);
          return;
        }

        const organizationId = orgRows?.[0]?.organization_id;

        // Si todavía no tiene organización (onboarding), no bloqueamos
        if (!organizationId) {
          if (mounted) setIsValid(true);
          return;
        }

        // 2) Consultar status de suscripción por org (RPC)
        const { data: statusObj, error: statusErr } = await supabase.rpc('get_org_subscription_status', {
          p_org_id: organizationId,
        });

        if (statusErr) {
          console.error('[SubscriptionGuard] Error en get_org_subscription_status:', statusErr);
          if (mounted) setIsValid(true);
          return;
        }

        if (mounted) setIsValid(Boolean(statusObj?.is_valid));
      } catch (e) {
        console.error('[SubscriptionGuard] Error inesperado:', e);
        if (mounted) setIsValid(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (loading) return <div>Validando acceso...</div>;

  if (!isValid) {
    return (
      <div className="h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-6 text-center transition-colors duration-500">
        <div className="max-w-md bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-200 dark:border-white/10 transition-colors duration-500">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Acceso Restringido</h2>
          <p className="text-slate-600 mb-6">
            Tu suscripción no está vigente. Contactate con administración para regularizar el servicio.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-xl"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return children;
}
