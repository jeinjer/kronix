import { supabase } from '@/supabase/supabaseClient';

export const getScheduleTemplates = async () => {
  try {
    const query = supabase
      .from('schedule_templates')
      .select('id, name')
      .order('name', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error en getScheduleTemplates:', error);
    return { data: [], error };
  }
};

export const applyScheduleTemplate = async ({ staffId, templateId }) => {
  try {
    if (!staffId) throw new Error('staffId requerido');
    if (!templateId) throw new Error('templateId requerido');

    const { data, error } = await supabase.rpc('apply_schedule_template', {
      p_staff_id: staffId,
      p_template_id: templateId,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en applyScheduleTemplate:', error);
    return { data: null, error };
  }
};
