import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const SuperAdminRoute = () => {
  const { session, isAdmin, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Cargando...</div>;
  
  return session && isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
};

export const DashboardRoute = () => {
  // Ahora extraemos 'perfil' que SÍ existe en el contexto nuevo
  const { session, perfil, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Cargando...</div>;

  if (!session) return <Navigate to="/login" replace />;

  // Si tiene sesión pero no tiene barbería asignada, va al onboarding
  if (!perfil?.barberia_id) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};