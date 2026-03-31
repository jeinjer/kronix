import React, { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Eye,
  Loader2,
  Pencil,
  Plus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  cancelAppointment,
  createAppointment,
} from "@/supabase/services/appointments";
import { getStaffAvailableSlots } from "@/supabase/services/availability";
import { getStaffSchedules } from "@/supabase/services/schedules";
import { supabase } from "@/supabase/supabaseClient";
import DatePicker from "@/components/ui/DatePicker";
import { useAuth } from "@/context/AuthContext";

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseInputDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatInputDateToDisplay = (value) => {
  if (!value) return "--/--/----";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return "--/--/----";
  return `${day}/${month}/${year}`;
};

const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;
const isPastSlot = (slot) =>
  new Date(slot?.startUtc || "").getTime() <= Date.now();

const iconButtonClass =
  "cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300/60 dark:border-white/15 bg-white/80 dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 transition-colors";

const getSlotStatusLabel = (slot) => {
  const occupied = Boolean(slot?.appointmentId);
  const past = isPastSlot(slot);
  if (past && occupied) return "Pasado";
  if (past && !occupied) return "Vencido";
  return occupied ? "Ocupado" : "Libre";
};

export default function AvailableSlots({
  organizationId,
  staffId,
  staffName = "Empleado",
  serviceDuration = 30,
  businessTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  selectedDateValue,
  onDateChange,
  hideDateSelector = false,
  onBookingCreated,
  onSlotsSummaryChange,
  refreshKey = 0,
  onOccupiedSlotClick,
  isPublicMode = false,
}) {
  const { user } = useAuth();
  const [internalDate, setInternalDate] = useState(toInputDate(new Date()));
  const [loadedDate, setLoadedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [autoForwardCount, setAutoForwardCount] = useState(0);
  const [staffWorkingDays, setStaffWorkingDays] = useState(null);
  
  const [hasManuallyInteracted, setHasManuallyInteracted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const currentReqDate = React.useRef(toInputDate(new Date()));

  const [availableDaysInMonth, setAvailableDaysInMonth] = useState(null);
  const [isMonthLoading, setIsMonthLoading] = useState(false);
  const [schedulesCache, setSchedulesCache] = useState([]);

  useEffect(() => {
    setAutoForwardCount(0);
    setHasManuallyInteracted(false);
    setIsInitializing(true);
    setInternalDate(toInputDate(new Date()));
    
    // Check general schedules immediately
    getStaffSchedules(staffId).then(({ data }) => {
      if (!data || data.length === 0) {
        setStaffWorkingDays([]);
        setSchedulesCache([]);
      } else {
        const activeDays = [...new Set(data.map(s => s.day_of_week))];
        setStaffWorkingDays(activeDays);
        setSchedulesCache(data);
      }
    });
  }, [staffId]);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelSlot, setCancelSlot] = useState(null);
  const [canceling, setCanceling] = useState(false);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewSlot, setViewSlot] = useState(null);

  const selectedDate = selectedDateValue || internalDate;
  
  useEffect(() => {
    currentReqDate.current = selectedDate;
  }, [selectedDate]);

  const emitSlotsSummary = useCallback(
    (nextSlots) => {
      const safeSlots = Array.isArray(nextSlots) ? nextSlots : [];
      const freeCount = safeSlots.filter((slot) => slot.isAvailable).length;
      const reservedCount = safeSlots.length - freeCount;
      onSlotsSummaryChange?.({
        freeCount,
        reservedCount,
        totalCount: safeSlots.length,
      });
    },
    [onSlotsSummaryChange],
  );

  const handleMonthChange = async (year, month) => {
    if (!isPublicMode) return; // Only filter days in public mode
    if (staffWorkingDays && staffWorkingDays.length === 0) {
      setAvailableDaysInMonth([]);
      return;
    }

    setIsMonthLoading(true);

    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
    
    // Fetch this month's appointments
    const { data: appts } = await supabase
      .from("appointments")
      .select("start_time")
      .eq("staff_id", staffId)
      .is("deleted_at", null)
      .neq("status", "canceled")
      .gte("start_time", firstDay.toISOString())
      .lte("start_time", lastDay.toISOString());

    // Calculate capacity per day
    const capacityMap = {}; 
    schedulesCache.forEach(sch => {
       const start = new Date(`1970-01-01T${sch.start_time}Z`);
       const end = new Date(`1970-01-01T${sch.end_time}Z`);
       const maxSlots = Math.floor(((end - start) / 60000) / serviceDuration);
       capacityMap[sch.day_of_week] = (capacityMap[sch.day_of_week] || 0) + maxSlots;
    });

    // Count busy slots
    const dayCounts = {}; 
    (appts || []).forEach(a => {
       const d = new Date(a.start_time);
       const day = d.getDate();
       dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const validDays = [];
    const daysInMonth = lastDay.getUTCDate();
    const today = new Date();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      
      const isPastDay = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (isPastDay) {
        continue;
      }

      const dayOfWeek = dateObj.getDay();
      if (!staffWorkingDays?.includes(dayOfWeek)) {
        continue;
      }

      // Check if today is completely expired due to hours passing
      const isTodayExact = dateObj.toDateString() === today.toDateString();
      if (isTodayExact) {
        const activeSchedules = schedulesCache.filter(sch => sch.day_of_week === dayOfWeek);
        if (activeSchedules.length > 0) {
          const maxEndTime = activeSchedules.reduce((max, sch) => sch.end_time > max ? sch.end_time : max, "00:00:00");
          const nowStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:00`;
          if (nowStr > maxEndTime) {
            continue; // Today's working hours have completely elapsed
          }
        }
      }

      const capacity = capacityMap[dayOfWeek] || 0;
      const booked = dayCounts[d] || 0;
      
      if (booked < capacity) {
        validDays.push(d);
      }
    }

    setAvailableDaysInMonth(validDays);
    setIsMonthLoading(false);
  };

  const loadSlots = useCallback(async () => {
    if (staffWorkingDays && staffWorkingDays.length === 0) {
      setSlots([]);
      setLoadedDate(selectedDate);
      return;
    }

    if (!staffId) {
      setSlots([]);
      setErrorMessage(
        "Debes tener al menos un empleado activo con horarios para reservar turnos.",
      );
      emitSlotsSummary([]);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const dateObject = parseInputDate(selectedDate);
    const { data, error } = await getStaffAvailableSlots({
      staffId,
      selectedDate: dateObject,
      serviceDuration,
      timeZone: businessTimeZone,
    });

    if (selectedDate !== currentReqDate.current) {
      return; // User clicked another date while this was loading. Abort state update.
    }

    if (error) {
      setSlots([]);
      setErrorMessage(error.message || "No se pudieron obtener los horarios.");
      emitSlotsSummary([]);
    } else {
      const safeSlots = (data || []).map((slot) => ({
        ...slot,
          staffName,
        }));
        setSlots(safeSlots);
        setLoadedDate(selectedDate);
        emitSlotsSummary(safeSlots);
      }
  
      setLoading(false);
    }, [
    staffId,
    selectedDate,
    serviceDuration,
    businessTimeZone,
    staffName,
    emitSlotsSummary,
    staffWorkingDays,
  ]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots, refreshKey]);

  useEffect(() => {
    if (!loading && isPublicMode && !hasManuallyInteracted && autoForwardCount < 21 && loadedDate === internalDate && staffWorkingDays && staffWorkingDays.length > 0) {
      const hasAvailable = slots.some(s => s.isAvailable && !isPastSlot(s));
      if (!hasAvailable) {
        const current = parseInputDate(internalDate);
        
        let daysToAdd = 1;
        while (daysToAdd <= 30) {
          const testDate = new Date(current.getTime());
          testDate.setDate(testDate.getDate() + daysToAdd);
          if (staffWorkingDays.includes(testDate.getDay())) {
            break;
          }
          daysToAdd++;
        }

        current.setDate(current.getDate() + daysToAdd);
        setInternalDate(toInputDate(current));
        setAutoForwardCount(prev => prev + 1);
      } else {
        setAutoForwardCount(21);
        setIsInitializing(false);
      }
    } else if (!loading && loadedDate === internalDate) {
      // If we are fully loaded but aren't auto-forwarding
      setIsInitializing(false);
    }
  }, [slots, loading, isPublicMode, internalDate, autoForwardCount, loadedDate, staffWorkingDays, hasManuallyInteracted]);

  const handleDateChange = (nextDate) => {
    setHasManuallyInteracted(true);
    if (selectedDateValue && onDateChange) {
      onDateChange(nextDate);
      return;
    }
    setInternalDate(nextDate);
  };

  const openBookingModal = (slot) => {
    setBookingSlot(slot);
    setClientName("");
    setClientPhone("");
    setBookingModalOpen(true);
  };

  const submitBooking = async () => {
    if (isBooking || !bookingSlot || !organizationId || !staffId) return;

    if (!clientName.trim()) {
      toast.error("Ingresa el nombre del cliente.");
      return;
    }
    if (clientPhone.trim() && !PHONE_REGEX.test(clientPhone.trim())) {
      toast.error("Telefono invalido. Usa solo numeros y simbolos comunes.");
      return;
    }

    setIsBooking(true);

    const { data, error } = await createAppointment({
      organizationId,
      staffId,
      startTime: bookingSlot.startUtc,
      endTime: bookingSlot.endUtc,
      clientName,
      clientPhone,
      clientEmail: user?.email || null,
    });

    if (error) {
      if (error.code === "23P01") {
        toast.error(
          "Lo sentimos, alguien acaba de reservar este horario hace un instante.",
        );
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("No se pudo completar la reserva. Intenta nuevamente.");
      }
      setIsBooking(false);
      await loadSlots();
      return;
    }

    toast.success("Reserva creada correctamente.");
    setBookingModalOpen(false);
    setBookingSlot(null);
    setIsBooking(false);
    await loadSlots();
    onBookingCreated?.(data);
  };

  const openCancelModal = (slot) => {
    setCancelSlot(slot);
    setCancelModalOpen(true);
  };

  const submitCancel = async () => {
    if (canceling || !cancelSlot?.appointmentId) return;

    setCanceling(true);
    const { error } = await cancelAppointment({
      appointmentId: cancelSlot.appointmentId,
    });

    if (error) {
      toast.error(error?.message || "No se pudo cancelar el turno.");
      setCanceling(false);
      return;
    }

    toast.success("Turno cancelado.");
    setCanceling(false);
    setCancelModalOpen(false);
    setCancelSlot(null);
    await loadSlots();
    onBookingCreated?.({ id: cancelSlot.appointmentId, status: "canceled" });
  };

  const openViewModal = (slot) => {
    setViewSlot(slot);
    setViewModalOpen(true);
  };

  return (
    <>
      <section className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 transition-colors duration-500">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Slots Disponibles
            </h3>
            {!isPublicMode && (
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                Duracion del servicio: {serviceDuration} min
              </p>
            )}
          </div>

          {!hideDateSelector ? (
            <div className="flex flex-col gap-1 z-20">
              <DatePicker
                value={selectedDate}
                onChange={(nextDate) => handleDateChange(nextDate)}
                minDate={toInputDate(new Date())}
                availableDays={isPublicMode ? availableDaysInMonth : null}
                onMonthChange={isPublicMode ? handleMonthChange : null}
                isMonthLoading={isPublicMode ? isMonthLoading : false}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-5 min-h-[200px]">
          {isInitializing && isPublicMode ? (
            <div className="py-16 flex flex-col items-center justify-center gap-4">
              <Loader2 size={36} className="animate-spin text-cyan-500" />
              <div className="text-center">
                <span className="text-sm font-black text-slate-800 dark:text-white block uppercase tracking-wider">
                  Analizando agenda
                </span>
                <span className="text-xs font-bold text-slate-500 mt-1 block">
                  Buscando próximos turnos disponibles...
                </span>
              </div>
            </div>
          ) : loading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm font-semibold">
                Cargando horarios...
              </span>
            </div>
          ) : errorMessage ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : staffWorkingDays && staffWorkingDays.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Este empleado aún no tiene horarios de atención configurados.
            </div>
          ) : slots.length === 0 || (isPublicMode && slots.filter(s => s.isAvailable && !isPastSlot(s)).length === 0) ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-400">
              No hay horarios disponibles para la fecha seleccionada.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {slots.filter(slot => {
                if (isPublicMode) {
                  return slot.isAvailable && !isPastSlot(slot);
                }
                return true;
              }).map((slot) => {
                const past = isPastSlot(slot);
                const occupied = Boolean(slot.appointmentId);
                const statusLabel = getSlotStatusLabel(slot);
                const disabledExpiredFree = past && !occupied;
                const tooltip = disabledExpiredFree
                  ? "Horario vencido: no se puede reservar."
                  : undefined;

                return (
                  <article
                    key={slot.startUtc}
                    title={tooltip}
                    className={`relative min-h-[132px] rounded-xl border px-3 py-3 transition-colors ${
                      disabledExpiredFree
                        ? "bg-slate-400/10 border-slate-400/30 text-slate-500 cursor-not-allowed"
                        : slot.isAvailable
                          ? "bg-emerald-500/10 border-emerald-400/40 text-emerald-900 dark:text-emerald-300"
                          : "bg-orange-500/10 border-orange-400/40 text-orange-900 dark:text-orange-300"
                    }`}
                  >
                    <span className="absolute top-2 left-2 text-[11px] font-bold uppercase tracking-wide opacity-90">
                      {statusLabel}
                    </span>

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {slot.isAvailable && !past ? (
                        <button
                          type="button"
                          title="Agregar turno"
                          onClick={() => openBookingModal(slot)}
                          className={iconButtonClass}
                        >
                          <Plus size={14} />
                        </button>
                      ) : null}

                      {!isPublicMode && occupied && !past ? (
                        <>
                          <button
                            type="button"
                            title="Ver detalle"
                            onClick={() => openViewModal(slot)}
                            className={iconButtonClass}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            title="Editar turno"
                            onClick={() =>
                              onOccupiedSlotClick?.(slot.appointmentId)
                            }
                            className={iconButtonClass}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title="Cancelar turno"
                            onClick={() => openCancelModal(slot)}
                            className={iconButtonClass}
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : null}

                      {!isPublicMode && occupied && past ? (
                        <button
                          type="button"
                          title="Ver detalle"
                          onClick={() => openViewModal(slot)}
                          className={iconButtonClass}
                        >
                          <Eye size={14} />
                        </button>
                      ) : null}
                    </div>

                    <div className="h-full flex items-center justify-center">
                      <p
                        className="text-3xl leading-none font-black tracking-tight"
                        title={slot.label}
                      >
                        {slot.label}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {bookingModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/55"
            onClick={() => setBookingModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] p-5 shadow-2xl">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Agregar Turno
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Empleado: {staffName || "Empleado"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Dia: {formatInputDateToDisplay(selectedDate)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Horario: {bookingSlot?.label || "--:--"}
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Nombre"
                className="w-full bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <input
                type="text"
                value={clientPhone}
                onChange={(event) => setClientPhone(event.target.value)}
                placeholder="Telefono (recomendado)"
                className="w-full bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="cursor-pointer px-3 py-2 rounded-lg text-xs font-bold bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/20"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={submitBooking}
                disabled={isBooking || !bookingSlot}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-60"
              >
                {isBooking ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : null}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cancelModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/55"
            onClick={() => setCancelModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] p-5 shadow-2xl">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Cancelar Turno
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Cliente: {cancelSlot?.clientName || "Cliente"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Empleado: {cancelSlot?.staffName || staffName || "Empleado"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Dia: {formatInputDateToDisplay(selectedDate)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Horario: {cancelSlot?.label || "--:--"}
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="cursor-pointer px-3 py-2 rounded-lg text-xs font-bold bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/20"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={submitCancel}
                disabled={canceling}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 disabled:opacity-60"
              >
                {canceling ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : null}
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/55"
            onClick={() => setViewModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] p-5 shadow-2xl">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Detalle del Turno
            </h4>
            <p className="text-sm mt-3 flex items-center gap-1 min-w-0">
              <UserRound size={14} className="shrink-0" />
              <span className="font-bold shrink-0">Cliente:</span>
              <span
                className="truncate"
                title={viewSlot?.clientName || "Cliente"}
              >
                {viewSlot?.clientName || "Cliente"}
              </span>
            </p>
            <p className="text-sm mt-2 flex items-center gap-1 min-w-0 opacity-90">
              <Users size={14} className="shrink-0" />
              <span className="font-bold shrink-0">Empleado:</span>
              <span
                className="truncate"
                title={viewSlot?.staffName || staffName || "Empleado"}
              >
                {viewSlot?.staffName || staffName || "Empleado"}
              </span>
            </p>
            <p className="text-sm mt-2 opacity-90">
              <span className="font-bold">Dia:</span>{" "}
              {formatInputDateToDisplay(selectedDate)}
            </p>
            <p className="text-sm mt-1 opacity-90">
              <span className="font-bold">Horario:</span>{" "}
              {viewSlot?.label || "--:--"}
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="cursor-pointer px-3 py-2 rounded-lg text-xs font-bold bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/20"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
