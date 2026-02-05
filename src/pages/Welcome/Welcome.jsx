import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, CheckCircle2, ArrowRight } from 'lucide-react';

const BackgroundEffects = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-slate-950"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
    </div>
);

export default function Welcome() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative">
      <BackgroundEffects />
      
      <div className="max-w-2xl w-full relative z-10">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 md:p-14 shadow-2xl text-center"
        >
           <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/20">
              <Rocket className="text-white fill-white" size={40} />
           </div>

           <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
             ¡Cuenta creada con éxito!
           </h1>
           <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto">
             Ya sos parte de KRONIX. Para comenzar a gestionar tus turnos y clientes, necesitamos configurar tu primer espacio de trabajo.
           </p>

           <div className="bg-slate-950/50 rounded-xl p-6 mb-10 text-left border border-white/5">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Próximos pasos (menos de 2 min):</h3>
              <ul className="space-y-3">
                 <li className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle2 className="text-emerald-500" size={18} /> Definir identidad (Nombre y Logo)
                 </li>
                 <li className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle2 className="text-emerald-500" size={18} /> Establecer ubicación geográfica
                 </li>
                 <li className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle2 className="text-emerald-500" size={18} /> Seleccionar rubro de negocio
                 </li>
              </ul>
           </div>

           <Link 
             to="/onboarding" 
             className="inline-flex items-center gap-2 px-10 py-4 bg-white text-slate-950 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
           >
             Comenzar Alta <ArrowRight size={20} />
           </Link>
        </motion.div>
      </div>
    </div>
  );
}