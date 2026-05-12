import React from "react";
import { Code2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t-8 border-cyan-400 py-16 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif] transition-colors duration-500">
      <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Logo Section */}
        <div className="flex flex-col items-center md:items-start text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 sm:h-14 w-32 sm:w-40 relative group isolate">
              <img src="/logo.png" alt="Kronix Logo" className="absolute left-0 top-1/2 -translate-y-1/2 w-[140px] sm:w-[160px] max-w-none h-auto object-contain" />
            </div>
          </div>
          <p className="text-cyan-400 font-black tracking-widest uppercase text-sm border-b-2 border-yellow-400 pb-1">El tiempo bajo control.</p>
        </div>

        {/* Developer Info */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">
            <Code2 size={16} className="text-yellow-400" />
            <span>Desarrollado por</span>
          </div>
          <p className="text-2xl font-black text-white tracking-tighter uppercase mb-1 bg-cyan-400 text-slate-900 px-3 py-1 shadow-[2px_2px_0_0_#2dd4bf]">
            TOMMASYS
          </p>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-6">
            &copy; {new Date().getFullYear()} Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
