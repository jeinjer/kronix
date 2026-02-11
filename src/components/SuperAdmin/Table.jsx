import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Ban, RefreshCw, ExternalLink } from 'lucide-react';

export default function SuperAdminTable({ suscripciones, onUpdateEstado, onRegistrarPago }) {
  
  // Mapeo de estilos para los estados que definiste
  const statusStyles = {
    'Activa': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'En espera': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Inactiva': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Sin activar': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  return (
    <div className="w-full overflow-hidden bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl transition-colors duration-500">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-100 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
            <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-500">Cliente & Proyecto</th>
            <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-500">Estado Suscripción</th>
            <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-500">Próximo Vencimiento</th>
            <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-500 text-right">Acciones de Gestión</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
          <AnimatePresence>
            {suscripciones.map((s) => (
              <motion.tr 
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group hover:bg-slate-100 dark:hover:bg-white/[0.02] transition-all duration-300"
              >
                {/* Cliente & Proyecto */}
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">{s.email}</span>
                    <span className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-600 text-white uppercase tracking-tighter">
                        {s.proyecto_id || 'BARBER-V1'}
                      </span>
                      <span className="text-slate-500 text-xs font-medium">{s.nombre_dueno || 'Sin nombre'}</span>
                    </span>
                  </div>
                </td>

                {/* Estado */}
                <td className="p-6">
                  <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${statusStyles[s.estado]}`}>
                    {s.estado}
                  </span>
                </td>

                {/* Vencimiento */}
                <td className="p-6">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-mono text-sm">
                    <Clock size={14} className="text-slate-500" />
                    {s.fecha_limite_pago ? new Date(s.fecha_limite_pago).toLocaleDateString() : 'N/A'}
                  </div>
                </td>

                {/* Acciones */}
                <td className="p-6">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onRegistrarPago(s.id)}
                      className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                      title="Registrar Pago / Activar"
                    >
                      <Zap size={18} />
                    </button>
                    <button 
                      onClick={() => onUpdateEstado(s.id, 'Inactiva')}
                      className="p-3 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                      title="Suspender Acceso"
                    >
                      <Ban size={18} />
                    </button>
                    <button 
                      className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                      title="Ver Detalles"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
