import React from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

export default function LoadingStep({ name }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-[#f0f3fa] z-50 flex flex-col items-center justify-center text-center p-8"
    >
      <div className="relative mb-10">
        <div className="w-24 h-24 bg-yellow-400 border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] flex items-center justify-center transform -rotate-6 relative z-10">
           <Loader2 size={48} className="text-slate-900 animate-spin" strokeWidth={3} />
        </div>
      </div>

      <div className="bg-cyan-400 border-4 border-slate-900 px-6 py-3 shadow-[6px_6px_0_0_#0f172a] mb-6 transform rotate-2">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center justify-center gap-2">
          <Sparkles className="text-slate-900" size={24} strokeWidth={3} /> KRONIX
        </h2>
      </div>

      <p className="text-[12px] md:text-sm font-black text-slate-900 uppercase tracking-widest mt-2 animate-pulse bg-white border-2 border-slate-900 px-4 py-2 shadow-[4px_4px_0_0_#0f172a]">
        Inicializando sede para <span className="text-cyan-600">{name}</span>...
      </p>
    </motion.div>
  );
}
