import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Pencil, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getStaffAvailableSlots } from '@/supabase/services/availability';
import {
  checkStaffAvailability,
  cancelAppointment,
  formatAppointmentDateForInput,
  formatAppointmentTime,
  formatAppointmentTimeForInput,
  localDateTimeToUtcIso,
  updateAppointmentById,
} from '@/supabase/services/appointments';

const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;

export default function AppointmentModal({
  isOpen,
  appointment,
  staffOptions = [],
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  onClose,
  onSuccess,
}) {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const isPastAppointment = useMemo(() => {
    if (!appointment?.end_time) return false;
    return new Date(appointment.end_time).getTime() <= Date.now();
  }, [appointment?.end_time]);

  const durationMs = useMemo(() => {
    if (!appointment?.start_time || !appointment?.end_time) return 30 * 60 * 1000;
    return new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime();
  }, [appointment?.start_time, appointment?.end_time]);

  const initialDate = useMemo(
    () => formatAppointmentDateForInput(appointment?.start_time, timeZone),
    [appointment?.start_time, timeZone]
  );
  const initialTime = useMemo(
    () => formatAppointmentTimeForInput(appointment?.start_time, timeZone),
    [appointment?.start_time, timeZone]
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      client_name: '',
      client_phone: '',
      staff_id: '',
      date: '',
      time: '',
    },
  });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  useEffect(() => {
    if (!appointment) return;
    reset({
      client_name: appointment.client_name || '',
      client_phone: appointment.client_phone || '',
      staff_id: appointment.staff_id || '',
      date: formatAppointmentDateForInput(appointment.start_time, timeZone),
      time: formatAppointmentTimeForInput(appointment.start_time, timeZone),
    });
    setEditMode(false);
  }, [appointment, reset, timeZone]);

  const watchedStaffId = watch('staff_id');
  const watchedDate = watch('date');
  const watchedTime = watch('time');

  useEffect(() => {
    const loadAvailableTimes = async () => {
      if (!isOpen || !appointment || !editMode) return;
      if (!watchedStaffId || !watchedDate) return;

      setLoadingTimes(true);
      clearErrors('root');

      const durationMinutes = Math.max(30, Math.round(durationMs / (60 * 1000)));
      const selectedDateObj = new Date(`${watchedDate}T00:00:00`);
      const { data, error } = await getStaffAvailableSlots({
        staffId: watchedStaffId,
        selectedDate: selectedDateObj,
        serviceDuration: durationMinutes,
        timeZone,
        excludeAppointmentId: appointment.id,
      });

      if (error) {
        setAvailableTimes([]);
        setLoadingTimes(false);
        return;
      }

      const options = (data || [])
        .filter((slot) => slot.isAvailable)
        .map((slot) => formatAppointmentTimeForInput(slot.startUtc, timeZone));

      const uniqueOptions = [...new Set(options)];
      setAvailableTimes(uniqueOptions);

      if (!uniqueOptions.length) {
        setError('time', { type: 'manual', message: 'No hay horarios disponibles para ese barbero en esa fecha.' });
      } else {
        clearErrors('time');
        if (!uniqueOptions.includes(watchedTime)) {
          setValue('time', '', { shouldValidate: true, shouldDirty: true });
          setError('time', { type: 'manual', message: 'Selecciona un horario disponible.' });
        }
      }

      setLoadingTimes(false);
    };

    loadAvailableTimes();
  }, [
    isOpen,
    appointment,
    editMode,
    watchedStaffId,
    watchedDate,
    watchedTime,
    durationMs,
    timeZone,
    clearErrors,
    setError,
    setValue,
  ]);

  if (!isOpen || !appointment) return null;

  const currentStaff = staffOptions.find((item) => item.id === appointment.staff_id);

  const handleCancelAppointment = async () => {
    if (isPastAppointment) {
      toast.error('No se pueden cancelar turnos pasados.');
      return;
    }

    setShowCancelConfirm(false);

    setLoading(true);
    const { error } = await cancelAppointment({ appointmentId: appointment.id });
    if (error) {
      toast.error('No se pudo cancelar el turno.');
      setLoading(false);
      return;
    }

    toast.success('Turno cancelado.');
    setLoading(false);
    onSuccess?.();
    onClose?.();
  };

  const onSubmit = async (values) => {
    if (isPastAppointment) {
      toast.error('No se pueden modificar turnos pasados.');
      return;
    }

    if (!values.client_name?.trim()) {
      setError('client_name', { type: 'manual', message: 'Ingresa el nombre del cliente.' });
      return;
    }
    if (values.client_phone?.trim() && !PHONE_REGEX.test(values.client_phone.trim())) {
      setError('client_phone', { type: 'manual', message: 'Telefono invalido.' });
      return;
    }

    const changedContact =
      values.client_name.trim() !== (appointment.client_name || '').trim() ||
      (values.client_phone || '').trim() !== (appointment.client_phone || '').trim();

    const changedSchedule =
      values.staff_id !== appointment.staff_id ||
      values.date !== initialDate ||
      values.time !== initialTime;

    if (!changedContact && !changedSchedule) {
      toast.message('No hay cambios para guardar.');
      return;
    }

    setLoading(true);

    if (!changedSchedule) {
      const { error } = await updateAppointmentById({
        appointmentId: appointment.id,
        updates: {
          client_name: values.client_name.trim(),
          client_phone: values.client_phone?.trim() || null,
        },
      });

      if (error) {
        toast.error('No se pudieron guardar los cambios.');
      } else {
        toast.success('Turno actualizado.');
        onSuccess?.();
        onClose?.();
      }
      setLoading(false);
      return;
    }

    const newStartIso = localDateTimeToUtcIso(values.date, values.time, timeZone);
    if (!newStartIso) {
      setError('time', { type: 'manual', message: 'Fecha u hora invalida.' });
      setLoading(false);
      return;
    }
    if (!values.time) {
      setError('time', { type: 'manual', message: 'Selecciona un horario disponible.' });
      setLoading(false);
      return;
    }
    if (!values.time.endsWith(':00') && !values.time.endsWith(':30')) {
      setError('time', { type: 'manual', message: 'Los minutos solo pueden ser 00 o 30.' });
      setLoading(false);
      return;
    }

    const newEndIso = new Date(new Date(newStartIso).getTime() + durationMs).toISOString();

    const { isAvailable, error: availabilityError } = await checkStaffAvailability({
      staffId: values.staff_id,
      startTime: newStartIso,
      endTime: newEndIso,
      excludeAppointmentId: appointment.id,
    });

    if (availabilityError) {
      toast.error('No se pudo validar disponibilidad del barbero.');
      setLoading(false);
      return;
    }

    if (!isAvailable) {
      setError('root', {
        type: 'manual',
        message: 'Ese barbero ya esta ocupado en ese nuevo horario. Por favor elige otro.',
      });
      setLoading(false);
      return;
    }

    const { error } = await updateAppointmentById({
      appointmentId: appointment.id,
      updates: {
        client_name: values.client_name.trim(),
        client_phone: values.client_phone?.trim() || null,
        staff_id: values.staff_id,
        start_time: newStartIso,
        end_time: newEndIso,
      },
    });

    if (error?.code === '23P01') {
      setError('root', {
        type: 'manual',
        message: 'Ese barbero ya esta ocupado en ese nuevo horario. Por favor elige otro.',
      });
      setLoading(false);
      return;
    }

    if (error) {
      toast.error('No se pudieron guardar los cambios.');
      setLoading(false);
      return;
    }

    toast.success('Turno actualizado.');
    setLoading(false);
    onSuccess?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Detalle del Turno
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10"
          >
            <XCircle size={18} />
          </button>
        </div>

        {!editMode ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-white/[0.02]">
              <p className="text-sm"><span className="font-bold">Cliente:</span> {appointment.client_name}</p>
              <p className="text-sm mt-1"><span className="font-bold">Telefono:</span> {appointment.client_phone || 'Sin telefono'}</p>
              <p className="text-sm mt-1"><span className="font-bold">Barbero:</span> {currentStaff?.name || 'Sin staff'}</p>
              <p className="text-sm mt-1">
                <span className="font-bold">Fecha y hora:</span>{' '}
                {formatAppointmentDateForInput(appointment.start_time, timeZone)} {formatAppointmentTime(appointment.start_time, timeZone)} - {formatAppointmentTime(appointment.end_time, timeZone)}
              </p>
            </div>

            {isPastAppointment ? (
              <div className="rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Este turno ya paso y no se puede modificar ni cancelar.
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditMode(true)}
                disabled={isPastAppointment}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 text-sm font-bold"
              >
                <Pencil size={14} />
                Editar
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                disabled={loading || isPastAppointment}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 text-sm font-bold disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Cancelar Turno
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nombre Cliente</label>
                <input
                  {...register('client_name')}
                  className="w-full mt-1 bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
                {errors.client_name ? <p className="text-xs text-rose-500 mt-1">{errors.client_name.message}</p> : null}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Telefono</label>
                <input
                  {...register('client_phone')}
                  className="w-full mt-1 bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
                {errors.client_phone ? <p className="text-xs text-rose-500 mt-1">{errors.client_phone.message}</p> : null}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Barbero</label>
                <select
                  {...register('staff_id')}
                  className="w-full mt-1 bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fecha</label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full mt-1 bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hora</label>
                  <select
                    {...register('time')}
                    className="w-full mt-1 bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                    disabled={loadingTimes || !availableTimes.length}
                  >
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    {loadingTimes ? <option value="">Cargando...</option> : null}
                    {!loadingTimes && !availableTimes.length ? <option value="">Sin horarios</option> : null}
                    {!loadingTimes
                      ? availableTimes.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))
                      : null}
                  </select>
                  {errors.time ? <p className="text-xs text-rose-500 mt-1">{errors.time.message}</p> : null}
                </div>
              </div>
            </div>

            {errors.root?.message ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                {errors.root.message}
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-sm font-bold"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Guardar Cambios
              </button>
            </div>
          </form>
        )}
      </div>

      {showCancelConfirm ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/55" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] p-4 shadow-2xl">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Confirmar cancelacion
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Seguro que deseas cancelar este turno? El horario quedara disponible nuevamente.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/20"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleCancelAppointment}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 disabled:opacity-60"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : null}
                Si, cancelar turno
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
