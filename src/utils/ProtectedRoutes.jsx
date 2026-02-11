import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSuperAdminUser } from './superAdmin';

export const SuperAdminRoute = () => {
  // Usamos isSuperAdmin para coincidir con el AuthContext
  const { session, user, perfil, isSuperAdmin, loading, perfilLoading } = useAuth();
  const isSuperAdminEffective = Boolean(
    isSuperAdmin || isSuperAdminUser({ user, profile: perfil })
  );

  if (loading) return null; // El HomeLoader global se encarga

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Si ya sabemos que es admin (desde perfil o cache)
  if (isSuperAdminEffective) {
    return <Outlet />;
  }

  // Si todavía se está cargando el perfil, esperamos antes de rebotarlo
  if (perfilLoading) return null;

  // Si no es admin, lo mandamos a su dashboard normal
  return <Navigate to="/dashboard" replace />;
};

export const DashboardRoute = () => {
  const { session, loading } = useAuth();

  if (loading) return null;

  if (!session) return <Navigate to="/login" replace />;

  // En el nuevo sistema multi-org, no bloqueamos por 'barberia_id'
  // ya que el usuario entra al Hub para elegir una.
  return <Outlet />;
};
