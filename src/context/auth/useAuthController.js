import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from './profileCache';
import { loadUserProfile } from './profileService';
import { DEFAULT_PROFILE_REFETCH_THROTTLE_MS, shouldRefetchProfile } from './refetchPolicy';

const BOOT_MAX_SPINNER_MS = 1500; 

export const useAuthController = () => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [perfilLoading, setPerfilLoading] = useState(false);

  const perfilRef = useRef(null);
  const userRef = useRef(null);
  const mountedRef = useRef(true);
  const bootFinishedRef = useRef(false);
  const inFlightRef = useRef({ userId: null, promise: null });
  const lastProfileFetchRef = useRef({ at: 0, userId: null });

  useEffect(() => {
    perfilRef.current = perfil;
    userRef.current = user;
  }, [perfil, user]);

  const finishBootOnce = () => {
    if (bootFinishedRef.current) return;
    bootFinishedRef.current = true;
    setTimeout(() => {
      if (mountedRef.current) setLoading(false);
    }, 400); 
  };

  const setProfileState = (fullProfile) => {
    setPerfil(fullProfile);
    setIsSuperAdmin(!!fullProfile?.is_superadmin);
  };

  const fetchUserData = async (userId) => {
    if (!userId) return null;

    if (inFlightRef.current.userId === userId && inFlightRef.current.promise) {
      return inFlightRef.current.promise;
    }

    const promise = (async () => {
      setPerfilLoading(true);
      try {
        const fullProfile = await loadUserProfile(supabase, userId);
        if (!mountedRef.current) return fullProfile;

        setProfileState(fullProfile);
        writeCachedProfile(userId, fullProfile);
        return fullProfile;
      } catch (err) {
        console.error("Error loading profile:", err);
        return null;
      } finally {
        if (mountedRef.current) setPerfilLoading(false);
      }
    })();

    inFlightRef.current = { userId, promise };
    return promise;
  };

  const applySession = async (currentSession, event) => {
    if (!mountedRef.current) return;

    const newUserId = currentSession?.user?.id ?? null;
    const oldUserId = userRef.current?.id ?? null;

    // Evita recargas si el usuario es el mismo (cambio de pestaña)
    if (newUserId !== oldUserId) {
      setSession(currentSession ?? null);
      setUser(currentSession?.user ?? null);
    }

    if (!newUserId) {
      setProfileState(null);
      finishBootOnce();
      return;
    }

    const cached = readCachedProfile(newUserId);
    if (cached && !perfilRef.current) {
      setProfileState(cached);
    }

    const hasProfile = Boolean(perfilRef.current || cached);
    const lastFetchAt = lastProfileFetchRef.current.at || 0;

    const doFetch = shouldRefetchProfile({
      event,
      userId: newUserId,
      hasProfile,
      lastFetchAt,
      throttleMs: DEFAULT_PROFILE_REFETCH_THROTTLE_MS,
    });

    if (!doFetch) {
      finishBootOnce();
      return;
    }

    lastProfileFetchRef.current = { at: Date.now(), userId: newUserId };
    await fetchUserData(newUserId);
    finishBootOnce();
  };

  useEffect(() => {
    mountedRef.current = true;
    const bootSafety = setTimeout(() => {
      finishBootOnce();
    }, BOOT_MAX_SPINNER_MS);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      void applySession(currentSession, event);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      applySession(initialSession, 'BOOT');
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(bootSafety);
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const uid = user?.id;
      await supabase.auth.signOut();
      if (uid) clearCachedProfile(uid);
    } finally {
      setSession(null);
      setUser(null);
      setProfileState(null);
    }
  };

  return useMemo(() => ({
    session,
    user,
    perfil,
    isSuperAdmin,
    loading,
    perfilLoading, // <-- Agregado al retorno
    logout
  }), [session, user, perfil, isSuperAdmin, loading, perfilLoading]);
};