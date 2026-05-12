import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getOrganizationStaff } from "@/supabase/services/staff";
import {
  formatAppointmentDate,
  formatDateInputValue,
  getOrganizationAppointmentsByDate,
  getOrganizationAppointmentsByDateRange,
} from "@/supabase/services/appointments";
import AvailableSlots from "@/components/Organization/AvailableSlots";
import AppointmentModal from "@/components/Organization/AppointmentModal";

const parseDateInput = (value) => {
  const [year, month, day] = value.split("-").map(Number);
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
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date(isoString))
    .reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
};

const formatWeekdayLabel = (date, timeZone) =>
  new Intl.DateTimeFormat("es-AR", {
    timeZone,
    weekday: "short",
  }).format(date);

const formatSelectedDayLabel = (date, timeZone) =>
  `${new Intl.DateTimeFormat("es-AR", { timeZone, weekday: "long" }).format(date)} ${formatAppointmentDate(
    date.toISOString(),
    timeZone,
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
  const lastWeekFetchKeyRef = useRef("");
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    formatDateInputValue(new Date()),
  );
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [viewMode, setViewMode] = useState("day");
  const [calendarRefreshTick, setCalendarRefreshTick] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [slotsSummary, setSlotsSummary] = useState({
    freeCount: 0,
    reservedCount: 0,
    totalCount: 0,
  });

  const selectedDateKey = useMemo(
    () =>
      localDateKeyFromIso(
        new Date(`${selectedDate}T00:00:00`).toISOString(),
        businessTimeZone,
      ),
    [selectedDate, businessTimeZone],
  );

  useEffect(() => {
    const loadStaff = async () => {
      if (!organizationId) return;
      setStaffLoading(true);
      const { data, error } = await getOrganizationStaff(organizationId);

      if (error) {
        toast.error("No se pudo cargar el personal");
        setStaffList([]);
        setSelectedStaffId("");
        setStaffLoading(false);
        return;
      }

      const activeStaff = (data || []).filter((employee) => employee.is_active);
      setStaffList(activeStaff);
      setSelectedStaffId((prev) => {
        if (!activeStaff.length) return "";
        if (prev && activeStaff.some((employee) => employee.id === prev))
          return prev;
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

      if (viewMode === "week") {
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
        toast.error("No se pudo cargar la agenda");
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

    if (viewMode === "week") {
      const selectedCount = appointments.filter(
        (appointment) =>
          localDateKeyFromIso(appointment.start_time, businessTimeZone) ===
          selectedDateKey,
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
    [staffList, selectedStaffId],
  );

  const selectedDateObject = useMemo(
    () => parseDateInput(selectedDate),
    [selectedDate],
  );
  const selectedDayLabel = useMemo(
    () => formatSelectedDayLabel(selectedDateObject, businessTimeZone),
    [selectedDateObject, businessTimeZone],
  );

  const weekStart = useMemo(
    () => getWeekStart(selectedDateObject),
    [selectedDateObject],
  );
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date;
      }),
    [weekStart],
  );
  const weekDayKeys = useMemo(
    () => weekDays.map((day) => formatDateInputValue(day)),
    [weekDays],
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
  const handlePrev = () =>
    setSelectedDate((prev) =>
      shiftDateInput(prev, viewMode === "week" ? -7 : -1),
    );
  const handleNext = () =>
    setSelectedDate((prev) =>
      shiftDateInput(prev, viewMode === "week" ? 7 : 1),
    );

  const handleAppointmentEvent = useCallback(
    (appointmentEvent) => {
      if (!appointmentEvent?.id) {
        setCalendarRefreshTick((prev) => prev + 1);
        return;
      }

      if (
        appointmentEvent.status === "canceled" &&
        selectedAppointment?.id === appointmentEvent.id
      ) {
        setSelectedAppointment(null);
      }

      const isVisibleInCurrentView = (() => {
        if (
          !appointmentEvent?.start_time ||
          appointmentEvent.staff_id !== selectedStaffId
        )
          return false;
        const appointmentDayKey = localDateKeyFromIso(
          appointmentEvent.start_time,
          businessTimeZone,
        );
        if (viewMode === "week") return weekDayKeys.includes(appointmentDayKey);
        return appointmentDayKey === selectedDate;
      })();

      setAppointments((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];

        if (appointmentEvent.status === "canceled" || !isVisibleInCurrentView) {
          return safePrev.filter(
            (appointment) => appointment.id !== appointmentEvent.id,
          );
        }

        const existingIndex = safePrev.findIndex(
          (appointment) => appointment.id === appointmentEvent.id,
        );
        if (existingIndex >= 0) {
          const next = [...safePrev];
          next[existingIndex] = { ...next[existingIndex], ...appointmentEvent };
          return next.sort(
            (a, b) =>
              new Date(a.start_time).getTime() -
              new Date(b.start_time).getTime(),
          );
        }

        return [...safePrev, appointmentEvent].sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        );
      });

      setCalendarRefreshTick((prev) => prev + 1);
    },
    [
      selectedAppointment,
      selectedStaffId,
      businessTimeZone,
      viewMode,
      weekDayKeys,
      selectedDate,
    ],
  );

  useEffect(() => {
    const visibleReservedCount = appointments.length;
    onMetricsChange?.({
      freeSlots: slotsSummary.freeCount,
      reservedSlots: visibleReservedCount,
      revenue: visibleReservedCount * servicePrice,
    });
  }, [
    slotsSummary.freeCount,
    appointments.length,
    servicePrice,
    onMetricsChange,
  ]);

  const goCurrentLabel =
    viewMode === "week" ? "Ir a semana actual" : "Ir a dia actual";
  const goCurrentTitle =
    viewMode === "week" ? "Ir a la semana actual" : "Ir al dia actual";

  return (
    <div className="space-y-8 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif] pb-10">
      <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6 relative">
        <div className="absolute -top-4 -left-4 bg-yellow-400 border-2 border-slate-900 px-4 py-2 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_0_#0f172a] -rotate-2">
          Gestor de Turnos
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 mt-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              Calendario de Sucursal
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              {organizationName} | <span className="bg-slate-900 text-white px-2 py-0.5">{appointments.length} turnos</span>
            </p>
            <p className="text-cyan-700 text-xs font-bold uppercase tracking-widest mt-2 border-l-4 border-cyan-400 pl-2">
              Día seleccionado: {selectedDayLabel}
            </p>
          </div>

          <div className="flex w-full lg:w-auto flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-cyan-400 px-2 py-0.5 border-2 border-slate-900 w-fit">
                Vista
              </span>
              <div className="inline-flex items-center border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a] bg-slate-50">
                <button
                  type="button"
                  onClick={() => setViewMode("day")}
                  className={`cursor-pointer px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                    viewMode === "day"
                      ? "bg-slate-900 text-white"
                      : "text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  Día
                </button>
                <div className="w-1 h-full bg-slate-900"></div>
                <button
                  type="button"
                  onClick={() => setViewMode("week")}
                  className={`cursor-pointer px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                    viewMode === "week"
                      ? "bg-slate-900 text-white"
                      : "text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  Semana
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-white px-2 py-0.5 border-2 border-slate-900 w-fit">
                Navegación
              </span>
              <div className="inline-flex items-center gap-0 border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a] bg-slate-50 h-[38px]">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="cursor-pointer h-full px-3 text-slate-900 hover:bg-slate-200 border-r-4 border-slate-900"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="cursor-pointer h-full px-4 text-xs font-black uppercase tracking-widest text-slate-900 hover:bg-slate-200 border-r-4 border-slate-900"
                  title={goCurrentTitle}
                >
                  {goCurrentLabel === "Ir a dia actual" || goCurrentLabel === "Ir a día actual" ? "Hoy" : "Esta Sem"}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="cursor-pointer h-full px-3 text-slate-900 hover:bg-slate-200"
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 relative">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-rose-400 px-2 py-0.5 border-2 border-slate-900 w-fit">
                Fecha
              </span>
              <div className="relative border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a] bg-white h-[38px] flex items-center px-3 hover:bg-slate-100 cursor-pointer">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="cursor-pointer w-full bg-transparent border-0 p-0 text-slate-900 font-bold uppercase text-xs focus:outline-none"
                  style={{ WebkitAppearance: 'none' }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-yellow-400 px-2 py-0.5 border-2 border-slate-900 w-fit">
                Empleado
              </span>
              <div className="relative border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a] bg-white h-[38px] flex items-center px-3 hover:bg-slate-100">
                <select
                  value={selectedStaffId}
                  onChange={(event) => setSelectedStaffId(event.target.value)}
                  className="cursor-pointer w-full bg-transparent border-0 p-0 text-slate-900 font-bold uppercase text-xs focus:outline-none appearance-none pr-6"
                >
                  {staffList.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 pointer-events-none">
                  <ChevronRight size={12} strokeWidth={3} className="rotate-90 text-slate-900" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {staffLoading || appointmentsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 border-4 border-dashed border-slate-300 bg-slate-50">
            <Loader2 size={32} className="animate-spin text-slate-900" strokeWidth={3} />
            <span className="text-sm font-black uppercase tracking-widest text-slate-900">
              Sincronizando agenda...
            </span>
          </div>
        ) : !selectedStaffId ? (
          <div className="border-4 border-dashed border-slate-900 bg-slate-50 p-12 text-center">
            <p className="font-black uppercase tracking-widest text-slate-900">
              No hay empleados disponibles.
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
              Agrega uno primero desde la sección Empleados.
            </p>
          </div>
        ) : viewMode === "week" ? (
          <div className="overflow-x-auto border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] bg-slate-50 p-6">
            <div className="grid grid-cols-7 gap-4 min-w-[1000px]">
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
                    className={`border-4 p-4 transition-all ${
                      isSelectedDay
                        ? "border-cyan-400 bg-white shadow-[2px_2px_0_0_#22d3ee] -translate-y-1"
                        : "border-slate-900 bg-white hover:border-cyan-400 hover:shadow-[2px_2px_0_0_#22d3ee] hover:-translate-y-1"
                    }`}
                  >
                    <div className="mb-4 w-full text-left">
                      <p className="text-sm font-black uppercase tracking-tighter text-slate-900">
                        {formatWeekdayLabel(day, businessTimeZone)}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1 bg-slate-100 px-2 py-0.5 inline-block border-2 border-slate-900">
                        {formatAppointmentDate(day.toISOString(), businessTimeZone)}
                      </p>
                    </div>

                    <div className="border-4 border-slate-900 bg-yellow-400 py-6 px-2 text-center">
                      <p className="text-3xl font-black text-slate-900 leading-none">
                        {dayAppointments.length}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-slate-900 font-black mt-2 bg-white border-2 border-slate-900 px-1 py-0.5 mx-auto w-fit shadow-[2px_2px_0_0_#0f172a]">
                        Turnos
                      </p>
                      <button
                        type="button"
                        onClick={selectDayInWeek}
                        className="cursor-pointer mt-4 px-3 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-slate-900 bg-white text-slate-900 hover:bg-cyan-400 transition-all shadow-[2px_2px_0_0_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                      >
                        Ver Día
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-8 border-t-4 border-slate-900 pt-8">
          {selectedStaffId ? (
            <AvailableSlots
              organizationId={organizationId}
              staffId={selectedStaffId}
              staffName={selectedStaff?.name || "Empleado"}
              serviceDuration={30}
              businessTimeZone={businessTimeZone}
              selectedDateValue={selectedDate}
              hideDateSelector
              refreshKey={schedulesRefreshKey + calendarRefreshTick}
              onBookingCreated={handleAppointmentEvent}
              onSlotsSummaryChange={setSlotsSummary}
              onOccupiedSlotClick={(appointmentId) => {
                const found = appointments.find(
                  (appointment) => appointment.id === appointmentId,
                );
                if (found) setSelectedAppointment(found);
              }}
            />
          ) : null}
        </div>

        <AppointmentModal
          isOpen={Boolean(selectedAppointment)}
          appointment={selectedAppointment}
          staffOptions={staffList}
          timeZone={businessTimeZone}
          onClose={() => setSelectedAppointment(null)}
          onSuccess={handleAppointmentEvent}
        />
      </div>
    </div>
  );
}
