import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Función de carga con logs detallados
  const fetchUserData = async (userId) => {
    console.log(`👤 [Auth] Buscando datos para usuario: ${userId}`);
    
    try {
      // 1. Obtener Perfil
      console.time('fetchProfile');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      console.timeEnd('fetchProfile');

      if (profileError) {
        console.error('❌ [Auth] Error bajando perfil:', profileError.message);
        throw profileError;
      }
      console.log('✅ [Auth] Perfil descargado:', profileData);

      // 2. Obtener Organización (Barbería)
      console.time('fetchOrg');
      const { data: orgData, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .maybeSingle(); // Usamos maybeSingle para no dar error si es null
      console.timeEnd('fetchOrg');

      if (orgError) console.warn('⚠️ [Auth] Error o sin org:', orgError.message);

      // 3. Armar objeto completo
      const fullProfile = {
        ...profileData,
        barberia_id: orgData?.organization_id || null
      };

      console.log('📦 [Auth] State Final calculado:', fullProfile);
      
      setPerfil(fullProfile);
      setIsAdmin(!!fullProfile.is_superadmin);

    } catch (err) {
      console.error("☠️ [Auth] FATAL en fetchUserData:", err.message);
      setPerfil(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log("🚀 [Auth] Iniciando servicio...");
      
      try {
        console.time('getSession');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        console.timeEnd('getSession');

        if (error) throw error;
        
        if (mounted) {
          if (initialSession?.user) {
            console.log("🔓 [Auth] Sesión encontrada. Iniciando carga de datos...");
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchUserData(initialSession.user.id);
          } else {
            console.log("🔒 [Auth] No hay sesión activa.");
            setSession(null);
            setUser(null);
            setPerfil(null);
          }
        }
      } catch (error) {
        console.error("🔥 [Auth] Error CRÍTICO en inicialización:", error);
      } finally {
        if (mounted) {
          console.log("🏁 [Auth] LOADING -> FALSE (Fin del proceso)");
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`🔄 [Auth Event] ${event}`);
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        setLoading(true); // Poner loading true temporalmente al cambiar usuario
        await fetchUserData(currentSession.user.id);
        setLoading(false);
      } else {
        setPerfil(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    console.log("👋 [Auth] Cerrando sesión...");
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setPerfil(null);
    setIsAdmin(false);
  };

  const value = {
    session,
    user,
    perfil,
    isAdmin,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};