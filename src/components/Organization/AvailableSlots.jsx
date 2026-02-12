import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getStaffAvailableSlots } from '@/supabase/services/availability';
import { createAppointment } from '@/supabase/services/appointments';

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseInputDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;

export default function AvailableSlots({
  organizationId,
  staffId,
  serviceDuration = 30,
  businessTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  onSelectSlot,
  selectedDateValue,
  onDateChange,
  hideDateSelector = false,
  onBookingCreated,
  onSlotsSummaryChange,
  refreshKey = 0,
  onOccupiedSlotClick,
}) {
  const [internalDate, setInternalDate] = useState(toInputDate(new Date()));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedStartUtc, setSelectedStartUtc] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const selectedDate = selectedDateValue || internalDate;

  const emitSlotsSummary = (nextSlots) => {
    const safeSlots = Array.isArray(nextSlots) ? nextSlots : [];
    const freeCount = safeSlots.filter((slot) => slot.isAvailable).length;
    const reservedCount = safeSlots.length - freeCount;
    onSlotsSummaryChange?.({
      freeCount,
      reservedCount,
      totalCount: safeSlots.length,
    });
  };

  const canLoad = useMemo(() => Boolean(staffId), [staffId]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!canLoad) {
        setSlots([]);
        setErrorMessage('Selecciona un empleado para ver disponibilidad.');
        emitSlotsSummary([]);
        return;
      }

      setLoading(true);
      setErrorMessage('');

      const dateObject = parseInputDate(selectedDate);
      const { data, error } = await getStaffAvailableSlots({
        staffId,
        selectedDate: dateObject,
        serviceDuration,
        timeZone: businessTimeZone,
      });

      if (error) {
        setSlots([]);
        setErrorMessage(error.message || 'No se pudieron obtener los horarios.');
        emitSlotsSummary([]);
      } else {
        const safeSlots = data || [];
        setSlots(safeSlots);
        emitSlotsSummary(safeSlots);
      }

      setLoading(false);
    };

    loadSlots();
  }, [staffId, selectedDate, serviceDuration, businessTimeZone, canLoad, refreshKey]);

  const handleSelectSlot = (slot) => {
    if (!slot.isAvailable) {
      if (slot.appointmentId) onOccupiedSlotClick?.(slot.appointmentId);
      return;
    }
    setSelectedStartUtc(slot.startUtc);
    onSelectSlot?.(slot);
  };

  const handleDateChange = (nextDate) => {
    if (selectedDateValue && onDateChange) {
      onDateChange(nextDate);
      return;
    }
    setInternalDate(nextDate);
  };

  const selectedSlot = slots.find((slot) => slot.startUtc === selectedStartUtc) || null;

  const handleBooking = async () => {
    if (isBooking) return;
    if (!organizationId || !staffId) {
      toast.error('Falta configuracion para reservar este turno.');
      return;
    }
    if (!selectedSlot) {
      toast.error('Selecciona un horario disponible.');
      return;
    }
    if (!selectedSlot.isAvailable) {
      toast.error('Ese horario ya no esta disponible.');
      return;
    }
    if (!clientName.trim()) {
      toast.error('Ingresa el nombre del cliente.');
      return;
    }
    if (clientPhone.trim() && !PHONE_REGEX.test(clientPhone.trim())) {
      toast.error('Telefono invalido. Usa solo numeros y simbolos comunes.');
      return;
    }

    setIsBooking(true);

    const { data, error } = await createAppointment({
      organizationId,
      staffId,
      startTime: selectedSlot.startUtc,
      endTime: selectedSlot.endUtc,
      clientName,
      clientPhone,
    });

    if (error) {
      if (error.code === '23P01') {
        toast.error('Lo sentimos, alguien acaba de reservar este horario hace un instante.');
        setSelectedStartUtc('');
        await getUpdatedSlots();
      } else {
        toast.error('No se pudo completar la reserva. Intenta nuevamente.');
      }
      setIsBooking(false);
      return;
    }

    toast.success('Reserva creada correctamente.');
    setClientName('');
    setClientPhone('');
    setSelectedStartUtc('');
    await getUpdatedSlots();
    onBookingCreated?.(data);
    setIsBooking(false);
  };

  const getUpdatedSlots = async () => {
    setLoading(true);
    const dateObject = parseInputDate(selectedDate);
    const { data, error } = await getStaffAvailableSlots({
      staffId,
      selectedDate: dateObject,
      serviceDuration,
      timeZone: businessTimeZone,
    });
    if (error) {
      setSlots([]);
      setErrorMessage(error.message || 'No se pudieron obtener los horarios.');
      emitSlotsSummary([]);
    } else {
      const safeSlots = data || [];
      setSlots(safeSlots);
      emitSlotsSummary(safeSlots);
    }
    setLoading(false);
  };

  return (
    <section className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 transition-colors duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Slots Disponibles
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Duracion del servicio: {serviceDuration} min
          </p>
        </div>

        {!hideDateSelector ? (
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-semibold">
            <CalendarDays size={16} className="text-cyan-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => handleDateChange(event.target.value)}
              className="bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </label>
        ) : null}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-semibold">Cargando horarios...</span>
          </div>
        ) : errorMessage ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-400">
            No hay horarios disponibles para la fecha seleccionada.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const isSelected = selectedStartUtc === slot.startUtc;
              const isFree = slot.isAvailable;
              return (
                <button
                  key={slot.startUtc}
                  type="button"
                  onClick={() => handleSelectSlot(slot)}
                  className={`rounded-lg px-3 py-2 text-sm font-bold border transition-colors ${
                    isFree
                      ? isSelected
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-emerald-500/15 border-emerald-400/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20'
                      : 'bg-orange-500/15 border-orange-400/50 text-orange-900 dark:text-orange-300 hover:bg-orange-500/20'
                  }`}
                >
                  <div className="text-base leading-none">{slot.label}</div>
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide opacity-90">
                    Estado: {isFree ? 'Libre' : 'Ocupado'}
                  </div>
                  <div className="mt-1 text-[11px] font-medium opacity-85 truncate">
                    {isFree ? 'Sin reserva' : `Reserva: ${slot.clientName || 'Cliente'}`}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-slate-200 dark:border-white/10 pt-5">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Reservar Turno
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          {selectedSlot ? `Horario elegido: ${selectedSlot.label}` : 'Selecciona un horario para continuar.'}
        </p>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="text"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Nombre del cliente"
            className="bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <input
            type="text"
            value={clientPhone}
            onChange={(event) => setClientPhone(event.target.value)}
            placeholder="Telefono (opcional)"
            className="bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="button"
            onClick={handleBooking}
            disabled={isBooking || !selectedSlot}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isBooking ? <Loader2 size={15} className="animate-spin" /> : null}
            {isBooking ? 'Reservando...' : 'Confirmar Reserva'}
          </button>
        </div>
      </div>
    </section>
  );
}
