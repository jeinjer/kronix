import { supabase } from '@/supabase/supabaseClient';

export const getProvinces = async () => {
  try {
    const { data, error } = await supabase.rpc('get_provinces');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en getProvinces:', error);
    return { data: [], error };
  }
};


export const getCitiesByProvince = async (provinceId) => {
  try {
    const { data, error } = await supabase.rpc('get_cities_by_province', { 
      p_province_id: provinceId 
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en getCitiesByProvince:', error);
    return { data: [], error };
  }
};