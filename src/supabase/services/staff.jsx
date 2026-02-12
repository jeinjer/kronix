import { supabase } from '@/supabase/supabaseClient';

const normalizeEmail = (email) => email?.trim().toLowerCase() || '';

const findProfileByEmail = async (email) => {
  if (!email) return { profile: null, error: null };

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .eq('email', normalizeEmail(email))
    .maybeSingle();

  if (error) return { profile: null, error };
  return { profile: data || null, error: null };
};

const hydrateStaffWithProfiles = async (staffRows) => {
  const userIds = [...new Set((staffRows || []).map((row) => row.user_id).filter(Boolean))];
  if (!userIds.length) return staffRows;

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .in('id', userIds);

  if (error) return staffRows;

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  return staffRows.map((row) => ({
    ...row,
    profile: row.user_id ? profileById.get(row.user_id) || null : null,
  }));
};

export const getOrganizationStaff = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, organization_id, user_id, name, is_active, avatar_url, created_at, deleted_at')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    const hydrated = await hydrateStaffWithProfiles(data || []);
    return { data: hydrated, error: null };
  } catch (error) {
    console.error('Error en getOrganizationStaff:', error);
    return { data: [], error };
  }
};

export const createStaffMember = async ({ organizationId, name, email, avatarUrl = null }) => {
  try {
    const cleanName = name?.trim();
    const cleanEmail = normalizeEmail(email);

    if (!organizationId) throw new Error('organizationId requerido');
    if (!cleanName) throw new Error('name requerido');

    let linkedProfile = null;
    if (cleanEmail) {
      const { profile, error: profileError } = await findProfileByEmail(cleanEmail);
      if (profileError) throw profileError;
      linkedProfile = profile;
    }

    if (linkedProfile?.id) {
      const { data: existing, error: existingError } = await supabase
        .from('staff')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', linkedProfile.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) {
        throw new Error('Ese usuario ya esta cargado como empleado en esta sucursal.');
      }
    }

    const payload = {
      organization_id: organizationId,
      user_id: linkedProfile?.id || null,
      name: cleanName,
      avatar_url: avatarUrl,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('staff')
      .insert(payload)
      .select('id, organization_id, user_id, name, is_active, avatar_url, created_at, deleted_at')
      .single();

    if (error) throw error;

    return {
      data: {
        ...data,
        profile: linkedProfile
          ? {
              id: linkedProfile.id,
              email: linkedProfile.email,
              full_name: linkedProfile.full_name,
              avatar_url: linkedProfile.avatar_url,
            }
          : null,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error en createStaffMember:', error);
    return { data: null, error };
  }
};

export const updateStaffStatus = async ({ staffId, isActive }) => {
  try {
    if (!staffId) throw new Error('staffId requerido');

    const { data, error } = await supabase
      .from('staff')
      .update({ is_active: isActive })
      .eq('id', staffId)
      .is('deleted_at', null)
      .select('id, is_active')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en updateStaffStatus:', error);
    return { data: null, error };
  }
};

export const softDeleteStaffMember = async ({ staffId }) => {
  try {
    if (!staffId) throw new Error('staffId requerido');

    const { data, error } = await supabase
      .from('staff')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', staffId)
      .is('deleted_at', null)
      .select('id')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en softDeleteStaffMember:', error);
    return { data: null, error };
  }
};
