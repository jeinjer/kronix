import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/supabase/supabaseClient';

export default function Login() {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      toast.error('Credenciales incorrectas');
    } else {
      toast.success('¡Bienvenido!');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-[#13131a] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-white mb-2">INICIAR SESIÓN</h1>
        <p className="text-slate-400 text-sm mb-6">Accedé a tu panel de control.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input {...register("email", { required: true })} type="email" placeholder="tu@email.com" 
                className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input {...register("password", { required: true })} type="password" placeholder="••••••••" 
                className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all" />
            </div>
          </div>

          <button disabled={loading} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <>Ingresar <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿No tenés cuenta? <Link to="/registro" className="text-cyan-400 hover:underline">Registrar mi local</Link>
        </p>
      </div>
    </div>
  );
}