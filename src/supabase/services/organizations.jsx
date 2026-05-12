import { supabase } from '@/supabase/supabaseClient';

const ORG_LOGOS_BUCKET = 'organizations-logos';

export const uploadOrganizationLogo = async (file, userId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from(ORG_LOGOS_BUCKET)
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(ORG_LOGOS_BUCKET)
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error en uploadOrganizationLogo:', error);
    return { url: null, error };
  }
};

export const createOrganization = async (orgPayload) => {
  try {
    const { data, error } = await supabase.rpc('create_organization', {
      p_name: orgPayload.name,
      p_slug: orgPayload.slug,
      p_logo_url: orgPayload.logo_url,
      p_industry: orgPayload.industry,
      p_province_id: orgPayload.province_id,
      p_city_id: orgPayload.city_id,
      p_street: orgPayload.street,
      p_number: orgPayload.number,
    });

    if (error) throw error;

    if (data && data.success === false) {
      throw new Error(data.message || 'Error al crear la organización');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error en createOrganization:', error);
    return { data: null, error };
  }
};

export const getUserOrganizations = async (userId) => {
  try {
    const { data, error } = await supabase.rpc('get_user_organizations', {
      p_user_id: userId,
    });

    if (error) throw error;
    const normalized = (data || []).map((org) => ({
      ...org,
      id: org.id ?? org.organization_id,
    }));
    return { data: normalized, error: null };
  } catch (error) {
    console.error('Error en getUserOrganizations:', error);
    return { data: [], error };
  }
};

export const addOrganizationAdmin = async (orgId, emailToAdd) => {
  try {
    const { data, error } = await supabase.rpc('add_organization_admin', {
      p_org_id: orgId,
      p_email_to_add: emailToAdd,
    });

    if (error) throw error;

    if (data && data.success === false) {
      throw new Error(data.message);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error en addOrganizationAdmin:', error);
    return { data: null, error };
  }
};

export const getOrganizationBySlug = async (slug) => {
  try {
    if (!slug) throw new Error('Slug requerido');
    
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        cities:city_id(name),
        provinces:province_id(name)
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en getOrganizationBySlug:', error);
    return { data: null, error };
  }
};

export const getIndustries = async () => {
  try {
    const { data, error } = await supabase
      .from('industries')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error en getIndustries:', error);
    return { data: [], error };
  }
};

export const getExploreOrganizations = async ({
  searchQuery = '',
  category = null,
  provinceId = null,
  cityId = null,
  sortBy = 'newest',   // 'newest' | 'az'
  page = 0,
  limit = 12,
}) => {
  try {
    let query = supabase
      .from('organizations')
      .select(`
        *,
        cities:city_id(name),
        provinces:province_id(name),
        industries:industry(id, name)
      `, { count: 'exact' });

    if (category && category !== 'todos') {
      query = query.eq('industry', category);
    }

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    if (provinceId) {
      query = query.eq('province_id', provinceId);
    }

    if (cityId) {
      query = query.eq('city_id', cityId);
    }

    // Backend sort
    if (sortBy === 'az') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = page * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return { data: data || [], error: null, count: count ?? 0 };
  } catch (error) {
    console.error('Error en getExploreOrganizations:', error);
    return { data: [], error, count: 0 };
  }
};
