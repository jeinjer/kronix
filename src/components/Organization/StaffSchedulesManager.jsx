import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getOrganizationStaff } from "@/supabase/services/staff";
import {
  getStaffSchedules,
  replaceStaffSchedules,
} from "@/supabase/services/schedules";
import ScheduleTemplateSelector from "./ScheduleTemplateSelector";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
];
const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const MINUTE_OPTIONS = ["00", "30"];

const createEmptyWeek = () =>
  DAYS.reduce((acc, day) => {
    acc[day.value] = [];
    return acc;
  }, {});

const normalizeTime = (timeValue) => String(timeValue || "").slice(0, 5);
const toMinutes = (timeValue) => {
  const [hours, minutes] = String(timeValue || "")
    .split(":")
    .map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return hours * 60 + minutes;
};
const isHalfHourStep = (timeValue) => {
  const minutes = toMinutes(timeValue);
  if (Number.isNaN(minutes)) return false;
  return minutes % 30 === 0;
};
const splitTimeParts = (timeValue) => {
  const [hour = "09", minute = "00"] = String(timeValue || "").split(":");
  const safeHour = HOURS.includes(hour) ? hour : "09";
  const safeMinute = MINUTE_OPTIONS.includes(minute) ? minute : "00";
  return { hour: safeHour, minute: safeMinute };
};
const buildTimeValue = (hour, minute) => `${hour}:${minute}`;
const serializeBlocksByDay = (blocksByDay) =>
  DAYS.map((day) =>
    (blocksByDay[day.value] || [])
      .map((block) => ({
        start_time: normalizeTime(block.start_time),
        end_time: normalizeTime(block.end_time),
      }))
      .sort((a, b) =>
        a.start_time === b.start_time
          ? a.end_time.localeCompare(b.end_time)
          : a.start_time.localeCompare(b.start_time),
      ),
  );

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

  if (
    normalized.some(
      (slot) => Number.isNaN(slot.start) || Number.isNaN(slot.end),
    )
  ) {
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

export default function StaffSchedulesManager({
  organizationId,
  staffRefreshKey,
  onSchedulesChanged,
}) {
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [blocksByDay, setBlocksByDay] = useState(createEmptyWeek());
  const [persistedSignature, setPersistedSignature] = useState(
    JSON.stringify(serializeBlocksByDay(createEmptyWeek())),
  );
  const [blockToRemove, setBlockToRemove] = useState(null);
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);
  const [schedulesOpen, setSchedulesOpen] = useState(true);

  const loadScheduleData = useCallback(async () => {
    if (!selectedStaffId) {
      const emptyWeek = createEmptyWeek();
      setBlocksByDay(emptyWeek);
      setPersistedSignature(JSON.stringify(serializeBlocksByDay(emptyWeek)));
      return;
    }

    setLoadingSchedule(true);
    const { data, error } = await getStaffSchedules(selectedStaffId);
    if (error) {
      toast.error("No se pudo cargar el calendario laboral");
      const emptyWeek = createEmptyWeek();
      setBlocksByDay(emptyWeek);
      setPersistedSignature(JSON.stringify(serializeBlocksByDay(emptyWeek)));
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
      DAYS.forEach((day) => {
        grouped[day.value] = (grouped[day.value] || []).sort((a, b) =>
          a.start_time === b.start_time
            ? a.end_time.localeCompare(b.end_time)
            : a.start_time.localeCompare(b.start_time),
        );
      });
      setBlocksByDay(grouped);
      setPersistedSignature(JSON.stringify(serializeBlocksByDay(grouped)));
    }
    setLoadingSchedule(false);
  }, [selectedStaffId]);

  useEffect(() => {
    const loadStaff = async () => {
      if (!organizationId) return;
      setLoadingStaff(true);
      const { data, error } = await getOrganizationStaff(organizationId);
      if (error) {
        toast.error("No se pudo cargar el staff");
        setStaffList([]);
      } else {
        const active = (data || []).filter((item) => item.is_active);
        setStaffList(active);
        if (active.length) {
          setSelectedStaffId((prev) => prev || active[0].id);
        } else {
          setSelectedStaffId("");
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
        (blocksByDay[day.value] || []).some((block) =>
          String(block.id).startsWith("new-"),
        ),
      ),
    [blocksByDay],
  );
  const dayValidationMessages = useMemo(
    () =>
      DAYS.reduce((acc, day) => {
        acc[day.value] = validateDayBlocks(
          day.label,
          blocksByDay[day.value] || [],
        );
        return acc;
      }, {}),
    [blocksByDay],
  );
  const hasValidationErrors = useMemo(
    () => DAYS.some((day) => Boolean(dayValidationMessages[day.value])),
    [dayValidationMessages],
  );
  const hasAnyBlocks = useMemo(
    () => DAYS.some((day) => (blocksByDay[day.value] || []).length > 0),
    [blocksByDay],
  );
  const currentSignature = useMemo(
    () => JSON.stringify(serializeBlocksByDay(blocksByDay)),
    [blocksByDay],
  );
  const hasUnsavedChanges = currentSignature !== persistedSignature;

  const handleAddBlock = (dayOfWeek) => {
    if (hasPendingBlock) {
      toast.error(
        "Primero confirma y guarda el bloque horario pendiente antes de agregar otro.",
      );
      return;
    }

    setBlocksByDay((prev) => ({
      ...prev,
      [dayOfWeek]: [
        ...(prev[dayOfWeek] || []),
        {
          id: `new-${dayOfWeek}-${Date.now()}`,
          start_time: "09:00",
          end_time: "18:00",
        },
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
        (block) => block.id !== blockToRemove.blockId,
      ),
    }));
    setBlockToRemove(null);
  };

  const handleChangeBlock = (dayOfWeek, blockId, field, value) => {
    setBlocksByDay((prev) => ({
      ...prev,
      [dayOfWeek]: (prev[dayOfWeek] || []).map((block) =>
        block.id === blockId ? { ...block, [field]: value } : block,
      ),
    }));
  };

  const validateBlocks = () => {
    for (const day of DAYS) {
      const message = validateDayBlocks(
        day.label,
        blocksByDay[day.value] || [],
      );
      if (message) return message;
    }
    return null;
  };

  const handleSave = async () => {
    if (!selectedStaffId) {
      toast.error("Selecciona un empleado.");
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
      })),
    );

    setSaving(true);
    const { error } = await replaceStaffSchedules({
      staffId: selectedStaffId,
      blocks: flattened,
    });

    if (error) {
      toast.error("No se pudo guardar el calendario laboral.");
    } else {
      toast.success("Calendario laboral actualizado.");
      await loadScheduleData();
      onSchedulesChanged?.();
    }
    setSaving(false);
  };

  const handleClearAllSchedules = async () => {
    if (!selectedStaffId) {
      toast.error("Selecciona un empleado.");
      return;
    }

    setClearingAll(true);
    const { error } = await replaceStaffSchedules({
      staffId: selectedStaffId,
      blocks: [],
    });

    if (error) {
      toast.error("No se pudieron borrar los horarios.");
    } else {
      const emptyWeek = createEmptyWeek();
      setBlocksByDay(emptyWeek);
      setPersistedSignature(JSON.stringify(serializeBlocksByDay(emptyWeek)));
      toast.success("Todos los horarios fueron eliminados.");
      onSchedulesChanged?.();
    }

    setClearingAll(false);
    setConfirmClearAllOpen(false);
  };

  return (
    <div className="space-y-8 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif] pb-10">
      <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6 relative">
        <div className="absolute -top-4 -left-4 bg-cyan-400 border-2 border-slate-900 px-4 py-2 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_0_#0f172a] -rotate-2">
          Horarios del Equipo
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3 mb-8 mt-6 pb-6 border-b-4 border-slate-900">
          {hasStaff ? (
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center w-full md:w-auto">
              <label className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-slate-900 bg-yellow-400 px-3 py-2 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                Empleado:
                <select
                  value={selectedStaffId}
                  onChange={(event) => setSelectedStaffId(event.target.value)}
                  className="bg-white border-2 border-slate-900 px-2 py-1 text-slate-900 focus:outline-none focus:ring-0 ml-2 cursor-pointer uppercase text-xs font-bold"
                >
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="w-full sm:w-auto">
                <ScheduleTemplateSelector
                  staffId={selectedStaffId}
                  onSuccess={async () => {
                    await loadScheduleData();
                    onSchedulesChanged?.();
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {hasPendingBlock ? (
          <div className="mb-8 border-4 border-slate-900 bg-yellow-400 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[4px_4px_0_0_#0f172a] animate-pulse">
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">
              ¡Tienes un bloque pendiente de guardar!
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || hasValidationErrors}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-900 text-xs font-black uppercase tracking-widest bg-cyan-400 hover:bg-cyan-300 text-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" strokeWidth={3} />
              ) : (
                <Save size={16} strokeWidth={3} />
              )}
              Confirmar bloque nuevo
            </button>
          </div>
        ) : null}

        {loadingStaff || loadingSchedule ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 border-4 border-dashed border-slate-300 bg-slate-50">
            <Loader2 size={32} className="animate-spin text-slate-900" strokeWidth={3} />
            <span className="text-sm font-black uppercase tracking-widest text-slate-900">
              Cargando cuadrícula...
            </span>
          </div>
        ) : !hasStaff ? (
          <div className="border-4 border-dashed border-slate-900 bg-slate-50 p-12 text-center">
            <p className="font-black uppercase tracking-widest text-slate-900">
              No hay empleados disponibles.
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
              Agrega uno primero desde la sección Empleados.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {DAYS.map((day) => {
                const blocks = blocksByDay[day.value] || [];
                return (
                  <article
                    key={day.value}
                    className="border-4 border-slate-900 bg-slate-50 p-5 shadow-[4px_4px_0_0_#0f172a]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b-2 border-slate-900">
                      <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                        {day.label}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleAddBlock(day.value)}
                        disabled={hasPendingBlock}
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-2 border-2 border-slate-900 bg-white hover:bg-slate-100 text-slate-900 transition-all shadow-[2px_2px_0_0_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50"
                      >
                        <Plus size={14} strokeWidth={3} />
                        Añadir Turno
                      </button>
                    </div>

                    {blocks.length === 0 ? (
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 p-4 bg-white border-2 border-slate-200">
                        <CalendarClock size={16} strokeWidth={3} />
                        Día libre - Sin horarios
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {blocks.map((block, idx) => (
                          <div
                            key={block.id}
                            className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-white border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]"
                          >
                            <span className="text-sm font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1 w-fit">
                              Bloque {idx + 1}
                            </span>
                            
                            <div className="flex-1 flex flex-wrap gap-4 items-center">
                              <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-900 p-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Desde</span>
                                <select
                                  value={splitTimeParts(block.start_time).hour}
                                  onChange={(e) => {
                                    const { minute } = splitTimeParts(block.start_time);
                                    handleChangeBlock(day.value, block.id, "start_time", buildTimeValue(e.target.value, minute));
                                  }}
                                  className="bg-white border-2 border-slate-900 px-2 py-1 text-sm font-bold focus:outline-none"
                                >
                                  {HOURS.map((hour) => <option key={`start-h-${block.id}-${hour}`} value={hour}>{hour}</option>)}
                                </select>
                                <span className="font-black text-slate-900">:</span>
                                <select
                                  value={splitTimeParts(block.start_time).minute}
                                  onChange={(e) => {
                                    const { hour } = splitTimeParts(block.start_time);
                                    handleChangeBlock(day.value, block.id, "start_time", buildTimeValue(hour, e.target.value));
                                  }}
                                  className="bg-white border-2 border-slate-900 px-2 py-1 text-sm font-bold focus:outline-none"
                                >
                                  {MINUTE_OPTIONS.map((minute) => <option key={`start-m-${block.id}-${minute}`} value={minute}>{minute}</option>)}
                                </select>
                              </div>

                              <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-900 p-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Hasta</span>
                                <select
                                  value={splitTimeParts(block.end_time).hour}
                                  onChange={(e) => {
                                    const { minute } = splitTimeParts(block.end_time);
                                    handleChangeBlock(day.value, block.id, "end_time", buildTimeValue(e.target.value, minute));
                                  }}
                                  className="bg-white border-2 border-slate-900 px-2 py-1 text-sm font-bold focus:outline-none"
                                >
                                  {HOURS.map((hour) => <option key={`end-h-${block.id}-${hour}`} value={hour}>{hour}</option>)}
                                </select>
                                <span className="font-black text-slate-900">:</span>
                                <select
                                  value={splitTimeParts(block.end_time).minute}
                                  onChange={(e) => {
                                    const { hour } = splitTimeParts(block.end_time);
                                    handleChangeBlock(day.value, block.id, "end_time", buildTimeValue(hour, e.target.value));
                                  }}
                                  className="bg-white border-2 border-slate-900 px-2 py-1 text-sm font-bold focus:outline-none"
                                >
                                  {MINUTE_OPTIONS.map((minute) => <option key={`end-m-${block.id}-${minute}`} value={minute}>{minute}</option>)}
                                </select>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveBlock(day.value, block.id)}
                              className="inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-2 border-2 border-slate-900 bg-rose-400 hover:bg-rose-500 text-slate-900 transition-all shadow-[2px_2px_0_0_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none whitespace-nowrap"
                            >
                              <Trash2 size={14} strokeWidth={3} />
                              Borrar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {dayValidationMessages[day.value] ? (
                      <p className="mt-4 p-3 bg-rose-400 border-2 border-slate-900 text-xs font-black uppercase tracking-widest text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                        ⚠️ {dayValidationMessages[day.value]}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>

            {hasPendingBlock ? (
              <p className="p-4 bg-yellow-400 border-4 border-slate-900 text-sm font-black uppercase tracking-widest text-slate-900 text-center shadow-[4px_4px_0_0_#0f172a]">
                GUARDA TUS CAMBIOS ANTES DE CONTINUAR.
              </p>
            ) : null}

            <div className="pt-8 border-t-4 border-slate-900 flex flex-col sm:flex-row justify-end gap-4">
              {hasAnyBlocks ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearAllOpen(true)}
                  disabled={saving || clearingAll}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 border-4 border-slate-900 bg-rose-400 hover:bg-rose-500 text-slate-900 text-xs font-black uppercase tracking-widest transition-all shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50"
                >
                  {clearingAll ? (
                    <Loader2 size={18} className="animate-spin" strokeWidth={3} />
                  ) : (
                    <Trash2 size={18} strokeWidth={3} />
                  )}
                  Limpiar Semana
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving ||
                  clearingAll ||
                  hasValidationErrors ||
                  !hasUnsavedChanges
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 border-4 border-slate-900 bg-cyan-400 hover:bg-cyan-300 text-slate-900 text-xs font-black uppercase tracking-widest transition-all shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:bg-slate-200"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" strokeWidth={3} />
                ) : (
                  <Save size={18} strokeWidth={3} />
                )}
                {saving ? "Procesando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        )}
      </div>

      {blockToRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border-4 border-slate-900 p-8 shadow-[12px_12px_0_0_#0f172a] animate-in zoom-in-95 duration-200">
            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              Confirmar Borrado
            </h4>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">
              ¿Seguro que quieres eliminar este bloque horario?
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlockToRemove(null)}
                className="px-4 py-3 text-xs font-black uppercase tracking-widest border-2 border-slate-900 bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRemoveBlock}
                className="px-4 py-3 text-xs font-black uppercase tracking-widest border-2 border-slate-900 bg-rose-400 text-slate-900 hover:bg-rose-500 shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmClearAllOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border-4 border-slate-900 p-8 shadow-[12px_12px_0_0_#0f172a] animate-in zoom-in-95 duration-200">
            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              ¿Borrar toda la semana?
            </h4>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">
              Se vaciará la agenda del empleado seleccionado. <span className="text-rose-500 font-black">Esto no se puede deshacer.</span>
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmClearAllOpen(false)}
                className="px-4 py-3 text-xs font-black uppercase tracking-widest border-2 border-slate-900 bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Mejor no
              </button>
              <button
                type="button"
                onClick={handleClearAllSchedules}
                disabled={clearingAll}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest border-2 border-slate-900 bg-rose-400 text-slate-900 hover:bg-rose-500 shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-70"
              >
                {clearingAll ? (
                  <Loader2 size={16} className="animate-spin" strokeWidth={3} />
                ) : null}
                {clearingAll ? "Vaciando..." : "Sí, borrar todo"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
