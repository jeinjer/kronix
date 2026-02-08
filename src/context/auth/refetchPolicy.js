// src/context/auth/refetchPolicy.js

export const DEFAULT_PROFILE_REFETCH_THROTTLE_MS = 15 * 60 * 1000; // 15 minutos

export const isTokenRefreshEvent = (event) => event === 'TOKEN_REFRESHED';

export const isProfileSensitiveEvent = (event) =>
  event === 'BOOT' ||
  event === 'SIGNED_IN' ||
  event === 'INITIAL_SESSION' ||
  event === 'USER_UPDATED';

export const shouldRefetchProfile = ({
  event,
  userId,
  hasProfile,
  lastFetchAt,
  throttleMs = DEFAULT_PROFILE_REFETCH_THROTTLE_MS,
}) => {
  if (!userId) return false;
  if (!hasProfile) return true;

  const age = Date.now() - (lastFetchAt || 0);

  if (isTokenRefreshEvent(event)) return false;

  if (isProfileSensitiveEvent(event)) {
    // SI ES UN CHEQUEO DE PESTAÑA (BOOT/INITIAL) Y EL PERFIL ES RECIENTE:
    // No recargar para evitar el parpadeo de la página.
    if ((event === 'BOOT' || event === 'INITIAL_SESSION') && age < 60000) {
      return false;
    }
    return true;
  }

  return age > throttleMs;
};