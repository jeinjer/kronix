import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { upsertProfileByRpc, updateUserProfile } from '@/supabase/services/users';

const BackgroundEffects = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-slate-100 dark:bg-slate-950 transition-colors duration-500"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
    </div>
);

export default function Welcome() {
  const navigate = useNavigate();
  const { user, perfil } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isFullNameValid = useMemo(() => {
    const normalized = fullName.trim().replace(/\s+/g, ' ');
    const parts = normalized.split(' ').filter(Boolean);
    return parts.length >= 2 && parts.every(part => part.length >= 2);
  }, [fullName]);

  const isPhoneValid = useMemo(() => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 8;
  }, [phone]);

  const canContinue = isFullNameValid && isPhoneValid && !submitting;

  const handleContinue = async () => {
    if (!canContinue) return;
    setSubmitting(true);
    try {
      const normalizedName = fullName.trim().replace(/\s+/g, ' ');
      const normalizedPhone = phone.trim();

      const { data, error } = await upsertProfileByRpc({
        fullName: normalizedName,
        phone: normalizedPhone,
        avatarUrl: user?.user_metadata?.avatar_url || perfil?.avatar_url || null
      });

      if (error) throw error;

      navigate('/onboarding', { replace: true });
      
    } catch (error) {
      console.error(error); 
      toast.error(error?.message || 'Error guardando datos de perfil');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 font-sans relative transition-colors duration-500">
      <BackgroundEffects />
      
      <div className="max-w-2xl w-full relative z-10">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-10 md:p-14 shadow-2xl text-center transition-colors duration-500"
        >
           <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/20">
              <Rocket className="text-white fill-white" size={40} />
           </div>

           <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
             ¡Cuenta creada con éxito!
           </h1>
           <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 max-w-lg mx-auto">
             Ya sos parte de KRONIX. Para comenzar a gestionar tus turnos y clientes, necesitamos configurar tu primer espacio de trabajo.
           </p>

           <div className="bg-slate-100 dark:bg-slate-950/50 rounded-xl p-6 mb-10 text-left border border-slate-200 dark:border-white/5 transition-colors duration-500">
              <h3 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-4">Próximos pasos (menos de 2 min):</h3>
              <ul className="space-y-3">
                 <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm">
                    <CheckCircle2 className="text-emerald-500" size={18} /> Definir identidad (Nombre y Logo)
                 </li>
                 <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm">
                    <CheckCircle2 className="text-emerald-500" size={18} /> Establecer ubicación geográfica
                 </li>
                 <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm">
                    <CheckCircle2 className="text-emerald-500" size={18} /> Seleccionar rubro de negocio
                 </li>
              </ul>
           </div>

           <div className="text-left mb-8 space-y-4">
             <div>
               <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Nombre y apellido *</label>
               <input
                 type="text"
                 value={fullName}
                 onChange={(e) => setFullName(e.target.value)}
                 placeholder="Ej. Juan Pérez"
                 className="mt-2 w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-cyan-500/60 transition-colors"
               />
             </div>
             <div>
               <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Celular de contacto *</label>
               <input
                 type="tel"
                 value={phone}
                 onChange={(e) => setPhone(e.target.value)}
                 placeholder="Ej. +54 9 11 1234 5678"
                 className="mt-2 w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-cyan-500/60 transition-colors"
               />
             </div>
           </div>

           <button
             type="button"
             onClick={handleContinue}
             disabled={!canContinue}
             className="inline-flex items-center gap-2 px-10 py-4 bg-white text-slate-950 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Comenzar Alta'}
             {!submitting && <ArrowRight size={20} />}
           </button>
        </motion.div>
      </div>
    </div>
  );
}
