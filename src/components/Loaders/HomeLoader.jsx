import React from "react";
import { motion } from "framer-motion";

const DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

export default function HomeLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f0f3fa]">
      {/* Calendar container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        {/* Calendar card */}
        <div className="w-52 sm:w-64 bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden">
          {/* Calendar header - month bar */}
          <motion.div 
            className="bg-cyan-400 border-b-4 border-slate-900 px-4 py-3 flex items-center justify-between"
            animate={{ backgroundColor: ["#22d3ee", "#FEE324", "#22d3ee"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-slate-900 bg-white"
              />
              <span className="text-sm font-black uppercase tracking-widest text-slate-900">Kronix</span>
            </div>
            <motion.div
              animate={{ width: ["20px", "40px", "20px"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-2 bg-slate-900 rounded-none"
            />
          </motion.div>

          {/* Day name headers */}
          <div className="grid grid-cols-7 border-b-2 border-slate-900">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} className="py-1.5 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells with wave animation */}
          <div className="grid grid-cols-7 p-1 gap-[2px]">
            {DAYS.map((day, i) => {
              const row = Math.floor(i / 7);
              const col = i % 7;
              const delay = (row + col) * 0.08;
              const isHighlight = day === 8 || day === 15;

              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0, borderRadius: "50%" }}
                  animate={{
                    scale: [0, 1, 1, 0],
                    borderRadius: ["50%", "0%", "0%", "50%"],
                    backgroundColor: isHighlight
                      ? ["#FEE324", "#22d3ee", "#FEE324", "#22d3ee"]
                      : ["#f1f5f9", "#ffffff", "#f1f5f9", "#ffffff"],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: delay,
                    ease: "easeInOut",
                  }}
                  className="aspect-square flex items-center justify-center border-2 border-slate-900"
                >
                  <motion.span
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: delay,
                      ease: "easeInOut",
                    }}
                    className="text-[10px] sm:text-xs font-black text-slate-900"
                  >
                    {day}
                  </motion.span>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom bar morphing */}
          <div className="border-t-2 border-slate-900 px-3 py-2 flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  width: ["20%", "50%", "30%", "20%"],
                  height: ["6px", "10px", "6px", "10px"],
                  backgroundColor: ["#0f172a", "#FEE324", "#22d3ee", "#0f172a"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
                className="rounded-none"
              />
            ))}
          </div>
        </div>

        {/* Floating decorative elements */}
        <motion.div
          animate={{ 
            y: [0, -12, 0],
            x: [0, 6, 0],
            rotate: [0, 15, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 border-3 border-slate-900 shadow-[3px_3px_0_0_#0f172a]"
        />
        <motion.div
          animate={{ 
            y: [0, 8, 0],
            x: [0, -8, 0],
            rotate: [0, -20, 0],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute -bottom-3 -left-3 w-6 h-6 bg-cyan-400 border-3 border-slate-900 shadow-[2px_2px_0_0_#0f172a]"
        />
      </motion.div>

      {/* Text below */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <h2 className="text-slate-900 font-black tracking-widest text-xs uppercase">
          Preparando tu agenda
        </h2>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.6, 1],
                backgroundColor: ["#0f172a", "#FEE324", "#0f172a"],
              }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
              className="w-2.5 h-2.5 bg-slate-900 border-2 border-slate-900"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
