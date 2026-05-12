import { supabase } from '@/supabase/supabaseClient';

export const getScheduleTemplates = async () => {
  try {
    const { data: templates, error: templatesError } = await supabase
      .from('schedule_templates')
      .select('id, name')
      .order('name', { ascending: true });

    if (templatesError) throw templatesError;

    if (!templates?.length) return { data: [], error: null };

    const { data: items, error: itemsError } = await supabase
      .from('schedule_template_items')
      .select('template_id, day_of_week, start_time, end_time')
      .in('template_id', templates.map((t) => t.id));

    if (itemsError) throw itemsError;

    const itemsByTemplate = (items || []).reduce((acc, item) => {
      if (!acc[item.template_id]) acc[item.template_id] = [];
      acc[item.template_id].push(item);
      return acc;
    }, {});

    const merged = templates.map((t) => ({
      ...t,
      schedule_template_items: itemsByTemplate[t.id] || [],
    }));

    return { data: merged, error: null };
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
