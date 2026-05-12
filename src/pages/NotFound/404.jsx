import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f0f3fa] flex items-center justify-center p-4 relative overflow-hidden font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #0f172a 0px,
            #0f172a 2px,
            transparent 2px,
            transparent 20px
          )`
        }}></div>
      </div>

      <div className="relative z-10 text-center max-w-xl w-full">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-400 border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] mb-8 -rotate-6">
          <AlertTriangle size={48} strokeWidth={2} className="text-slate-900" />
        </div>

        {/* 404 Text */}
        <h1 className="text-[120px] sm:text-[160px] font-black text-slate-900 tracking-tighter leading-none mb-2 uppercase">
          404
        </h1>

        <div className="bg-slate-900 text-white inline-block px-6 py-2 mb-6 border-4 border-slate-900 shadow-[4px_4px_0_0_#FEE324] -rotate-1">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
            Página no encontrada
          </h2>
        </div>

        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-10 max-w-md mx-auto">
          Parece que la página que buscás se cortó el pelo y desapareció. Puede
          que el enlace esté roto o que la hayamos movido.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 bg-white border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_#0f172a] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all font-black text-sm uppercase tracking-widest text-slate-900 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} strokeWidth={3} />
            Volver atrás
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-3 bg-cyan-400 border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_#0f172a] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all font-black text-sm uppercase tracking-widest text-slate-900 flex items-center justify-center gap-2"
          >
            <Home size={16} strokeWidth={3} />
            Ir al Inicio
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-4 border-slate-900">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
            ERROR CODE: PAGE_NOT_FOUND
          </p>
        </div>
      </div>
    </div>
  );
}
