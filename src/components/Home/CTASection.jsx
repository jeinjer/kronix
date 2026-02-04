import React from 'react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-slate-950 pointer-events-none"></div>
      <div className="relative z-10 text-center max-w-3xl">
        <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight">
          ¿Listo para escalar?
        </h2>
        <p className="text-xl text-indigo-200/60 mb-12">
          Unite a la plataforma que eligen los profesionales que valoran su tiempo.
        </p>
        <Link to="/registro">
          <button className="px-12 py-6 bg-white text-indigo-950 text-xl font-black rounded-full shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] hover:scale-105 transition-transform">
            CREAR CUENTA GRATIS
          </button>
        </Link>
        <p className="mt-6 text-sm text-slate-500 font-medium tracking-wide">NO REQUIERE TARJETA DE CRÉDITO</p>
      </div>
    </section>
  );
}