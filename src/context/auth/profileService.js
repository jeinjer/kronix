export const buildFullProfile = (profileRow, organizationId) => ({
  ...profileRow,
  barberia_id: organizationId ?? null,
});

export const fetchProfileRow = async (supabase, userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const fetchPrimaryOrganizationId = async (supabase, userId) => {
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) throw error;
  return data?.[0]?.organization_id ?? null;
};

export const loadUserProfile = async (supabase, userId) => {
  const profileRow = await fetchProfileRow(supabase, userId);

  let organizationId = null;
  try {
    organizationId = await fetchPrimaryOrganizationId(supabase, userId);
  } catch {
    organizationId = null;
  }

  return buildFullProfile(profileRow, organizationId);
};
