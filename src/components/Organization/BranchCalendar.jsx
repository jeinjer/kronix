import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Loader2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { getOrganizationStaff } from '@/supabase/services/staff';
import {
  formatAppointmentTime,
  formatDateInputValue,
  getOrganizationAppointmentsByDate,
  getOrganizationAppointmentsByDateRange,
} from '@/supabase/services/appointments';
import AvailableSlots from '@/components/Organization/AvailableSlots';
import AppointmentModal from '@/components/Organization/AppointmentModal';

const STATUS_STYLES = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  confirmed: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
  completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  canceled: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  canceled: 'Cancelado',
  occupied: 'Ocupado',
  free: 'Libre',
};

const getStatusLabel = (statusValue) => {
  const normalized = String(statusValue || '').toLowerCase();
  return STATUS_LABELS[normalized] || 'Ocupado';
};

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
    day: '2-digit',
    month: '2-digit',
  }).format(date);

const formatReservedDateLabel = (isoString, timeZone) =>
  new Intl.DateTimeFormat('es-AR', {
    timeZone,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(isoString));

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
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatDateInputValue(new Date()));
  const [staffFilter, setStaffFilter] = useState('all');
  const [viewMode, setViewMode] = useState('day');
  const [calendarRefreshTick, setCalendarRefreshTick] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [slotsSummary, setSlotsSummary] = useState({
    freeCount: 0,
    reservedCount: 0,
    totalCount: 0,
  });

  useEffect(() => {
    const loadStaff = async () => {
      if (!organizationId) return;
      setStaffLoading(true);
      const { data, error } = await getOrganizationStaff(organizationId);
      if (error) {
        toast.error('No se pudo cargar el personal');
        setStaffList([]);
      } else {
        const activeStaff = (data || []).filter((employee) => employee.is_active);
        setStaffList(activeStaff);
        if (!activeStaff.length) {
          setStaffFilter('all');
        } else if (staffFilter !== 'all' && !activeStaff.some((employee) => employee.id === staffFilter)) {
          setStaffFilter('all');
        }
      }
      setStaffLoading(false);
    };

    loadStaff();
  }, [organizationId, staffRefreshKey]);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!organizationId) return;
      setAppointmentsLoading(true);

      const dateObject = new Date(`${selectedDate}T00:00:00`);
      let data = [];
      let error = null;

      if (viewMode === 'week') {
        const weekStart = getWeekStart(dateObject);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const response = await getOrganizationAppointmentsByDateRange({
          organizationId,
          fromDate: weekStart,
          toDate: weekEnd,
          staffId: staffFilter === 'all' ? null : staffFilter,
          timeZone: businessTimeZone,
        });
        data = response.data;
        error = response.error;
      } else {
        const response = await getOrganizationAppointmentsByDate({
          organizationId,
          selectedDate: dateObject,
          staffId: staffFilter === 'all' ? null : staffFilter,
          timeZone: businessTimeZone,
        });
        data = response.data;
        error = response.error;
      }

      if (error) {
        toast.error('No se pudo cargar la agenda');
        setAppointments([]);
        onAppointmentsCountChange?.(0);
      } else {
        setAppointments(data || []);
        if (viewMode === 'week') {
          const selectedKey = localDateKeyFromIso(dateObject.toISOString(), businessTimeZone);
          const selectedCount = (data || []).filter(
            (appointment) => localDateKeyFromIso(appointment.start_time, businessTimeZone) === selectedKey
          ).length;
          onAppointmentsCountChange?.(selectedCount);
        } else {
          onAppointmentsCountChange?.((data || []).length);
        }
      }

      setAppointmentsLoading(false);
    };

    loadAppointments();
  }, [
    organizationId,
    selectedDate,
    staffFilter,
    businessTimeZone,
    onAppointmentsCountChange,
    viewMode,
    calendarRefreshTick,
  ]);

  const staffById = useMemo(
    () => new Map(staffList.map((employee) => [employee.id, employee])),
    [staffList]
  );

  const selectedDateObject = useMemo(() => parseDateInput(selectedDate), [selectedDate]);
  const weekStart = useMemo(() => getWeekStart(selectedDateObject), [selectedDateObject]);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    });
  }, [weekStart]);

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

  const slotStaffId = staffFilter === 'all' ? (staffList[0]?.id || '') : staffFilter;
  useEffect(() => {
    if (!slotStaffId) {
      setSlotsSummary({ freeCount: 0, reservedCount: 0, totalCount: 0 });
    }
  }, [slotStaffId]);

  const handleToday = () => setSelectedDate(formatDateInputValue(new Date()));
  const handlePrev = () => setSelectedDate((prev) => shiftDateInput(prev, viewMode === 'week' ? -7 : -1));
  const handleNext = () => setSelectedDate((prev) => shiftDateInput(prev, viewMode === 'week' ? 7 : 1));

  useEffect(() => {
    const visibleReservedCount = appointments.length;
    onMetricsChange?.({
      freeSlots: slotsSummary.freeCount,
      reservedSlots: visibleReservedCount,
      revenue: visibleReservedCount * servicePrice,
    });
  }, [slotsSummary.freeCount, appointments.length, servicePrice, onMetricsChange]);

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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-slate-200 dark:bg-white/5 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                viewMode === 'day'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/10'
              }`}
            >
              Dia
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/10'
              }`}
            >
              Semana
            </button>
          </div>

          <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg p-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2 py-1 text-xs font-bold rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <CalendarDays size={15} className="text-cyan-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </label>

          <select
            value={staffFilter}
            onChange={(event) => setStaffFilter(event.target.value)}
            className="bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Todo el staff</option>
            {staffList.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {staffLoading || appointmentsLoading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-semibold">Cargando calendario...</span>
        </div>
      ) : viewMode === 'week' ? (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-3 min-w-[980px]">
            {weekDays.map((day) => {
              const key = formatDateInputValue(day);
              const dayAppointments = appointmentsByDay.get(key) || [];
              const isSelectedDay = key === selectedDate;
              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedDate(key);
                    setViewMode('day');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedDate(key);
                      setViewMode('day');
                    }
                  }}
                  className={`rounded-xl border bg-slate-50 dark:bg-white/[0.02] p-3 transition-colors ${
                    isSelectedDay
                      ? 'border-cyan-500/70 cursor-pointer'
                      : 'border-slate-200 dark:border-white/10 cursor-pointer hover:border-cyan-500/40'
                  }`}
                >
                  <div className="mb-3 w-full text-left rounded-lg px-2 py-1.5 hover:bg-slate-200/60 dark:hover:bg-white/5 transition-colors">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {formatWeekdayLabel(day, businessTimeZone)}
                    </p>
                    <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mt-1">
                      {dayAppointments.length} turnos
                    </p>
                  </div>

                  {dayAppointments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/10 py-5 px-2 text-center text-xs text-slate-500">
                      Sin turnos
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayAppointments.map((appointment) => {
                        const staff = staffById.get(appointment.staff_id);
                        const status = String(appointment.status || 'pending').toLowerCase();
                        return (
                          <article
                            key={appointment.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedAppointment(appointment);
                            }}
                            className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-2.5"
                          >
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {appointment.client_name}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {formatAppointmentTime(appointment.start_time, businessTimeZone)} -{' '}
                              {formatAppointmentTime(appointment.end_time, businessTimeZone)}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {staff?.name || 'Sin staff'}
                            </p>
                            <span
                              className={`mt-1.5 inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ${
                                STATUS_STYLES[status] || 'bg-slate-400/20 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {getStatusLabel(status)}
                            </span>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {slotStaffId ? (
          <AvailableSlots
            organizationId={organizationId}
            staffId={slotStaffId}
            serviceDuration={30}
            businessTimeZone={businessTimeZone}
            selectedDateValue={selectedDate}
            hideDateSelector
            refreshKey={schedulesRefreshKey + calendarRefreshTick}
            onBookingCreated={() => setCalendarRefreshTick((prev) => prev + 1)}
            onSlotsSummaryChange={setSlotsSummary}
            onOccupiedSlotClick={(appointmentId) => {
              const found = appointments.find((appointment) => appointment.id === appointmentId);
              if (found) setSelectedAppointment(found);
            }}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 py-8 px-4 text-center text-sm text-slate-600 dark:text-slate-400">
            Carga al menos un empleado activo para visualizar slots disponibles.
          </div>
        )}
      </div>

      <AppointmentModal
        isOpen={Boolean(selectedAppointment)}
        appointment={selectedAppointment}
        staffOptions={staffList}
        timeZone={businessTimeZone}
        onClose={() => setSelectedAppointment(null)}
        onSuccess={() => setCalendarRefreshTick((prev) => prev + 1)}
      />
    </section>
  );
}
