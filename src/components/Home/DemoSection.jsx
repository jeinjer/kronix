import React from 'react';
import { motion } from 'framer-motion';
import { RealCalendarUI } from './HomeUIComponents';

export default function DemoSection() {
  return (
    <section id="demo" className="py-20 px-4 relative scroll-mt-24">
       <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Tu centro de comando</h2>
             <p className="text-slate-600 dark:text-slate-400">Así se ve el control total de tu negocio.</p>
          </div>
          
          <motion.div 
            initial={{ y: 100, opacity: 0, rotateX: 10 }}
            whileInView={{ y: 0, opacity: 1, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="perspective-1000"
          >
             <RealCalendarUI />
          </motion.div>
       </div>
    </section>
  );
}
