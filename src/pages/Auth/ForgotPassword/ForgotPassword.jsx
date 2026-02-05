import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Send, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/supabase/supabaseClient';

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSuccess(true);
      toast.success('Correo enviado');
    } catch (error) {
      toast.error(error.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Clases reutilizables para mantener consistencia
  const cardClasses = "w-full max-w-md bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 shadow-2xl transition-colors duration-300";
  const inputBg = "bg-slate-50 dark:bg-[#0a0a0f]";
  const inputBorder = "border-slate-200 dark:border-white/10";
  const textMain = "text-slate-900 dark:text-white";
  const textMuted = "text-slate-500 dark:text-slate-400";

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 font-sans">
        <div className={`${cardClasses} text-center`}>
          <div className="mx-auto w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-100 dark:border-emerald-500/20">
            <Send className="text-emerald-600 dark:text-emerald-400" size={32} />
          </div>
          <h2 className={`text-2xl font-black ${textMain} mb-2 tracking-tight`}>¡Revisá tu bandeja!</h2>
          <p className={`${textMuted} text-sm mb-6 leading-relaxed`}>
            Te enviamos un enlace para restablecer tu contraseña. Si no lo ves, revisá la carpeta de Spam.
          </p>
          <Link to="/login" className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 font-sans">
      <div className={`${cardClasses} relative overflow-hidden`}>
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Zap className="text-slate-900 dark:text-white" size={120} />
        </div>

        <div className="relative z-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors mb-6">
            <ArrowLeft size={14} /> Volver
          </Link>

          <h1 className={`text-3xl font-black ${textMain} mb-2 uppercase tracking-tighter`}>Recuperar Acceso</h1>
          <p className={`${textMuted} text-sm mb-8 font-medium`}>
            Ingresá tu email y te enviaremos las instrucciones.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Email Registrado</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors" size={18} />
                <input
                  {...register("email", { required: true })}
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  className={`w-full pl-12 pr-4 py-4 ${inputBg} border ${inputBorder} rounded-2xl ${textMain} outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-400`}
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full py-4 bg-slate-900 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 hover:bg-slate-800 dark:hover:from-cyan-500 dark:hover:to-blue-500 text-white font-black rounded-2xl shadow-xl transition-all shadow-slate-200/50 dark:shadow-cyan-900/20 flex items-center justify-center gap-2 transform active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Enviar Enlace <Send size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}