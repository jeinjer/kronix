import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const SuperAdminRoute = () => {
  const { session, isAdmin, loading, perfilLoading } = useAuth();

  // 1) Espera solo el boot de sesión.
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Cargando...</div>;
  }

  // 2) Si no hay sesión, fuera.
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 3) Si ya sabemos que es admin (cached o cargado), no bloquees por perfilLoading.
  if (isAdmin) {
    return <Outlet />;
  }

  // 4) Si todavía se está resolviendo el perfil, espera antes de decidir.
  if (perfilLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Cargando...</div>;
  }

  // 5) Logueado pero no admin: al dashboard (evita sensación de “recarga”).
  return <Navigate to="/dashboard" replace />;
};

export const DashboardRoute = () => {
  // Ahora extraemos 'perfil' que SÍ existe en el contexto nuevo
  const { session, perfil, loading, perfilLoading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Cargando...</div>;

  if (!session) return <Navigate to="/login" replace />;

  // Si todavía estamos cargando perfil (o se está rehidratando), no redirijas.
  if (perfilLoading && !perfil) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Cargando...</div>;
  }

  // Si tiene sesión pero no tiene barbería asignada (confirmado), va al onboarding
  if (!perfil?.barberia_id) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};