import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 1. Ruta solo para Stefano (SuperAdmin)
export const SuperAdminRoute = () => {
  const { session, isAdmin, loading } = useAuth();

  if (loading) return <div className="text-slate-900 dark:text-white p-10">Cargando permisos...</div>;
  
  // Si no hay sesión o no es admin, lo mandamos al login
  return session && isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
};

export const DashboardRoute = () => {
  const { session, perfil, loading } = useAuth();

  if (loading) return <div className="text-slate-900 dark:text-white p-10">Cargando dashboard...</div>;

  if (!session) return <Navigate to="/login" replace />;

  if (session && !perfil?.barberia_id) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};