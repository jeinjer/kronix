import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { getUserRole } from '@/supabase/services/users';
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from './profileCache';
import { loadUserProfile } from './profileService';
import { DEFAULT_PROFILE_REFETCH_THROTTLE_MS, shouldRefetchProfile } from './refetchPolicy';
import { isSuperAdminUser } from '@/utils/superAdmin';

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
    setIsSuperAdmin(
      isSuperAdminUser({
        user: userRef.current,
        profile: fullProfile
      })
    );
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
        const { role: resolvedRole } = await getUserRole(userId, fullProfile?.barberia_id ?? null);
        const normalizedProfile = { ...fullProfile, user_role: resolvedRole ?? fullProfile?.user_role };
        if (!mountedRef.current) return fullProfile;

        setProfileState(normalizedProfile);
        writeCachedProfile(userId, normalizedProfile);
        return normalizedProfile;
      } catch (err) {
        console.error("Error loading profile:", err);
        return null;
      } finally {
        if (mountedRef.current) setPerfilLoading(false);
        // Permite refetch real en futuros eventos (login/update), evitando datos stale.
        if (inFlightRef.current.userId === userId) {
          inFlightRef.current = { userId: null, promise: null };
        }
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
    const shouldSyncUserState =
      newUserId !== oldUserId || event === 'USER_UPDATED';

    if (shouldSyncUserState) {
      setSession(currentSession ?? null);
      setUser(currentSession?.user ?? null);
      if (isSuperAdminUser({ user: currentSession?.user })) {
        setIsSuperAdmin(true);
      }
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

    // Evita refetch/re-render al volver de pestaña cuando Supabase re-emite SIGNED_IN.
    if (event === 'SIGNED_IN' && newUserId === oldUserId && hasProfile) {
      finishBootOnce();
      return;
    }

    let doFetch = shouldRefetchProfile({
      event,
      userId: newUserId,
      hasProfile,
      lastFetchAt,
      throttleMs: DEFAULT_PROFILE_REFETCH_THROTTLE_MS,
    });

    // Si aÃºn no podemos determinar si es superadmin, forzamos un fetch en eventos sensibles.
    const resolvedSuperAdmin = isSuperAdminUser({
      user: currentSession?.user,
      profile: perfilRef.current || cached
    });
    if (!resolvedSuperAdmin && ['BOOT', 'INITIAL_SESSION'].includes(event)) {
      doFetch = true;
    }

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
      inFlightRef.current = { userId: null, promise: null };
      lastProfileFetchRef.current = { at: 0, userId: null };
      setSession(null);
      setUser(null);
      setProfileState(null);
    }
  };

  const refreshAuthData = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    await applySession(currentSession, 'USER_UPDATED');
  };

  return useMemo(() => ({
    session,
    user,
    perfil,
    isSuperAdmin,
    loading,
    perfilLoading, // <-- Agregado al retorno
    logout,
    refreshAuthData
  }), [session, user, perfil, isSuperAdmin, loading, perfilLoading]);
};
