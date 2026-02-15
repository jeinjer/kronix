import { supabase } from '@/supabase/supabaseClient';

const pad2 = (value) => String(value).padStart(2, '0');

const getDateParts = (date) => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
});

const addDays = ({ year, month, day }, amount) => {
  const d = new Date(Date.UTC(year, month - 1, day + amount));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
};

const getTimeZoneParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};

const getTimeZonePartsForDateOnly = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
};

const getOffsetMs = (date, timeZone) => {
  const parts = getTimeZoneParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
};

const zonedDateTimeToUtc = ({ year, month, day, hour, minute, second }, timeZone) => {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  let offset = getOffsetMs(new Date(utcGuess), timeZone);
  let utcTs = utcGuess - offset;
  const correctedOffset = getOffsetMs(new Date(utcTs), timeZone);

  if (correctedOffset !== offset) {
    offset = correctedOffset;
    utcTs = utcGuess - offset;
  }

  return new Date(utcTs);
};

const getLocalDayUtcRange = (selectedDate, timeZone) => {
  const dateParts = getDateParts(selectedDate);
  const nextDay = addDays(dateParts, 1);

  const dayStartUtc = zonedDateTimeToUtc(
    { ...dateParts, hour: 0, minute: 0, second: 0 },
    timeZone
  );
  const dayEndUtc = zonedDateTimeToUtc(
    { ...nextDay, hour: 0, minute: 0, second: 0 },
    timeZone
  );

  return { dayStartUtc, dayEndUtc };
};

export const getOrganizationAppointmentsByDate = async ({
  organizationId,
  selectedDate,
  staffId = null,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}) => {
  try {
    if (!organizationId) throw new Error('organizationId requerido');
    if (!(selectedDate instanceof Date) || Number.isNaN(selectedDate.getTime())) {
      throw new Error('selectedDate invalida');
    }

    const { dayStartUtc, dayEndUtc } = getLocalDayUtcRange(selectedDate, timeZone);

    let query = supabase
      .from('appointments')
      .select('id, organization_id, staff_id, client_name, client_phone, client_email, start_time, end_time, status, notes')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .neq('status', 'canceled')
      .lt('start_time', dayEndUtc.toISOString())
      .gt('end_time', dayStartUtc.toISOString())
      .order('start_time', { ascending: true });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error en getOrganizationAppointmentsByDate:', error);
    return { data: [], error };
  }
};

export const getOrganizationAppointmentsByDateRange = async ({
  organizationId,
  fromDate,
  toDate,
  staffId = null,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}) => {
  try {
    if (!organizationId) throw new Error('organizationId requerido');
    if (!(fromDate instanceof Date) || Number.isNaN(fromDate.getTime())) {
      throw new Error('fromDate invalida');
    }
    if (!(toDate instanceof Date) || Number.isNaN(toDate.getTime())) {
      throw new Error('toDate invalida');
    }

    const { dayStartUtc } = getLocalDayUtcRange(fromDate, timeZone);
    const { dayEndUtc } = getLocalDayUtcRange(toDate, timeZone);

    let query = supabase
      .from('appointments')
      .select('id, organization_id, staff_id, client_name, client_phone, client_email, start_time, end_time, status, notes')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .neq('status', 'canceled')
      .lt('start_time', dayEndUtc.toISOString())
      .gt('end_time', dayStartUtc.toISOString())
      .order('start_time', { ascending: true });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error en getOrganizationAppointmentsByDateRange:', error);
    return { data: [], error };
  }
};

export const formatAppointmentTime = (isoString, timeZone) => {
  if (!isoString) return '--:--';
  return new Intl.DateTimeFormat('es-AR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString));
};

export const formatAppointmentDateForInput = (isoString, timeZone) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const parts = getTimeZonePartsForDateOnly(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
};

export const formatAppointmentDate = (isoString, timeZone) => {
  if (!isoString) return '--/--/----';
  const date = new Date(isoString);
  const parts = getTimeZonePartsForDateOnly(date, timeZone);
  return `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
};

export const formatAppointmentTimeForInput = (isoString, timeZone) => {
  if (!isoString) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString));
};

export const localDateTimeToUtcIso = (dateValue, timeValue, timeZone) => {
  const [year, month, day] = String(dateValue || '').split('-').map(Number);
  const [hour, minute] = String(timeValue || '').split(':').map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) return null;

  const utcDate = zonedDateTimeToUtc(
    { year, month, day, hour, minute, second: 0 },
    timeZone
  );

  return utcDate.toISOString();
};

export const formatDateInputValue = (date) => {
  const { year, month, day } = getDateParts(date);
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

export const createAppointment = async ({
  organizationId,
  staffId,
  startTime,
  endTime,
  clientName,
  clientPhone = null,
}) => {
  try {
    if (!organizationId) throw new Error('organizationId requerido');
    if (!staffId) throw new Error('staffId requerido');
    if (!startTime || !endTime) throw new Error('Horario invalido');
    if (!clientName?.trim()) throw new Error('Nombre de cliente requerido');
    if (new Date(startTime).getTime() <= Date.now()) {
      throw new Error('No se pueden reservar horarios pasados.');
    }

    const payload = {
      organization_id: organizationId,
      staff_id: staffId,
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
      client_name: clientName.trim(),
      client_phone: clientPhone?.trim() || null,
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(payload)
      .select('id, staff_id, start_time, end_time, client_name, client_phone, status')
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateAppointmentById = async ({ appointmentId, updates }) => {
  try {
    if (!appointmentId) throw new Error('appointmentId requerido');
    if (!updates || typeof updates !== 'object') throw new Error('updates invalidos');

    const { data: currentAppointment, error: currentError } = await supabase
      .from('appointments')
      .select('id, end_time')
      .eq('id', appointmentId)
      .is('deleted_at', null)
      .single();

    if (currentError) return { data: null, error: currentError };
    if (new Date(currentAppointment.end_time).getTime() <= Date.now()) {
      return {
        data: null,
        error: { message: 'No se pueden modificar turnos pasados.' },
      };
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .is('deleted_at', null)
      .select('id, staff_id, start_time, end_time, client_name, client_phone, status')
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const cancelAppointment = async ({ appointmentId }) => {
  try {
    if (!appointmentId) throw new Error('appointmentId requerido');

    const { data: currentAppointment, error: currentError } = await supabase
      .from('appointments')
      .select('id, end_time')
      .eq('id', appointmentId)
      .is('deleted_at', null)
      .single();

    if (currentError) return { data: null, error: currentError };
    if (new Date(currentAppointment.end_time).getTime() <= Date.now()) {
      return {
        data: null,
        error: { message: 'No se pueden cancelar turnos pasados.' },
      };
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .is('deleted_at', null)
      .select('id, status')
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const checkStaffAvailability = async ({
  staffId,
  startTime,
  endTime,
  excludeAppointmentId = null,
}) => {
  try {
    if (!staffId || !startTime || !endTime) throw new Error('Parametros incompletos');

    let query = supabase
      .from('appointments')
      .select('id')
      .eq('staff_id', staffId)
      .is('deleted_at', null)
      .neq('status', 'canceled')
      .lt('start_time', endTime)
      .gt('end_time', startTime)
      .limit(1);

    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { isAvailable: !(data && data.length > 0), error: null };
  } catch (error) {
    return { isAvailable: false, error };
  }
};
