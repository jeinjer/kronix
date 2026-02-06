const PROFILE_CACHE_PREFIX = 'kronix.profile.';

const safeGetLS = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetLS = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const safeRemoveLS = (key) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

export const getProfileCacheKey = (userId) => `${PROFILE_CACHE_PREFIX}${userId}`;

export const readCachedProfile = (userId) => {
  const raw = safeGetLS(getProfileCacheKey(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.id !== userId) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const writeCachedProfile = (userId, profile) => {
  const payload = { ...profile, __cachedAt: Date.now() };
  safeSetLS(getProfileCacheKey(userId), JSON.stringify(payload));
};

export const clearCachedProfile = (userId) => {
  safeRemoveLS(getProfileCacheKey(userId));
};
