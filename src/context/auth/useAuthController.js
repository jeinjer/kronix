import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from './profileCache';
import { loadUserProfile } from './profileService';
import { DEFAULT_PROFILE_REFETCH_THROTTLE_MS, shouldRefetchProfile } from './refetchPolicy';

const BOOT_MAX_SPINNER_MS = 600;

const isSameInFlight = (inFlight, userId) =>
  inFlight?.promise && inFlight?.userId === userId;

export const useAuthController = () => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [perfil, setPerfil] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [perfilLoading, setPerfilLoading] = useState(false);

  const perfilRef = useRef(null);
  const isAdminRef = useRef(false);

  useEffect(() => {
    perfilRef.current = perfil;
    isAdminRef.current = isAdmin;
  }, [perfil, isAdmin]);

  const bootFinishedRef = useRef(false);
  const mountedRef = useRef(true);
  const inFlightRef = useRef({ userId: null, promise: null });
  const lastProfileFetchRef = useRef({ at: 0, userId: null });
  const throttleMsRef = useRef(DEFAULT_PROFILE_REFETCH_THROTTLE_MS);

  const finishBootOnce = () => {
    if (bootFinishedRef.current) return;
    bootFinishedRef.current = true;
    if (mountedRef.current) setLoading(false);
  };

  const setProfileState = (fullProfile) => {
    setPerfil(fullProfile);
    setIsAdmin(!!fullProfile?.is_superadmin);
  };

  const clearAuthState = () => {
    setSession(null);
    setUser(null);
    setProfileState(null);
    setPerfilLoading(false);
  };

  const fetchUserData = async (userId) => {
    if (!userId) return null;

    if (isSameInFlight(inFlightRef.current, userId)) {
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
        if (!mountedRef.current) return null;

        setProfileState(null);
        return null;
      } finally {
        if (mountedRef.current) setPerfilLoading(false);
      }
    })();

    inFlightRef.current = { userId, promise };

    promise.finally(() => {
      const cur = inFlightRef.current;
      if (cur.userId === userId && cur.promise === promise) {
        inFlightRef.current = { userId: null, promise: null };
      }
    });

    return promise;
  };

  const applySession = async (currentSession, event) => {
    if (!mountedRef.current) return;

    setSession(currentSession ?? null);
    setUser(currentSession?.user ?? null);

    const userId = currentSession?.user?.id ?? null;

    finishBootOnce();

    if (!userId) {
      setProfileState(null);
      setPerfilLoading(false);
      return;
    }

    const cached = readCachedProfile(userId);
    if (cached && !perfilRef.current) {
      setProfileState(cached);
    }

    const hasProfile = Boolean(perfilRef.current || cached);
    const lastFetchAt = lastProfileFetchRef.current.at || 0;

    const doFetch = shouldRefetchProfile({
      event,
      userId,
      hasProfile,
      lastFetchAt,
      throttleMs: throttleMsRef.current,
    });

    if (!doFetch) return;

    lastProfileFetchRef.current = { at: Date.now(), userId };
    void fetchUserData(userId);
  };

  useEffect(() => {
    mountedRef.current = true;

    const bootSafety = setTimeout(() => {
      finishBootOnce();
    }, BOOT_MAX_SPINNER_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      void applySession(currentSession, event);
    });

    (async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await applySession(initialSession, 'BOOT');
      } catch {
        finishBootOnce();
      }
    })();

    return () => {
      mountedRef.current = false;
      clearTimeout(bootSafety);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    try {
      const uid = user?.id;
      await supabase.auth.signOut();
      if (uid) clearCachedProfile(uid);
    } finally {
      clearAuthState();
    }
  };

  return useMemo(
    () => ({
      session,
      user,
      perfil,
      isAdmin,
      loading,
      perfilLoading,
      logout,
    }),
    [session, user, perfil, isAdmin, loading, perfilLoading]
  );
};
