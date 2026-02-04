import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';

export default function SubscriptionGuard({ children, user }) {
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      // Obtenemos el ID de suscripción vinculado al perfil del usuario
      const { data: perfil } = await supabase
        .from('roles')
        .select('suscripciones_saas(estado)')
        .eq('id', user.id)
        .single();

      setEstado(perfil?.suscripciones_saas?.estado);
      setLoading(false);
    };
    checkStatus();
  }, [user]);

  if (loading) return <div>Validando acceso...</div>;

  // Solo permitimos entrar si está 'Activa' o 'En espera'
  if (estado === 'Inactiva') {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Acceso Restringido</h2>
          <p className="text-slate-600 mb-6">Tu suscripción está inactiva. Contactate con administración para regularizar el servicio.</p>
          <button onClick={() => supabase.auth.signOut()} className="bg-slate-900 text-white px-6 py-2 rounded-xl">Cerrar Sesión</button>
        </div>
      </div>
    );
  }

  return children;
}
