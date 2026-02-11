const isTrueLike = (value) => {
  if (value === true) return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'y', 't', 'si', 'sí'].includes(normalized);
  }
  if (typeof value === 'number') return value === 1;
  return false;
};

const hasSuperAdminRole = (source) => {
  if (!source) return false;

  if (
    isTrueLike(source.is_superadmin) ||
    isTrueLike(source.is_super_admin) ||
    isTrueLike(source.superadmin)
  ) {
    return true;
  }

  const rawRoleCandidates = [
    source.role,
    source.user_role,
    source.account_role,
    source.app_role,
    source.type
  ].filter(Boolean);

  const roleCandidates = rawRoleCandidates
    .flatMap((value) => {
      if (typeof value === 'object' && value !== null) {
        return [
          ...Object.values(value),
          JSON.stringify(value)
        ];
      }
      return [value];
    })
    .filter(Boolean)
    .map(v => String(v).trim().toLowerCase());

  return roleCandidates.some(role =>
    ['superadmin', 'super_admin', 'super-admin', 'super admin'].includes(role) ||
    (role.includes('super') && role.includes('admin'))
  );
};

export const isSuperAdminUser = ({ user, profile } = {}) =>
  hasSuperAdminRole(profile) ||
  hasSuperAdminRole(user?.app_metadata) ||
  hasSuperAdminRole(user?.user_metadata);
