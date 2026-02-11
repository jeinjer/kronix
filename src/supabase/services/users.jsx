import { supabase } from '@/supabase/supabaseClient';

const USER_AVATARS_BUCKET = 'profiles-avatar';

// CORRECCIÓN: El nombre real de la función en tu base de datos es 'update_profile'
const UPDATE_PROFILE_RPC = 'update_profile'; 

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Actualiza la metadata del usuario en auth.users (no el perfil público)
export const updateUserProfile = async (updates) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserRole = async (userId, orgId) => {
    try {
        const { data, error } = await supabase.rpc('get_user_role', {
            p_user_id: userId,
            p_org_id: orgId
        });
        if (error) throw error;
        return { role: data, error: null };
    } catch (error) {
        return { role: null, error };
    }
};

export const isAdmin = async (userId) => {
  try {
    if (!userId) return { isAdmin: false, error: 'User ID required' };
    
    const { data, error } = await supabase
        .from('profiles')
        .select('is_superadmin')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return { isAdmin: !!data?.is_superadmin, error: null };
  }
    catch (error) {
    return { isAdmin: false, error };
}
};

const getStoragePathFromPublicUrl = (url, bucket) => {
  if (!url || !bucket) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
};

export const uploadUserAvatar = async (file, userId) => {
  try {
    if (!userId) throw new Error('User ID requerido');

    const filePath = `${userId}/avatar-${Date.now()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from(USER_AVATARS_BUCKET)
      .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(USER_AVATARS_BUCKET)
      .getPublicUrl(filePath);

    return { url: data.publicUrl, path: filePath, error: null };
  } catch (error) {
    return { url: null, path: null, error };
  }
};

export const deleteUserAvatarFile = async (avatarUrl) => {
  try {
    const path = getStoragePathFromPublicUrl(avatarUrl, USER_AVATARS_BUCKET);
    if (!path) return { error: null };

    const { error } = await supabase.storage
      .from(USER_AVATARS_BUCKET)
      .remove([path]);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const updateProfileAvatar = async (userId, avatarUrl) => {
  try {
    if (!userId) throw new Error('User ID requerido');
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const upsertProfileByRpc = async ({ fullName, phone, avatarUrl = null }) => {
  try {
    const { data, error } = await supabase.rpc(UPDATE_PROFILE_RPC, {
      p_full_name: fullName,
      p_avatar_url: avatarUrl,
      p_phone: phone
    });

    if (error) throw error;
    return { data, error: null };

  } catch (error) {
    console.error("Error en upsertProfileByRpc:", error);
    return { data: null, error: new Error(error.message || 'Error actualizando perfil') };
  }
};