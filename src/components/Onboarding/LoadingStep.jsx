import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function LoadingStep({ name }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="absolute inset-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center transition-colors duration-500"
    >
      <Loader2 size={48} className="text-cyan-400 animate-spin mb-6" />
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">KRONIX AI</h2>
      <p className="text-slate-600 dark:text-slate-400 animate-pulse">Inicializando instancia para {name}...</p>
    </motion.div>
  );
}
