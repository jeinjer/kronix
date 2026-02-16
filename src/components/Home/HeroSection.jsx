import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const [currentRole, setCurrentRole] = useState(0);
  
  const roles = [
    { title: "tu Barbería", color: "text-orange-400" },
    { title: "tu Consultorio", color: "text-cyan-400" },
    { title: "tu Taller", color: "text-emerald-400" },
    { title: "tu Estética", color: "text-pink-400" },
    { title: "tu Negocio", color: "text-indigo-400" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative pt-40 pb-32 px-6 flex flex-col items-center text-center z-10">
      
      {/* BADGE */}
      <motion.div 
         initial={{ y: -20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md transition-colors duration-500"
      >
         <Sparkles size={14} className="text-cyan-400" />
         <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">Software de Gestión v2.0</span>
      </motion.div>

      {/* TITULO */}
      <motion.div 
         initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
         animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
         transition={{ duration: 0.8, ease: "easeOut" }}
         className="mb-6"
      >
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-slate-900 via-slate-700 to-slate-400 dark:from-white dark:via-slate-200 dark:to-slate-500 drop-shadow-[0_0_40px_rgba(34,211,238,0.2)] transition-colors duration-500">
          KRONIX
        </h1>
      </motion.div>

      {/* ANIMACIÓN TEXTO ELÁSTICO */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-3xl md:text-6xl font-bold text-slate-600 dark:text-slate-400 mb-10 leading-tight w-full max-w-5xl transition-colors duration-500">
         <span className="shrink-0">Organizá</span>
         <motion.div 
           layout 
           className="relative flex items-center justify-center min-w-37.5"
           transition={{ type: "spring", stiffness: 300, damping: 25 }}
         >
           <AnimatePresence mode="wait">
              <motion.span
                key={currentRole}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={`${roles[currentRole].color} drop-shadow-lg whitespace-nowrap`}
              >
                {roles[currentRole].title}
              </motion.span>
           </AnimatePresence>
         </motion.div>
      </div>

      <motion.p 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed transition-colors duration-500"
      >
        El tiempo bajo control. Agenda inteligente, bot de WhatsApp y métricas financieras reales. Rápido, fácil y sin vueltas.
      </motion.p>

      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.6 }}
         className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Link to="/registro" className="group relative px-8 py-4 bg-white text-slate-950 rounded-full font-black text-lg overflow-hidden transition-transform hover:scale-105">
           <span className="relative z-10 flex items-center gap-2">
             Comenzar Gratis <ArrowRight className="group-hover:translate-x-1 transition-transform" />
           </span>
        </Link>
        <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 rounded-full border border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
          Ver Demo en Vivo
        </button>
      </motion.div>
    </section>
  );
}
