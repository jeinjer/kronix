import React from 'react';
import { Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 py-16 font-sans transition-colors duration-500">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center md:items-start">
           <div className="flex items-center gap-2 mb-2">
             <div className="flex items-center justify-center w-10 h-10">
                <img 
                  src="/kronix.png" 
                  alt="Kronix Logo" 
                  className="w-8 h-8 object-contain dark:invert drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" 
                />
             </div>
             <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">KRONIX</span>
           </div>
           <p className="text-slate-500 text-sm">El tiempo bajo control.</p>
        </div>

        {/* Developer Info */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
           <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
             <Code2 size={16} />
             <span>Desarrollado por</span>
           </div>
           <p className="text-sm font-bold text-slate-900 dark:text-white tracking-widest uppercase">
             TOMMASYS
           </p>
           <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-1">
             Software Engineering Solutions
           </p>
           <p className="text-slate-700 text-xs mt-4">
             &copy; {new Date().getFullYear()} Todos los derechos reservados.
           </p>
        </div>

      </div>
    </footer>
  );
}
