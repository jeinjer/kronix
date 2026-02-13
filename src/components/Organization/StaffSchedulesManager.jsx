import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getOrganizationStaff } from '@/supabase/services/staff';
import { getStaffSchedules, replaceStaffSchedules } from '@/supabase/services/schedules';
import ScheduleTemplateSelector from './ScheduleTemplateSelector';

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
];
const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTE_OPTIONS = ['00', '30'];

const createEmptyWeek = () =>
  DAYS.reduce((acc, day) => {
    acc[day.value] = [];
    return acc;
  }, {});

const normalizeTime = (timeValue) => String(timeValue || '').slice(0, 5);
const toMinutes = (timeValue) => {
  const [hours, minutes] = String(timeValue || '').split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return hours * 60 + minutes;
};
const isHalfHourStep = (timeValue) => {
  const minutes = toMinutes(timeValue);
  if (Number.isNaN(minutes)) return false;
  return minutes % 30 === 0;
};
const splitTimeParts = (timeValue) => {
  const [hour = '09', minute = '00'] = String(timeValue || '').split(':');
  const safeHour = HOURS.includes(hour) ? hour : '09';
  const safeMinute = MINUTE_OPTIONS.includes(minute) ? minute : '00';
  return { hour: safeHour, minute: safeMinute };
};
const buildTimeValue = (hour, minute) => `${hour}:${minute}`;
const validateDayBlocks = (dayLabel, blocks) => {
  for (const block of blocks) {
    if (!block.start_time || !block.end_time) {
      return `Completa todos los bloques horarios en ${dayLabel}.`;
    }
    if (!isHalfHourStep(block.start_time) || !isHalfHourStep(block.end_time)) {
      return `Revisa ${dayLabel}: los minutos permitidos son solo 00 o 30.`;
    }
    if (block.start_time >= block.end_time) {
      return `Revisa ${dayLabel}: la hora de inicio del bloque horario debe ser menor a la de fin.`;
    }
  }

  const normalized = blocks
    .map((block) => ({
      start: toMinutes(block.start_time),
      end: toMinutes(block.end_time),
    }))
    .sort((a, b) => a.start - b.start);

  if (normalized.some((slot) => Number.isNaN(slot.start) || Number.isNaN(slot.end))) {
    return `Revisa ${dayLabel}: hay un bloque horario con hora invalida.`;
  }

  for (let index = 1; index < normalized.length; index += 1) {
    const previous = normalized[index - 1];
    const current = normalized[index];
    if (previous.end > current.start) {
      return `Revisa ${dayLabel}: no se permiten bloques horarios superpuestos.`;
    }
  }

  return null;
};

export default function StaffSchedulesManager({ organizationId, staffRefreshKey, onSchedulesChanged }) {
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blocksByDay, setBlocksByDay] = useState(createEmptyWeek());
  const [blockToRemove, setBlockToRemove] = useState(null);

  const loadScheduleData = useCallback(async () => {
    if (!selectedStaffId) {
      setBlocksByDay(createEmptyWeek());
      return;
    }

    setLoadingSchedule(true);
    const { data, error } = await getStaffSchedules(selectedStaffId);
    if (error) {
      toast.error('No se pudo cargar el calendario laboral');
      setBlocksByDay(createEmptyWeek());
    } else {
      const grouped = createEmptyWeek();
      (data || []).forEach((row) => {
        const day = Number(row.day_of_week);
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push({
          id: row.id,
          start_time: normalizeTime(row.start_time),
          end_time: normalizeTime(row.end_time),
        });
      });
      setBlocksByDay(grouped);
    }
    setLoadingSchedule(false);
  }, [selectedStaffId]);

  useEffect(() => {
    const loadStaff = async () => {
      if (!organizationId) return;
      setLoadingStaff(true);
      const { data, error } = await getOrganizationStaff(organizationId);
      if (error) {
        toast.error('No se pudo cargar el staff');
        setStaffList([]);
      } else {
        const active = (data || []).filter((item) => item.is_active);
        setStaffList(active);
        if (active.length) {
          setSelectedStaffId((prev) => prev || active[0].id);
        } else {
          setSelectedStaffId('');
        }
      }
      setLoadingStaff(false);
    };

    loadStaff();
  }, [organizationId, staffRefreshKey]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  const hasStaff = useMemo(() => staffList.length > 0, [staffList.length]);
  const hasPendingBlock = useMemo(
    () =>
      DAYS.some((day) =>
        (blocksByDay[day.value] || []).some((block) => String(block.id).startsWith('new-'))
      ),
    [blocksByDay]
  );
  const dayValidationMessages = useMemo(
    () =>
      DAYS.reduce((acc, day) => {
        acc[day.value] = validateDayBlocks(day.label, blocksByDay[day.value] || []);
        return acc;
      }, {}),
    [blocksByDay]
  );
  const hasValidationErrors = useMemo(
    () => DAYS.some((day) => Boolean(dayValidationMessages[day.value])),
    [dayValidationMessages]
  );

  const handleAddBlock = (dayOfWeek) => {
    if (hasPendingBlock) {
      toast.error('Primero confirma y guarda el bloque horario pendiente antes de agregar otro.');
      return;
    }

    setBlocksByDay((prev) => ({
      ...prev,
      [dayOfWeek]: [
        ...(prev[dayOfWeek] || []),
        { id: `new-${dayOfWeek}-${Date.now()}`, start_time: '09:00', end_time: '18:00' },
      ],
    }));
  };

  const handleRemoveBlock = (dayOfWeek, blockId) => {
    setBlockToRemove({ dayOfWeek, blockId });
  };

  const confirmRemoveBlock = () => {
    if (!blockToRemove) return;

    setBlocksByDay((prev) => ({
      ...prev,
      [blockToRemove.dayOfWeek]: (prev[blockToRemove.dayOfWeek] || []).filter(
        (block) => block.id !== blockToRemove.blockId
      ),
    }));
    setBlockToRemove(null);
  };

  const handleChangeBlock = (dayOfWeek, blockId, field, value) => {
    setBlocksByDay((prev) => ({
      ...prev,
      [dayOfWeek]: (prev[dayOfWeek] || []).map((block) =>
        block.id === blockId ? { ...block, [field]: value } : block
      ),
    }));
  };

  const validateBlocks = () => {
    for (const day of DAYS) {
      const message = validateDayBlocks(day.label, blocksByDay[day.value] || []);
      if (message) return message;
    }
    return null;
  };

  const handleSave = async () => {
    if (!selectedStaffId) {
      toast.error('Selecciona un empleado.');
      return;
    }

    const validationError = validateBlocks();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const flattened = DAYS.flatMap((day) =>
      (blocksByDay[day.value] || []).map((block) => ({
        day_of_week: day.value,
        start_time: `${block.start_time}:00`,
        end_time: `${block.end_time}:00`,
      }))
    );

    setSaving(true);
    const { error } = await replaceStaffSchedules({
      staffId: selectedStaffId,
      blocks: flattened,
    });

    if (error) {
      toast.error('No se pudo guardar el calendario laboral.');
    } else {
      toast.success('Calendario laboral actualizado.');
      await loadScheduleData();
      onSchedulesChanged?.();
    }
    setSaving(false);
  };

  return (
    <section className="mt-8 bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 transition-colors duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Calendario por Empleado
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Define horarios semanales para cada integrante
          </p>
        </div>

        {hasStaff ? (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select
              value={selectedStaffId}
              onChange={(event) => setSelectedStaffId(event.target.value)}
              className="bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>

            <ScheduleTemplateSelector
              staffId={selectedStaffId}
              onSuccess={async () => {
                await loadScheduleData();
                onSchedulesChanged?.();
              }}
            />
          </div>
        ) : null}
      </div>

      {hasPendingBlock ? (
        <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            Tienes un bloque horario nuevo pendiente. Guardalo para confirmarlo.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || hasValidationErrors}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Guardar bloque horario nuevo
          </button>
        </div>
      ) : null}

      {loadingStaff || loadingSchedule ? (
        <div className="py-10 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-semibold">Cargando calendario laboral...</span>
        </div>
      ) : !hasStaff ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 py-8 px-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Primero crea empleados activos para poder asignarles horarios.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {DAYS.map((day) => {
              const blocks = blocksByDay[day.value] || [];
              return (
                <article
                  key={day.value}
                  className="rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{day.label}</h4>
                    <button
                      type="button"
                      onClick={() => handleAddBlock(day.value)}
                      disabled={hasPendingBlock}
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Plus size={12} />
                      Agregar bloque horario
                    </button>
                  </div>

                  {blocks.length === 0 ? (
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <CalendarClock size={13} />
                      Sin bloque horario asignado
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {blocks.map((block) => (
                        <div key={block.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Bloque horario
                          </span>
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                              Inicio
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hora</span>
                                <select
                                  value={splitTimeParts(block.start_time).hour}
                                  onChange={(event) => {
                                    const { minute } = splitTimeParts(block.start_time);
                                    handleChangeBlock(
                                      day.value,
                                      block.id,
                                      'start_time',
                                      buildTimeValue(event.target.value, minute)
                                    );
                                  }}
                                  className="bg-white dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                  {HOURS.map((hour) => (
                                    <option key={`start-hour-${block.id}-${hour}`} value={hour}>
                                      {hour}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Min</span>
                                <select
                                  value={splitTimeParts(block.start_time).minute}
                                  onChange={(event) => {
                                    const { hour } = splitTimeParts(block.start_time);
                                    handleChangeBlock(
                                      day.value,
                                      block.id,
                                      'start_time',
                                      buildTimeValue(hour, event.target.value)
                                    );
                                  }}
                                  className="bg-white dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                  {MINUTE_OPTIONS.map((minute) => (
                                    <option key={`start-minute-${block.id}-${minute}`} value={minute}>
                                      {minute}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                              Fin
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hora</span>
                                <select
                                  value={splitTimeParts(block.end_time).hour}
                                  onChange={(event) => {
                                    const { minute } = splitTimeParts(block.end_time);
                                    handleChangeBlock(
                                      day.value,
                                      block.id,
                                      'end_time',
                                      buildTimeValue(event.target.value, minute)
                                    );
                                  }}
                                  className="bg-white dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                  {HOURS.map((hour) => (
                                    <option key={`end-hour-${block.id}-${hour}`} value={hour}>
                                      {hour}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Min</span>
                                <select
                                  value={splitTimeParts(block.end_time).minute}
                                  onChange={(event) => {
                                    const { hour } = splitTimeParts(block.end_time);
                                    handleChangeBlock(
                                      day.value,
                                      block.id,
                                      'end_time',
                                      buildTimeValue(hour, event.target.value)
                                    );
                                  }}
                                  className="bg-white dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                  {MINUTE_OPTIONS.map((minute) => (
                                    <option key={`end-minute-${block.id}-${minute}`} value={minute}>
                                      {minute}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock(day.value, block.id)}
                            className="md:col-span-2 inline-flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 transition-colors"
                          >
                            <Trash2 size={12} />
                            Quitar bloque horario
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {dayValidationMessages[day.value] ? (
                    <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300">
                      {dayValidationMessages[day.value]}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>

          {hasPendingBlock ? (
            <p className="mt-3 text-xs font-semibold text-amber-600 dark:text-amber-300">
              Hay un bloque horario pendiente. Guarda los cambios antes de agregar otro.
            </p>
          ) : null}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || hasValidationErrors}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-colors disabled:opacity-70"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Guardando...' : 'Guardar bloques horarios'}
            </button>
          </div>
        </>
      )}

      {blockToRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setBlockToRemove(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] p-6 shadow-2xl">
            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Confirmar eliminacion
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
              Seguro que quieres eliminar este bloque horario?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlockToRemove(null)}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRemoveBlock}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Si, eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
