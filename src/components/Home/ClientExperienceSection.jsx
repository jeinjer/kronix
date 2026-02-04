import React from 'react';
import { Smartphone, CheckCircle2 } from 'lucide-react';
import { BotChatUI } from './HomeUIComponents';

export default function ClientExperienceSection() {
  return (
    <section className="py-24 bg-slate-900/50 border-y border-white/5">
       <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/20 blur-[100px] rounded-full"></div>
             <BotChatUI />
          </div>
          <div className="order-1 md:order-2">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold mb-6">
                <Smartphone size={14} /> CERO FRICCIÓN
             </div>
             <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
               Tus clientes <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">no instalan nada.</span>
             </h2>
             <p className="text-slate-400 text-lg mb-8 leading-relaxed">
               Eliminamos la barrera de entrada. Tus clientes reservan directo desde WhatsApp o Web en segundos. El bot KRONIX confirma, agenda y recuerda por vos.
             </p>
             <div className="space-y-4">
                {[
                  "Asistente virtual activo 24/7.",
                  "Recordatorios automáticos para reducir ausentismo.",
                  "Link personalizado con tu marca (kronix.app/tu-negocio)."
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                     <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                     </div>
                     <span className="text-slate-300">{item}</span>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </section>
  );
}