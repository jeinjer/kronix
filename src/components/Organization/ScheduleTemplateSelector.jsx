import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  applyScheduleTemplate,
  getScheduleTemplates,
} from '@/supabase/services/scheduleTemplates';

export default function ScheduleTemplateSelector({
  staffId,
  onSuccess,
}) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      const { data, error } = await getScheduleTemplates();

      if (error) {
        toast.error('No se pudieron cargar las plantillas.');
        setTemplates([]);
        setSelectedTemplateId('');
      } else {
        setTemplates(data || []);
        setSelectedTemplateId((data || [])[0]?.id || '');
      }

      setLoadingTemplates(false);
    };

    loadTemplates();
  }, []);

  const handleApplyTemplate = async () => {
    if (!staffId) {
      toast.error('Selecciona un empleado.');
      return;
    }
    if (!selectedTemplateId) {
      toast.error('Selecciona una plantilla.');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmApplyTemplate = async () => {
    setShowConfirmModal(false);
    setApplying(true);
    const { error } = await applyScheduleTemplate({
      staffId,
      templateId: selectedTemplateId,
    });

    if (error) {
      toast.error('No se pudo aplicar la plantilla.');
    } else {
      toast.success('Plantilla aplicada correctamente.');
      await onSuccess?.();
    }
    setApplying(false);
  };

  if (loadingTemplates) {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-slate-500">
        <Loader2 size={14} className="animate-spin" />
        Cargando plantillas...
      </div>
    );
  }

  if (!templates.length) {
    return (
      <div className="text-xs text-slate-500">
        No hay plantillas disponibles para esta sucursal.
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <select
        value={selectedTemplateId}
        onChange={(event) => setSelectedTemplateId(event.target.value)}
        className="bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleApplyTemplate}
        disabled={applying}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-70"
      >
        {applying ? <Loader2 size={13} className="animate-spin" /> : null}
        {applying ? 'Cargando...' : 'Aplicar Plantilla'}
      </button>

      {showConfirmModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] p-6 shadow-2xl">
            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Confirmar aplicacion
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
              Estas seguro? Esto reemplazara todo el horario actual de este empleado con la plantilla seleccionada.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmApplyTemplate}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Si, aplicar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
