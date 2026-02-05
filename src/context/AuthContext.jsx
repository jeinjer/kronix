import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lógica Robusta: Consulta directa a la tabla en lugar de RPC
  const checkAdminRole = async (userId) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    try {
      // Leemos directamente la columna is_superadmin
      const { data, error } = await supabase
        .from('profiles')
        .select('is_superadmin')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Si no se encuentra el perfil o hay error de red, asumimos false
        console.warn('⚠️ No se pudo verificar rol admin:', error.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data?.is_superadmin);
      }
    } catch (err) {
      console.error("❌ Error inesperado verificando rol:", err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Obtener sesión inicial
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            // Esperamos la verificación
            await checkAdminRole(initialSession.user.id);
          } else {
            setSession(null);
            setUser(null);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error("❌ Error crítico inicializando auth:", error);
      } finally {
        // 2. GARANTÍA TOTAL: Esto se ejecuta siempre, haya error o no.
        if (mounted) {
            setLoading(false);
        }
      }
    };

    initializeAuth();

    // 3. Listener de eventos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Verificamos rol en segundo plano sin bloquear la UI si ya cargó
        await checkAdminRole(currentSession.user.id);
      } else {
        setIsAdmin(false);
      }
      
      // Aseguramos que el loading se apague en cambios de estado también
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setSession(null);
      setUser(null);
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
      {children}
    </AuthContext.Provider>
  );
};