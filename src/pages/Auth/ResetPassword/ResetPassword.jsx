import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/supabase/supabaseClient';

export default function ResetPassword() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const password = watch('password', '');

  // Validar sesión activa (link válido)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("El enlace es inválido o ha expirado.");
        navigate('/login');
      }
    });
  }, [navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) throw error;

      toast.success('¡Contraseña actualizada!');
      setTimeout(() => navigate('/dashboard'), 2000);
      
    } catch (error) {
      toast.error(error.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  // Clases reutilizables
  const cardClasses = "w-full max-w-md bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 shadow-2xl transition-colors duration-300";
  const inputBg = "bg-slate-50 dark:bg-[#0a0a0f]";
  const inputBorder = "border-slate-200 dark:border-white/10";
  const textMain = "text-slate-900 dark:text-white";
  const textMuted = "text-slate-500 dark:text-slate-400";

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 font-sans">
      <div className={cardClasses}>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 mb-4 border border-cyan-100 dark:border-cyan-500/30">
            <Lock size={24} />
          </div>
          <h1 className={`text-2xl font-black ${textMain} uppercase tracking-tight`}>Nueva Contraseña</h1>
          <p className={`${textMuted} text-sm mt-2 font-medium`}>Creá una clave segura para tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Nueva Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input
                {...register("password", { 
                  required: "Requerido", 
                  minLength: { value: 6, message: "Mínimo 6 caracteres" } 
                })}
                type="password"
                placeholder="••••••••"
                className={`w-full pl-12 pr-4 py-4 ${inputBg} border ${inputBorder} rounded-2xl ${textMain} outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-400`}
              />
            </div>
            {errors.password && <span className="text-rose-500 text-[10px] ml-1 flex items-center gap-1 font-bold"><AlertCircle size={10}/> {errors.password.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Confirmar Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input
                {...register("confirmPassword", {
                  required: "Requerido",
                  validate: (val) => val === password || "Las contraseñas no coinciden"
                })}
                type="password"
                placeholder="••••••••"
                className={`w-full pl-12 pr-4 py-4 ${inputBg} border ${inputBorder} rounded-2xl ${textMain} outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-400`}
              />
            </div>
            {errors.confirmPassword && <span className="text-rose-500 text-[10px] ml-1 flex items-center gap-1 font-bold"><AlertCircle size={10}/> {errors.confirmPassword.message}</span>}
          </div>

          <button
            disabled={loading}
            className="w-full py-4 mt-2 bg-slate-900 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 hover:bg-slate-800 dark:hover:from-cyan-500 dark:hover:to-blue-500 text-white font-black rounded-2xl shadow-xl transition-all shadow-slate-200/50 dark:shadow-cyan-900/20 flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Actualizar Clave <CheckCircle size={18} /></>}
          </button>
        </form>

      </div>
    </div>
  );
}