import React, { useEffect, useState } from "react";
import { Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  applyScheduleTemplate,
  getScheduleTemplates,
} from "@/supabase/services/scheduleTemplates";

export default function ScheduleTemplateSelector({ staffId, onSuccess }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      const { data, error } = await getScheduleTemplates();

      if (error) {
        toast.error("No se pudieron cargar las plantillas.");
        setTemplates([]);
        setSelectedTemplateId("");
      } else {
        setTemplates(data || []);
        setSelectedTemplateId((data || [])[0]?.id || "");
      }

      setLoadingTemplates(false);
    };

    loadTemplates();
  }, []);

  const handleApplyTemplate = async () => {
    if (!staffId) {
      toast.error("Selecciona un empleado.");
      return;
    }
    if (!selectedTemplateId) {
      toast.error("Selecciona una plantilla.");
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
      toast.error("No se pudo aplicar la plantilla.");
    } else {
      toast.success("Plantilla aplicada correctamente.");
      await onSuccess?.();
    }
    setApplying(false);
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const DAYS_MAP = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

  if (loadingTemplates) {
    return (
      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <Loader2 size={14} className="animate-spin" strokeWidth={3} />
        Cargando plantillas...
      </div>
    );
  }

  if (!templates.length) {
    return (
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        No hay plantillas disponibles.
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <select
        value={selectedTemplateId}
        onChange={(event) => setSelectedTemplateId(event.target.value)}
        className="bg-white border-2 border-slate-900 px-3 py-2 text-xs font-black uppercase text-slate-900 shadow-[2px_2px_0_0_#0f172a] focus:outline-none focus:-translate-y-0.5 focus:-translate-x-0.5 focus:shadow-[4px_4px_0_0_#0f172a] transition-all cursor-pointer"
      >
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setShowPreviewModal(true)}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:bg-slate-100 transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none whitespace-nowrap"
      >
        <Eye size={14} strokeWidth={3} />
        Ver Horarios
      </button>

      <button
        type="button"
        onClick={handleApplyTemplate}
        disabled={applying}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-slate-900 bg-cyan-400 text-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:bg-cyan-300 transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-70 disabled:shadow-none whitespace-nowrap"
      >
        {applying ? <Loader2 size={14} className="animate-spin" strokeWidth={3} /> : null}
        {applying ? "Cargando..." : "Aplicar Plantilla"}
      </button>

      {showConfirmModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border-4 border-slate-900 p-8 shadow-[12px_12px_0_0_#0f172a] animate-in zoom-in-95 duration-200">
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              Confirmar Aplicación
            </h4>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              Se reemplazará la semana del empleado con la plantilla: <span className="text-slate-900 bg-yellow-400 px-1 font-black">{selectedTemplate?.name}</span>
            </p>

            {/* PREVIEW */}
            <div className="mt-6 mb-8 border-4 border-slate-900 bg-slate-50 p-4 max-h-[220px] overflow-y-auto">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-2 mb-3">
                Previsualización
              </h5>
              {(!selectedTemplate?.schedule_template_items || selectedTemplate.schedule_template_items.length === 0) ? (
                <p className="text-xs font-bold text-slate-500 uppercase">Sin horarios configurados.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(
                    selectedTemplate.schedule_template_items.reduce((acc, b) => {
                      if (!acc[b.day_of_week]) acc[b.day_of_week] = [];
                      acc[b.day_of_week].push(b);
                      return acc;
                    }, {})
                  ).sort(([a], [b]) => a - b).map(([dayIdx, blocks]) => (
                    <div key={dayIdx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="w-24 shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-900 bg-cyan-400 px-2 py-1 shadow-[2px_2px_0_0_#0f172a] text-center inline-block">
                        {DAYS_MAP[dayIdx]}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {blocks.sort((a,b) => a.start_time.localeCompare(b.start_time)).map((b, i) => (
                          <span key={i} className="text-[10px] font-black text-slate-900 uppercase bg-white border-2 border-slate-900 px-2 py-1 shadow-[2px_2px_0_0_#0f172a]">
                            {b.start_time.slice(0,5)} - {b.end_time.slice(0,5)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-3 rounded-none text-xs font-black uppercase tracking-widest bg-slate-100 border-2 border-slate-900 text-slate-900 hover:bg-slate-200 shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmApplyTemplate}
                className="px-4 py-3 rounded-none text-xs font-black uppercase tracking-widest bg-cyan-400 border-2 border-slate-900 hover:bg-cyan-300 text-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Sí, aplicar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL DE PREVISUALIZACION AISLADO */}
      {showPreviewModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border-4 border-slate-900 p-8 shadow-[12px_12px_0_0_#0f172a] animate-in zoom-in-95 duration-200">
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              Plantilla: {selectedTemplate?.name}
            </h4>
            
            <div className="mt-6 mb-8 border-4 border-slate-900 bg-slate-50 p-4 max-h-[300px] overflow-y-auto">
              {(!selectedTemplate?.schedule_template_items || selectedTemplate.schedule_template_items.length === 0) ? (
                <p className="text-xs font-bold text-slate-500 uppercase">Sin horarios configurados.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(
                    selectedTemplate.schedule_template_items.reduce((acc, b) => {
                      if (!acc[b.day_of_week]) acc[b.day_of_week] = [];
                      acc[b.day_of_week].push(b);
                      return acc;
                    }, {})
                  ).sort(([a], [b]) => a - b).map(([dayIdx, blocks]) => (
                    <div key={dayIdx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="w-24 shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-900 bg-cyan-400 px-2 py-1 shadow-[2px_2px_0_0_#0f172a] text-center inline-block">
                        {DAYS_MAP[dayIdx]}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {blocks.sort((a,b) => a.start_time.localeCompare(b.start_time)).map((b, i) => (
                          <span key={i} className="text-[10px] font-black text-slate-900 uppercase bg-white border-2 border-slate-900 px-2 py-1 shadow-[2px_2px_0_0_#0f172a]">
                            {b.start_time.slice(0,5)} - {b.end_time.slice(0,5)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-3 rounded-none text-xs font-black uppercase tracking-widest bg-cyan-400 border-2 border-slate-900 text-slate-900 hover:bg-cyan-300 shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
