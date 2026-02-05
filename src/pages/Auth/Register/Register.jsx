import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Mail, Lock, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/supabase/supabaseClient';

export default function Register() {
  const { register, handleSubmit, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // 1. Validar Whitelist
      const { data: suscripcion } = await supabase
        .from('saas_invitations')
        .select('status')
        .eq('email', data.email)
        .single();

      if (!suscripcion || suscripcion.estado === 'Inactiva') {
        throw new Error('Email no autorizado o cuenta inactiva. Contactá a soporte.');
      }

      // 2. Registrar
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      toast.success('¡Cuenta creada! Revisá tu email para confirmar.');
      navigate('/login');

    } catch (error) {
      toast.error(error.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-[#13131a] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck size={100} /></div>
        
        <h1 className="text-2xl font-black text-white mb-2 relative z-10">REGISTRAR LOCAL</h1>
        <p className="text-slate-400 text-sm mb-6 relative z-10">Solo para dueños con invitación.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Invitado</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input {...register("email", { required: true })} type="email" placeholder="usuario@barberia.com" 
                className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Crear Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input {...register("password", { required: true, minLength: 6 })} type="password" placeholder="••••••••" 
                className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all" />
            </div>
          </div>

          <button disabled={loading} className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <>Validar e Ingresar <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 relative z-10">
          ¿Ya tenés cuenta? <Link to="/login" className="text-cyan-400 hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}