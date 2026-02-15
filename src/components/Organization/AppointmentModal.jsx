import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Pencil, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getStaffAvailableSlots } from '@/supabase/services/availability';
import {
  formatAppointmentDate,
  checkStaffAvailability,
  formatAppointmentDateForInput,
  formatAppointmentTime,
  localDateTimeToUtcIso,
  updateAppointmentById,
} from '@/supabase/services/appointments';

const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;

const toHHMM = (isoString, timeZone) => {
  if (!isoString) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString));
};

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
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

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
    () => toHHMM(appointment?.start_time, timeZone),
    [appointment?.start_time, timeZone]
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    setValue,
    getValues,
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

  useEffect(() => {
    if (!appointment) return;
    reset({
      client_name: appointment.client_name || '',
      client_phone: appointment.client_phone || '',
      staff_id: appointment.staff_id || '',
      date: formatAppointmentDateForInput(appointment.start_time, timeZone),
      time: toHHMM(appointment.start_time, timeZone),
    });
    setEditMode(false);
  }, [appointment, reset, timeZone]);

  const watchedStaffId = watch('staff_id');
  const watchedDate = watch('date');

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
        .map((slot) => toHHMM(slot.startUtc, timeZone));

      const uniqueOptions = [...new Set(options)].sort();
      setAvailableTimes(uniqueOptions);

      if (!uniqueOptions.length) {
        setError('time', { type: 'manual', message: 'No hay horarios disponibles para ese empleado en esa fecha.' });
      } else {
        const currentTime = getValues('time');
        clearErrors('time');
        if (currentTime && !uniqueOptions.includes(currentTime)) {
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
    durationMs,
    timeZone,
    clearErrors,
    getValues,
    setError,
    setValue,
  ]);

  if (!isOpen || !appointment) return null;

  const currentStaff = staffOptions.find((item) => item.id === appointment.staff_id);

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
      const { data: updatedAppointment, error } = await updateAppointmentById({
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
        onSuccess?.(updatedAppointment);
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

    const newEndIso = new Date(new Date(newStartIso).getTime() + durationMs).toISOString();

    const { isAvailable, error: availabilityError } = await checkStaffAvailability({
      staffId: values.staff_id,
      startTime: newStartIso,
      endTime: newEndIso,
      excludeAppointmentId: appointment.id,
    });

    if (availabilityError) {
      toast.error('No se pudo validar disponibilidad del empleado.');
      setLoading(false);
      return;
    }

    if (!isAvailable) {
      setError('root', {
        type: 'manual',
        message: 'Ese empleado ya esta ocupado en ese horario. Elige otro.',
      });
      setLoading(false);
      return;
    }

    const { data: updatedAppointment, error } = await updateAppointmentById({
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
        message: 'Ese empleado ya esta ocupado en ese horario. Elige otro.',
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
    onSuccess?.(updatedAppointment);
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
            className="cursor-pointer p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10"
          >
            <XCircle size={18} />
          </button>
        </div>

        {!editMode ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-white/[0.02]">
              <p className="text-sm flex items-center gap-1 min-w-0">
                <span className="font-bold shrink-0">Cliente:</span>
                <span className="truncate min-w-0" title={appointment.client_name || 'Sin nombre'}>
                  {appointment.client_name}
                </span>
              </p>
              <p className="text-sm mt-1"><span className="font-bold">Telefono:</span> {appointment.client_phone || 'Sin telefono'}</p>
              <p className="text-sm mt-1 flex items-center gap-1 min-w-0">
                <span className="font-bold shrink-0">Empleado:</span>
                <span className="truncate min-w-0" title={currentStaff?.name || 'Sin staff'}>
                  {currentStaff?.name || 'Sin staff'}
                </span>
              </p>
              <p className="text-sm mt-1">
                <span className="font-bold">Dia:</span>{' '}
                {formatAppointmentDate(appointment.start_time, timeZone)}
              </p>
              <p className="text-sm mt-1">
                <span className="font-bold">Horario:</span>{' '}
                {formatAppointmentTime(appointment.start_time, timeZone)} - {formatAppointmentTime(appointment.end_time, timeZone)}
              </p>
            </div>

            {isPastAppointment ? (
              <div className="rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Este turno ya paso y no se puede modificar.
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-3 py-2 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-sm font-bold hover:bg-slate-300 dark:hover:bg-white/20"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => setEditMode(true)}
                disabled={isPastAppointment}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold disabled:opacity-60"
              >
                <Pencil size={14} />
                Editar
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Empleado</label>
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
                className="cursor-pointer px-3 py-2 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-sm font-bold hover:bg-slate-300 dark:hover:bg-white/20"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Guardar Cambios
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
