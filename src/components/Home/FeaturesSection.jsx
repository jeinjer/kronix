import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart, Users } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-6 relative scroll-mt-24">
       <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
             <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Inteligencia de Negocio
             </h2>
             <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Deja de adivinar. KRONIX transforma tus turnos en datos para que tomes mejores decisiones.
             </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
             <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-3xl hover:border-indigo-500/50 transition-colors group">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                   <TrendingUp size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Proyección de Ingresos</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Visualizá tu facturación estimada del mes basada en las reservas futuras.</p>
             </motion.div>
             <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-3xl hover:border-indigo-500/50 transition-colors group">
                <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                   <PieChart size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Servicios Rentables</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Descubrí qué servicios te generan más ganancia por hora trabajada.</p>
             </motion.div>
             <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-3xl hover:border-indigo-500/50 transition-colors group">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                   <Users size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Fidelización</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Identificá a tus clientes VIP y detectá automáticamente a los inactivos.</p>
             </motion.div>
          </div>
       </div>
    </section>
  );
}
