import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 1. Cargar sesión inicial
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkAdminRole(session.user.id);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // 2. Escuchar cambios (Login, Logout, Auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        await checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función auxiliar para chequear roles (puedes expandirla luego)
  const checkAdminRole = async (userId) => {
    // Aquí podrías consultar tu tabla de 'perfiles' o 'roles'
    // Por ahora lo dejamos simple o simulado
    // const { data } = await supabase.from('perfiles').select('rol').eq('id', userId).single();
    // setIsAdmin(data?.rol === 'admin');
    setIsAdmin(false); // Por defecto false hasta que conectes tu lógica de roles
  };

  // --- LA FUNCIÓN QUE NECESITAS ---
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // La redirección a /login o home la maneja App.jsx al detectar session = null
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
    }
  };

  const value = {
    session,
    user,
    logout,
    isAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};