export const DEFAULT_PROFILE_REFETCH_THROTTLE_MS = 15 * 60 * 1000;

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

  if (isTokenRefreshEvent(event)) return false;

  if (isProfileSensitiveEvent(event)) return true;

  const age = Date.now() - (lastFetchAt || 0);
  return age > throttleMs;
};
