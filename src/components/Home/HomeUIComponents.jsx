import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export const RealCalendarUI = () => {
  return (
    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl w-full max-w-5xl mx-auto font-sans relative z-10 transition-colors duration-500">
      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-white/5 flex flex-wrap justify-between items-center gap-4 transition-colors duration-500">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-amber-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <div className="flex gap-2 bg-slate-200 dark:bg-slate-950/50 p-1 rounded-lg border border-slate-300 dark:border-white/5 transition-colors duration-500">
           <div className="px-4 py-1 bg-indigo-600 text-white rounded text-xs font-bold">Agenda</div>
           <div className="px-4 py-1 text-slate-700 dark:text-slate-400 text-xs font-medium hover:text-slate-900 dark:hover:text-white cursor-pointer">Métricas</div>
           <div className="px-4 py-1 text-slate-700 dark:text-slate-400 text-xs font-medium hover:text-slate-900 dark:hover:text-white cursor-pointer">Caja</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-7 h-[400px] bg-slate-100 dark:bg-slate-950/50 relative transition-colors duration-500">
         <div className="hidden md:block col-span-1 border-r border-slate-200 dark:border-white/5 p-4 space-y-12 text-right text-xs text-slate-500 font-mono">
            <div>09:00</div>
            <div>11:00</div>
            <div>13:00</div>
            <div>15:00</div>
         </div>
         {[1,2,3,4,5,6].map((day) => (
            <div key={day} className="col-span-1 border-r border-slate-200 dark:border-white/5 relative group hover:bg-slate-100 dark:hover:bg-white/[0.02] transition-colors">
               <div className="h-full w-full absolute inset-0 pointer-events-none border-b border-dashed border-slate-200 dark:border-white/5 top-1/4"></div>
               <div className="h-full w-full absolute inset-0 pointer-events-none border-b border-dashed border-slate-200 dark:border-white/5 top-2/4"></div>
               <div className="h-full w-full absolute inset-0 pointer-events-none border-b border-dashed border-slate-200 dark:border-white/5 top-3/4"></div>
               {day === 2 && (
                  <motion.div 
                     initial={{ scale: 0.8, opacity: 0 }}
                     whileInView={{ scale: 1, opacity: 1 }}
                     transition={{ delay: 0.2 }}
                     className="absolute top-[15%] left-2 right-2 p-3 rounded-lg bg-indigo-500/20 border-l-2 border-indigo-500 hover:bg-indigo-500/30 cursor-pointer"
                  >
                     <div className="text-xs font-bold text-indigo-200">Corte + Barba</div>
                     <div className="text-[10px] text-indigo-300 mt-1">Juan Pérez</div>
                  </motion.div>
               )}
               {day === 4 && (
                  <motion.div 
                     initial={{ scale: 0.8, opacity: 0 }}
                     whileInView={{ scale: 1, opacity: 1 }}
                     transition={{ delay: 0.4 }}
                     className="absolute top-[60%] left-2 right-2 p-3 rounded-lg bg-cyan-500/20 border-l-2 border-cyan-500 hover:bg-cyan-500/30 cursor-pointer"
                  >
                     <div className="text-xs font-bold text-cyan-200">Limpieza Facial</div>
                     <div className="text-[10px] text-cyan-300 mt-1">Maria Gonzalez</div>
                  </motion.div>
               )}
            </div>
         ))}
      </div>
    </div>
  );
};

export const BotChatUI = () => {
  return (
    <div className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/50 rounded-[2rem] overflow-hidden shadow-2xl relative transition-colors duration-500">
      <div className="bg-slate-100 dark:bg-[#0b101b] p-4 flex items-center gap-3 border-b border-slate-300 dark:border-slate-800 transition-colors duration-500">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">
            <Zap size={20} className="fill-white" />
        </div>
        <div>
          <div className="text-slate-900 dark:text-white font-bold text-sm">Kronia</div>
          <div className="flex items-center gap-1">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
             <span className="text-slate-400 text-xs">En línea</span>
          </div>
        </div>
      </div>
      <div className="h-[320px] bg-slate-100 dark:bg-slate-950 p-4 space-y-4 flex flex-col relative overflow-hidden transition-colors duration-500">
         <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="self-start bg-slate-800 border border-slate-700 text-slate-200 p-3 rounded-2xl rounded-tl-none max-w-[85%] text-sm shadow-lg z-10"
         >
           Hola! 👋 ¿Te gustaría reservar un turno para esta semana?
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ delay: 1.5 }}
           className="self-end bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-lg z-10 font-medium"
         >
           Sí, tenés algo para el viernes a la tarde?
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ delay: 2.5 }}
           className="self-start bg-slate-800 border border-slate-700 text-slate-200 p-3 rounded-2xl rounded-tl-none max-w-[90%] text-sm shadow-lg z-10"
         >
           <p className="mb-2">¡Sí! Tengo estos horarios disponibles:</p>
           <div className="flex gap-2 flex-wrap">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:bg-emerald-500/30">16:00</span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:bg-emerald-500/30">17:30</span>
           </div>
         </motion.div>
      </div>
    </div>
  );
};
