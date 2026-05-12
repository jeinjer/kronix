import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  upsertProfileByRpc,
  updateUserProfile,
} from "@/supabase/services/users";

export default function Welcome() {
  const navigate = useNavigate();
  const { user, perfil } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isFullNameValid = useMemo(() => {
    const normalized = fullName.trim().replace(/\s+/g, " ");
    const parts = normalized.split(" ").filter(Boolean);
    return parts.length >= 2 && parts.every((part) => part.length >= 2);
  }, [fullName]);

  const isPhoneValid = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 8;
  }, [phone]);

  const canContinue = isFullNameValid && isPhoneValid && !submitting;

  const handleContinue = async () => {
    if (!canContinue) return;
    setSubmitting(true);
    try {
      const normalizedName = fullName.trim().replace(/\s+/g, " ");
      const normalizedPhone = phone.trim();

      const { data, error } = await upsertProfileByRpc({
        fullName: normalizedName,
        phone: normalizedPhone,
        avatarUrl:
          user?.user_metadata?.avatar_url || perfil?.avatar_url || null,
      });

      if (error) throw error;

      navigate("/onboarding", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Error guardando datos de perfil");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f3fa] text-slate-900 flex items-center justify-center p-6 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif] relative transition-colors duration-500">
      
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#0f172a_2px,transparent_2px)] [background-size:32px_32px]"></div>

      <div className="max-w-2xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-slate-900 rounded-none p-10 md:p-14 shadow-[12px_12px_0_0_#0f172a] text-center transition-colors duration-500 relative"
        >
          {/* Badge */}
          <div className="absolute -top-4 -right-4 bg-cyan-400 border-4 border-slate-900 px-4 py-2 font-black text-slate-900 uppercase tracking-widest text-sm shadow-[4px_4px_0_0_#0f172a] rotate-3 hover:scale-105 transition-transform">
             Paso 1/2
          </div>

          <div className="w-24 h-24 bg-yellow-400 border-4 border-slate-900 rounded-none flex items-center justify-center mx-auto mb-8 shadow-[8px_8px_0_0_#0f172a] -rotate-6 hover:rotate-6 transition-transform">
            <Rocket className="text-slate-900 fill-slate-900" size={48} strokeWidth={2} />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase">
            ¡Cuenta Creada!
          </h1>
          <p className="text-slate-600 font-bold uppercase tracking-widest text-sm mb-10 max-w-lg mx-auto">
            Ya sos parte de <span className="text-slate-900 bg-cyan-400 px-1 border-2 border-slate-900">KRONIX</span>. Para gestionar tus turnos, configurá tu espacio.
          </p>

          <div className="bg-slate-50 rounded-none p-6 mb-10 text-left border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] transition-colors duration-500 flex flex-col gap-4 relative">
             <div className="w-4 h-4 rounded-full bg-slate-900 absolute top-4 left-4 hidden sm:block"></div>
             <div className="w-4 h-4 rounded-full bg-slate-900 absolute top-4 right-4 hidden sm:block"></div>
             
            <h3 className="text-slate-900 font-black text-lg uppercase tracking-tighter sm:text-center shrink-0">
              Próximos pasos (menos de 2 min):
            </h3>
            <ul className="space-y-3 font-bold text-sm tracking-widest uppercase">
              <li className="flex items-center gap-3 text-slate-700 bg-white border-2 border-slate-900 px-3 py-2 shadow-[2px_2px_0_0_#0f172a]">
                <CheckCircle2 className="text-yellow-500 shrink-0" size={24} strokeWidth={3} /> <span className="truncate">Definir identidad (Nombre/Logo)</span>
              </li>
              <li className="flex items-center gap-3 text-slate-700 bg-white border-2 border-slate-900 px-3 py-2 shadow-[2px_2px_0_0_#0f172a] ml-4">
                <CheckCircle2 className="text-yellow-500 shrink-0" size={24} strokeWidth={3} /> <span className="truncate">Establecer ubicación</span>
              </li>
              <li className="flex items-center gap-3 text-slate-700 bg-white border-2 border-slate-900 px-3 py-2 shadow-[2px_2px_0_0_#0f172a] ml-8">
                <CheckCircle2 className="text-yellow-500 shrink-0" size={24} strokeWidth={3} /> <span className="truncate">Seleccionar rubro</span>
              </li>
            </ul>
          </div>

          <div className="text-left mb-10 space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-cyan-400 border-2 border-slate-900 px-2 py-1 shadow-[2px_2px_0_0_#0f172a] mb-2 inline-block">
                Nombre y apellido *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-5 py-4 rounded-none bg-white border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] font-black text-slate-900 outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_#0f172a] transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-yellow-400 border-2 border-slate-900 px-2 py-1 shadow-[2px_2px_0_0_#0f172a] mb-2 inline-block">
                Celular de contacto *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. +54 9 11 1234 5678"
                className="w-full px-5 py-4 rounded-none bg-white border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] font-black text-slate-900 outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_#0f172a] transition-all"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="inline-flex w-full md:w-auto justify-center items-center gap-3 px-10 py-5 bg-yellow-400 text-slate-900 border-4 border-slate-900 rounded-none shadow-[8px_8px_0_0_#0f172a] font-black uppercase tracking-widest text-xl hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0_0_#0f172a] disabled:opacity-50 disabled:cursor-not-allowed active:translate-x-1 active:translate-y-1 active:shadow-none transition-all group cursor-pointer"
          >
            {submitting ? (
              <Loader2 size={24} strokeWidth={3} className="animate-spin text-slate-900" />
            ) : (
              "Comenzar Alta"
            )}
            {!submitting && <ArrowRight size={24} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
