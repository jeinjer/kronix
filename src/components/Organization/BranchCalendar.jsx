import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getOrganizationStaff } from '@/supabase/services/staff';
import {
  formatAppointmentDate,
  formatDateInputValue,
  getOrganizationAppointmentsByDate,
  getOrganizationAppointmentsByDateRange,
} from '@/supabase/services/appointments';
import AvailableSlots from '@/components/Organization/AvailableSlots';
import AppointmentModal from '@/components/Organization/AppointmentModal';

const parseDateInput = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const shiftDateInput = (value, days) => {
  const date = parseDateInput(value);
  date.setDate(date.getDate() + days);
  return formatDateInputValue(date);
};

const getWeekStart = (date) => {
  const value = new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  value.setHours(0, 0, 0, 0);
  return value;
};

const localDateKeyFromIso = (isoString, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date(isoString))
    .reduce((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
};

const formatWeekdayLabel = (date, timeZone) =>
  new Intl.DateTimeFormat('es-AR', {
    timeZone,
    weekday: 'short',
  }).format(date);

const formatSelectedDayLabel = (date, timeZone) =>
  `${new Intl.DateTimeFormat('es-AR', { timeZone, weekday: 'long' }).format(date)} ${formatAppointmentDate(
    date.toISOString(),
    timeZone
  )}`;

export default function BranchCalendar({
  organizationId,
  organizationName,
  businessTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  onAppointmentsCountChange,
  onMetricsChange,
  servicePrice = 0,
  staffRefreshKey = 0,
  schedulesRefreshKey = 0,
}) {
  const dateInputRef = useRef(null);
  const lastWeekFetchKeyRef = useRef('');
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatDateInputValue(new Date()));
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [viewMode, setViewMode] = useState('day');
  const [calendarRefreshTick, setCalendarRefreshTick] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [slotsSummary, setSlotsSummary] = useState({
    freeCount: 0,
    reservedCount: 0,
    totalCount: 0,
  });

  const selectedDateKey = useMemo(
    () => localDateKeyFromIso(new Date(`${selectedDate}T00:00:00`).toISOString(), businessTimeZone),
    [selectedDate, businessTimeZone]
  );

  useEffect(() => {
    const loadStaff = async () => {
      if (!organizationId) return;
      setStaffLoading(true);
      const { data, error } = await getOrganizationStaff(organizationId);

      if (error) {
        toast.error('No se pudo cargar el personal');
        setStaffList([]);
        setSelectedStaffId('');
        setStaffLoading(false);
        return;
      }

      const activeStaff = (data || []).filter((employee) => employee.is_active);
      setStaffList(activeStaff);
      setSelectedStaffId((prev) => {
        if (!activeStaff.length) return '';
        if (prev && activeStaff.some((employee) => employee.id === prev)) return prev;
        return activeStaff[0].id;
      });
      setStaffLoading(false);
    };

    loadStaff();
  }, [organizationId, staffRefreshKey]);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!organizationId || !selectedStaffId) {
        setAppointments([]);
        return;
      }

      const dateObject = new Date(`${selectedDate}T00:00:00`);
      let data = [];
      let error = null;

      if (viewMode === 'week') {
        const weekStart = getWeekStart(dateObject);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const weekStartKey = formatDateInputValue(weekStart);
        const weekFetchKey = `${organizationId}|${selectedStaffId}|${weekStartKey}|${calendarRefreshTick}`;
        if (lastWeekFetchKeyRef.current === weekFetchKey) {
          return;
        }

        setAppointmentsLoading(true);

        const response = await getOrganizationAppointmentsByDateRange({
          organizationId,
          fromDate: weekStart,
          toDate: weekEnd,
          staffId: selectedStaffId,
          timeZone: businessTimeZone,
        });
        data = response.data;
        error = response.error;
        lastWeekFetchKeyRef.current = weekFetchKey;
      } else {
        setAppointmentsLoading(true);
        const response = await getOrganizationAppointmentsByDate({
          organizationId,
          selectedDate: dateObject,
          staffId: selectedStaffId,
          timeZone: businessTimeZone,
        });
        data = response.data;
        error = response.error;
      }

      if (error) {
        toast.error('No se pudo cargar la agenda');
        setAppointments([]);
      } else {
        setAppointments(data || []);
      }

      setAppointmentsLoading(false);
    };

    loadAppointments();
  }, [
    organizationId,
    selectedDate,
    selectedStaffId,
    businessTimeZone,
    viewMode,
    calendarRefreshTick,
  ]);

  useEffect(() => {
    if (!selectedStaffId) {
      onAppointmentsCountChange?.(0);
      return;
    }

    if (viewMode === 'week') {
      const selectedCount = appointments.filter(
        (appointment) => localDateKeyFromIso(appointment.start_time, businessTimeZone) === selectedDateKey
      ).length;
      onAppointmentsCountChange?.(selectedCount);
      return;
    }

    onAppointmentsCountChange?.(appointments.length);
  }, [
    appointments,
    viewMode,
    selectedStaffId,
    selectedDateKey,
    businessTimeZone,
    onAppointmentsCountChange,
  ]);

  const selectedStaff = useMemo(
    () => staffList.find((employee) => employee.id === selectedStaffId) || null,
    [staffList, selectedStaffId]
  );

  const selectedDateObject = useMemo(() => parseDateInput(selectedDate), [selectedDate]);
  const selectedDayLabel = useMemo(
    () => formatSelectedDayLabel(selectedDateObject, businessTimeZone),
    [selectedDateObject, businessTimeZone]
  );

  const weekStart = useMemo(() => getWeekStart(selectedDateObject), [selectedDateObject]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    }),
    [weekStart]
  );
  const weekDayKeys = useMemo(
    () => weekDays.map((day) => formatDateInputValue(day)),
    [weekDays]
  );

  const appointmentsByDay = useMemo(() => {
    const bucket = new Map();
    for (const day of weekDays) {
      bucket.set(formatDateInputValue(day), []);
    }
    for (const appointment of appointments) {
      const key = localDateKeyFromIso(appointment.start_time, businessTimeZone);
      if (!bucket.has(key)) bucket.set(key, []);
      bucket.get(key).push(appointment);
    }
    return bucket;
  }, [appointments, businessTimeZone, weekDays]);

  useEffect(() => {
    if (!selectedStaffId) {
      setSlotsSummary({ freeCount: 0, reservedCount: 0, totalCount: 0 });
    }
  }, [selectedStaffId]);

  const handleToday = () => setSelectedDate(formatDateInputValue(new Date()));
  const handlePrev = () => setSelectedDate((prev) => shiftDateInput(prev, viewMode === 'week' ? -7 : -1));
  const handleNext = () => setSelectedDate((prev) => shiftDateInput(prev, viewMode === 'week' ? 7 : 1));

  const handleAppointmentEvent = useCallback((appointmentEvent) => {
    if (!appointmentEvent?.id) {
      setCalendarRefreshTick((prev) => prev + 1);
      return;
    }

    if (appointmentEvent.status === 'canceled' && selectedAppointment?.id === appointmentEvent.id) {
      setSelectedAppointment(null);
    }

    const isVisibleInCurrentView = (() => {
      if (!appointmentEvent?.start_time || appointmentEvent.staff_id !== selectedStaffId) return false;
      const appointmentDayKey = localDateKeyFromIso(appointmentEvent.start_time, businessTimeZone);
      if (viewMode === 'week') return weekDayKeys.includes(appointmentDayKey);
      return appointmentDayKey === selectedDate;
    })();

    setAppointments((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];

      if (appointmentEvent.status === 'canceled' || !isVisibleInCurrentView) {
        return safePrev.filter((appointment) => appointment.id !== appointmentEvent.id);
      }

      const existingIndex = safePrev.findIndex((appointment) => appointment.id === appointmentEvent.id);
      if (existingIndex >= 0) {
        const next = [...safePrev];
        next[existingIndex] = { ...next[existingIndex], ...appointmentEvent };
        return next.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      }

      return [...safePrev, appointmentEvent].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });

    setCalendarRefreshTick((prev) => prev + 1);
  }, [
    selectedAppointment,
    selectedStaffId,
    businessTimeZone,
    viewMode,
    weekDayKeys,
    selectedDate,
  ]);

  useEffect(() => {
    const visibleReservedCount = appointments.length;
    onMetricsChange?.({
      freeSlots: slotsSummary.freeCount,
      reservedSlots: visibleReservedCount,
      revenue: visibleReservedCount * servicePrice,
    });
  }, [slotsSummary.freeCount, appointments.length, servicePrice, onMetricsChange]);

  const goCurrentLabel = viewMode === 'week' ? 'Ir a semana actual' : 'Ir a dia actual';
  const goCurrentTitle = viewMode === 'week' ? 'Ir a la semana actual' : 'Ir al dia actual';

  return (
    <section className="mt-8 bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 transition-colors duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Calendario de Sucursal
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            {organizationName} | {appointments.length} turnos
          </p>
          <p className="text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-widest mt-1">
            Dia seleccionado: {selectedDayLabel}
          </p>
        </div>

        <div className="flex w-full lg:w-auto flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vista</span>
            <div className="inline-flex items-center bg-slate-200 dark:bg-white/5 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  viewMode === 'day'
                    ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/10'
                }`}
              >
                Dia
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  viewMode === 'week'
                    ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/10'
                }`}
              >
                Semana
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Navegacion</span>
            <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg p-1">
              <button
                type="button"
                onClick={handlePrev}
                className="cursor-pointer p-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="cursor-pointer px-2 py-1 text-xs font-bold rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                title={goCurrentTitle}
              >
                {goCurrentLabel}
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="cursor-pointer p-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fecha</span>
            <label
              className="inline-flex items-center rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#181824] px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#202033] hover:border-cyan-400/50 focus-within:ring-2 focus-within:ring-cyan-500 transition-colors"
              onClick={() => {
                const input = dateInputRef.current;
                if (!input) return;
                if (typeof input.showPicker === 'function') {
                  input.showPicker();
                } else {
                  input.focus();
                }
              }}
            >
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="cursor-pointer w-full bg-transparent border-0 p-0 text-slate-900 dark:text-white focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Empleado</span>
            <select
              value={selectedStaffId}
              onChange={(event) => setSelectedStaffId(event.target.value)}
              className="cursor-pointer bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-[#202033] hover:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            >
              {staffList.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {staffLoading || appointmentsLoading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-semibold">Cargando calendario...</span>
        </div>
      ) : !selectedStaffId ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 py-8 px-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Primero agrega al menos un empleado y configúrale horarios disponibles para poder reservar turnos.
        </div>
      ) : viewMode === 'week' ? (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-3 min-w-[980px]">
            {weekDays.map((day) => {
              const key = formatDateInputValue(day);
              const dayAppointments = appointmentsByDay.get(key) || [];
              const isSelectedDay = key === selectedDate;
              const selectDayInWeek = () => {
                setSelectedDate(key);
              };
              return (
                <div
                  key={key}
                  className={`rounded-xl border bg-slate-50 dark:bg-white/[0.02] p-3 transition-colors ${
                    isSelectedDay
                      ? 'border-cyan-500/70'
                      : 'border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div className="mb-3 w-full text-left rounded-lg px-2 py-1.5 transition-colors">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {formatWeekdayLabel(day, businessTimeZone)}
                    </p>
                    <p className="text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-300 font-bold mt-1">
                      {formatAppointmentDate(day.toISOString(), businessTimeZone)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] py-5 px-2 text-center">
                    <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                      {dayAppointments.length}
                    </p>
                    <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mt-2">
                      turnos del dia
                    </p>
                    <button
                      type="button"
                      onClick={selectDayInWeek}
                      className="cursor-pointer mt-3 px-2.5 py-1.5 text-[11px] font-bold rounded-md bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
                    >
                      Ver dia
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {selectedStaffId ? (
          <AvailableSlots
            organizationId={organizationId}
            staffId={selectedStaffId}
            staffName={selectedStaff?.name || 'Empleado'}
            serviceDuration={30}
            businessTimeZone={businessTimeZone}
            selectedDateValue={selectedDate}
            hideDateSelector
            refreshKey={schedulesRefreshKey + calendarRefreshTick}
            onBookingCreated={handleAppointmentEvent}
            onSlotsSummaryChange={setSlotsSummary}
            onOccupiedSlotClick={(appointmentId) => {
              const found = appointments.find((appointment) => appointment.id === appointmentId);
              if (found) setSelectedAppointment(found);
            }}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 py-8 px-4 text-center text-sm text-slate-600 dark:text-slate-400">
            Primero agrega al menos un empleado y configúrale horarios disponibles para poder reservar turnos.
          </div>
        )}
      </div>

      <AppointmentModal
        isOpen={Boolean(selectedAppointment)}
        appointment={selectedAppointment}
        staffOptions={staffList}
        timeZone={businessTimeZone}
        onClose={() => setSelectedAppointment(null)}
        onSuccess={handleAppointmentEvent}
      />
    </section>
  );
}
