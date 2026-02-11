import React from 'react';
import { motion } from 'framer-motion';
import { LayoutTemplate, Building2, Navigation, CheckCircle2 } from 'lucide-react';

const industries = [
  { id: 'beauty', label: 'Estética & Wellness', desc: 'Barberías, Spas, Salones.', icon: LayoutTemplate, color: 'text-orange-400', border: 'border-orange-500/30' },
  { id: 'health', label: 'Salud & Medicina', desc: 'Consultorios, Clínicas.', icon: Building2, color: 'text-cyan-400', border: 'border-cyan-500/30' },
  { id: 'automotive', label: 'Sector Automotriz', desc: 'Talleres, Detailing.', icon: Navigation, color: 'text-emerald-400', border: 'border-emerald-500/30' },
  { id: 'services', label: 'Servicios Profesionales', desc: 'Consultoría, Legal.', icon: LayoutTemplate, color: 'text-indigo-400', border: 'border-indigo-500/30' },
];

export default function IndustryStep({ formData, setFormData }) {
  return (
    <motion.div 
      key="step3" 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="flex-1 flex flex-col gap-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Segmentación</h2>
        <p className="text-slate-600 dark:text-slate-400">Configuración base del motor de KRONIX.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {industries.map((ind) => (
          <div 
            key={ind.id} 
            onClick={() => setFormData(prev => ({...prev, industry: ind.id}))} 
            className={`relative p-5 rounded-xl border cursor-pointer transition-all duration-200 group ${formData.industry === ind.id ? `bg-slate-200 dark:bg-slate-800 ${ind.border} ring-1 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 ring-indigo-500` : 'bg-slate-100 dark:bg-slate-950/40 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-700'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-white/5`}>
              <ind.icon size={20} className={ind.color} />
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-1">{ind.label}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">{ind.desc}</p>
            {formData.industry === ind.id && (<div className="absolute top-4 right-4 text-indigo-500"><CheckCircle2 size={18} /></div>)}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
