import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    // 1. CAMBIO PRINCIPAL: Fondo claro por defecto (slate-50), oscuro con dark: (...)
    <div className="min-h-screen bg-slate-50 dark:bg-[#050507] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-cyan-500/30 transition-colors duration-500">
      
      {/* --- EFECTOS DE FONDO --- */}
      {/* Ajustamos la opacidad del gradiente para que se vea bien en ambos */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.1),transparent_50%)] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* --- CONTENIDO --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-lg w-full"
      >
        {/* Icono Flotante: Fondo blanco en light, oscuro en dark. Bordes adaptables */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)] mb-8 transition-colors duration-300"
        >
          {/* Icono más oscuro en modo claro para contraste */}
          <FileQuestion size={48} className="text-cyan-600 dark:text-cyan-400 transition-colors duration-300" />
        </motion.div>

        {/* Texto 404 Gigante: Gradiente invertido para modo claro */}
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-400 dark:from-white dark:to-slate-500 tracking-tighter mb-2 transition-all duration-300">
          404
        </h1>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
          Página no encontrada
        </h2>

        <p className="text-slate-600 dark:text-slate-400 text-sm mb-10 leading-relaxed px-8 transition-colors duration-300">
          Parece que la página que buscás se cortó el pelo y desapareció. 
          Puede que el enlace esté roto o que la hayamos movido.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all flex items-center justify-center gap-2 group duration-300"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Volver atrás
          </button>

          <Link 
            to="/"
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 hover:scale-105"
          >
            <Home size={16} />
            Ir al Inicio
          </Link>
        </div>

        {/* Footer Sutil */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
          <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-widest font-bold">
            ERROR CODE: PAGE_NOT_FOUND
          </p>
        </div>

      </motion.div>
    </div>
  );
}