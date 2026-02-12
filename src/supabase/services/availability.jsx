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

const parseTimeString = (timeValue) => {
  const [hours = '0', minutes = '0', seconds = '0'] = String(timeValue || '00:00:00').split(':');
  return {
    hour: Number(hours),
    minute: Number(minutes),
    second: Number(seconds),
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

const formatSlotLabel = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
};

const normalizeWorkingRange = (range) => {
  const start = range.start_time || range.start || range.from_time || null;
  const end = range.end_time || range.end || range.to_time || null;
  if (!start || !end) return null;
  return { start, end };
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const buildDaySlots = ({
  workingHours,
  appointments,
  selectedDate,
  serviceDuration,
  timeZone,
}) => {
  const dateParts = getDateParts(selectedDate);
  const serviceMs = serviceDuration * 60 * 1000;

  const slots = [];

  for (const rawRange of workingHours) {
    const range = normalizeWorkingRange(rawRange);
    if (!range) continue;

    const startParts = parseTimeString(range.start);
    const endParts = parseTimeString(range.end);

    const rangeStartUtc = zonedDateTimeToUtc(
      { ...dateParts, ...startParts },
      timeZone
    );
    const rangeEndUtc = zonedDateTimeToUtc(
      { ...dateParts, ...endParts },
      timeZone
    );

    let cursor = new Date(rangeStartUtc.getTime());
    while (cursor.getTime() + serviceMs <= rangeEndUtc.getTime()) {
      const slotStart = new Date(cursor.getTime());
      const slotEnd = new Date(cursor.getTime() + serviceMs);

      const collision = appointments.find((appt) =>
        overlaps(slotStart, slotEnd, new Date(appt.start_time), new Date(appt.end_time))
      );

      const isAvailable = !collision;

      slots.push({
        startUtc: slotStart.toISOString(),
        endUtc: slotEnd.toISOString(),
        label: formatSlotLabel(slotStart, timeZone),
        isAvailable,
        status: isAvailable ? 'free' : 'occupied',
        appointmentId: isAvailable ? null : collision?.id || null,
        clientName: isAvailable ? null : collision?.client_name || 'Reservado',
      });

      cursor = new Date(cursor.getTime() + serviceMs);
    }
  }

  // Asegura que todo turno reservado del dia se muestre aunque quede fuera
  // del horario laboral actual (por ejemplo, si el horario del staff fue editado).
  const existingByStart = new Set(slots.map((slot) => slot.startUtc));
  for (const appointment of appointments) {
    const apptStart = new Date(appointment.start_time);
    const apptEnd = new Date(appointment.end_time);
    const startIso = apptStart.toISOString();

    if (!existingByStart.has(startIso)) {
      slots.push({
        startUtc: startIso,
        endUtc: apptEnd.toISOString(),
        label: formatSlotLabel(apptStart, timeZone),
        isAvailable: false,
        status: 'occupied',
        appointmentId: appointment.id,
        clientName: appointment.client_name || 'Reservado',
      });
      existingByStart.add(startIso);
    }
  }

  slots.sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime());

  return slots;
};

export const getStaffAvailableSlots = async ({
  staffId,
  selectedDate,
  serviceDuration = 30,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  excludeAppointmentId = null,
}) => {
  try {
    if (!staffId) throw new Error('staffId requerido');
    if (!(selectedDate instanceof Date) || Number.isNaN(selectedDate.getTime())) {
      throw new Error('selectedDate invalida');
    }
    if (!serviceDuration || serviceDuration <= 0) {
      throw new Error('serviceDuration invalida');
    }

    const dateParts = getDateParts(selectedDate);
    const nextDay = addDays(dateParts, 1);

    const dayStartUtc = zonedDateTimeToUtc({ ...dateParts, hour: 0, minute: 0, second: 0 }, timeZone);
    const dayEndUtc = zonedDateTimeToUtc({ ...nextDay, hour: 0, minute: 0, second: 0 }, timeZone);

    const rpcDate = `${dateParts.year}-${pad2(dateParts.month)}-${pad2(dateParts.day)}`;

    const [workingHoursResponse, appointmentsResponse] = await Promise.all([
      supabase.rpc('get_staff_working_hours', {
        p_staff_id: staffId,
        p_date: rpcDate,
      }),
      (() => {
        let appointmentsQuery = supabase
          .from('appointments')
          .select('id, start_time, end_time, status, client_name')
          .eq('staff_id', staffId)
          .is('deleted_at', null)
          .neq('status', 'canceled')
          .lt('start_time', dayEndUtc.toISOString())
          .gt('end_time', dayStartUtc.toISOString())
          .order('start_time', { ascending: true });

        if (excludeAppointmentId) {
          appointmentsQuery = appointmentsQuery.neq('id', excludeAppointmentId);
        }

        return appointmentsQuery;
      })(),
    ]);

    if (workingHoursResponse.error) throw workingHoursResponse.error;
    if (appointmentsResponse.error) throw appointmentsResponse.error;

    const workingHours = Array.isArray(workingHoursResponse.data) ? workingHoursResponse.data : [];
    const appointments = Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : [];

    const daySlots = buildDaySlots({
      workingHours,
      appointments,
      selectedDate,
      serviceDuration,
      timeZone,
    });

    return { data: daySlots, error: null };
  } catch (error) {
    console.error('Error en getStaffAvailableSlots:', error);
    return { data: [], error };
  }
};
