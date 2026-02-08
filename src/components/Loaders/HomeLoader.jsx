import React from 'react';
import { motion } from 'framer-motion';

export default function ModernLoader() {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#050507]">
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute w-32 h-32 border-t-2 border-b-2 border-cyan-500/30 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute w-24 h-24 border-r-2 border-l-2 border-blue-600/40 rounded-full"
        />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.9, 1.1, 0.9],
            opacity: 1,
            filter: ["drop-shadow(0 0 0px #06b6d4)", "drop-shadow(0 0 20px #06b6d4)", "drop-shadow(0 0 0px #06b6d4)"]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="relative z-10 flex items-center justify-center bg-linear-to-br from-cyan-500 to-blue-600 w-16 h-16 rounded-2xl shadow-2xl"
        >
          <span className="text-4xl font-black text-white italic tracking-tighter">K</span>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-col items-center gap-2"
      >
        <h2 className="text-white font-bold tracking-[0.3em] text-xs uppercase">Iniciando Kronix</h2>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-1.5 h-1.5 bg-cyan-500 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}