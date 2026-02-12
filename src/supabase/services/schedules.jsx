import { supabase } from '@/supabase/supabaseClient';

export const getStaffSchedules = async (staffId) => {
  try {
    if (!staffId) throw new Error('staffId requerido');

    const { data, error } = await supabase
      .from('staff_schedules')
      .select('id, staff_id, day_of_week, start_time, end_time, is_break')
      .eq('staff_id', staffId)
      .eq('is_break', false)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error en getStaffSchedules:', error);
    return { data: [], error };
  }
};

export const replaceStaffSchedules = async ({ staffId, blocks }) => {
  try {
    if (!staffId) throw new Error('staffId requerido');

    const { error: deleteError } = await supabase
      .from('staff_schedules')
      .delete()
      .eq('staff_id', staffId);

    if (deleteError) throw deleteError;

    if (!blocks.length) return { data: [], error: null };

    const { data, error } = await supabase
      .from('staff_schedules')
      .insert(
        blocks.map((block) => ({
          staff_id: staffId,
          day_of_week: block.day_of_week,
          start_time: block.start_time,
          end_time: block.end_time,
          is_break: false,
        }))
      )
      .select('id, day_of_week, start_time, end_time, is_break');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error en replaceStaffSchedules:', error);
    return { data: [], error };
  }
};
