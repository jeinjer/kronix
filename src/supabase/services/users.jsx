import { supabase } from '@/supabase/supabaseClient';

export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
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