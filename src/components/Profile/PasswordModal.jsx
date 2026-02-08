import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Lock, Loader2, X, CheckCircle2, Circle } from 'lucide-react';
import { updatePassword } from '@/supabase/services/users';

export default function PasswordModal({ isOpen, onClose }) {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  
  const password = watch('password', '');
  const confirmPassword = watch('confirmPassword', '');

  const checks = [
    { label: 'Mínimo 6 caracteres', valid: password.length >= 6 },
    { label: 'Coinciden', valid: password === confirmPassword && password !== '' }
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    const { error } = await updatePassword(data.password);
    
    if (error) {
      toast.error('Error al actualizar la contraseña');
    } else {
      toast.success('Contraseña actualizada con éxito');
      reset();
      onClose();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#13131a] border border-white/10 rounded-2xl p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Cambiar Contraseña</h2>
        <p className="text-slate-400 text-sm mb-6">Ingresá tu nueva clave de acceso.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nueva Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                {...register("password", { required: true, minLength: 6 })} 
                type="password" 
                placeholder="••••••••" 
                className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Confirmar Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                {...register("confirmPassword", { 
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })} 
                type="password" 
                placeholder="••••••••" 
                className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all" 
              />
            </div>
          </div>

          <div className="bg-[#0a0a0f] p-4 rounded-xl space-y-2">
            {checks.map((check, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs font-medium ${check.valid ? 'text-cyan-400' : 'text-slate-600'}`}>
                {check.valid ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                {check.label}
              </div>
            ))}
          </div>

          <button 
            disabled={loading || !checks.every(c => c.valid)} 
            className="w-full py-3 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}