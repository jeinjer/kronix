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

const createEmptyWeek = () =>
  DAYS.reduce((acc, day) => {
    acc[day.value] = [];
    return acc;
  }, {});

const normalizeTime = (timeValue) => String(timeValue || '').slice(0, 5);

export default function StaffSchedulesManager({ organizationId, staffRefreshKey, onSchedulesChanged }) {
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blocksByDay, setBlocksByDay] = useState(createEmptyWeek());

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

  const handleAddBlock = (dayOfWeek) => {
    setBlocksByDay((prev) => ({
      ...prev,
      [dayOfWeek]: [
        ...(prev[dayOfWeek] || []),
        { id: `new-${dayOfWeek}-${Date.now()}`, start_time: '09:00', end_time: '18:00' },
      ],
    }));
  };

  const handleRemoveBlock = (dayOfWeek, blockId) => {
    setBlocksByDay((prev) => ({
      ...prev,
      [dayOfWeek]: (prev[dayOfWeek] || []).filter((block) => block.id !== blockId),
    }));
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
      const blocks = blocksByDay[day.value] || [];
      for (const block of blocks) {
        if (!block.start_time || !block.end_time) {
          return `Completa todos los horarios en ${day.label}.`;
        }
        if (block.start_time >= block.end_time) {
          return `Revisa ${day.label}: el horario de inicio debe ser menor al de fin.`;
        }
      }
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
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      <Plus size={12} />
                      Agregar bloque
                    </button>
                  </div>

                  {blocks.length === 0 ? (
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <CalendarClock size={13} />
                      Sin horario asignado
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {blocks.map((block) => (
                        <div key={block.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                          <input
                            type="time"
                            value={block.start_time}
                            onChange={(event) =>
                              handleChangeBlock(day.value, block.id, 'start_time', event.target.value)
                            }
                            className="bg-white dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                          <input
                            type="time"
                            value={block.end_time}
                            onChange={(event) =>
                              handleChangeBlock(day.value, block.id, 'end_time', event.target.value)
                            }
                            className="bg-white dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock(day.value, block.id)}
                            className="md:col-span-2 inline-flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 transition-colors"
                          >
                            <Trash2 size={12} />
                            Quitar bloque
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-colors disabled:opacity-70"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Guardando...' : 'Guardar calendario'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
