import React, { useState } from 'react';
import { Mail, Phone, Lock, ArrowRight, Loader2, Plus, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/supabase/services/users';
import PasswordModal from './PasswordModal';

export default function Profile() {
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    return `${name[0]}****${name.slice(-1)}@${domain}`;
  };

  const handleUpdatePhone = async () => {
    setIsUpdatingPhone(true);
    const { error } = await updateUserProfile({ phone });
    if (!error) {
      toast.success('Teléfono actualizado');
    } else {
      toast.error('Error al actualizar el teléfono');
    }
    setIsUpdatingPhone(false);
  };

  return (
    <aside className="space-y-6">
      <div className="bg-[#13131a] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative group mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-3xl font-black text-white overflow-hidden border-4 border-[#0a0a0f]">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : user?.email?.charAt(0).toUpperCase()}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-cyan-600 hover:bg-cyan-500 rounded-full text-white transition-all shadow-lg">
              <Camera size={16} />
            </button>
          </div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            {user?.user_metadata?.full_name || 'Usuario'}
          </h2>
          <p className="text-slate-500 text-sm flex items-center gap-2 justify-center mt-1">
            <Mail size={14} /> {maskEmail(user?.email)}
          </p>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Celular</label>
            <div className="flex gap-2">
              <input 
                type="tel"
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54..."
                className="flex-1 px-4 py-2 bg-[#0a0a0f] border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 text-sm transition-all" 
              />
              <button 
                onClick={handleUpdatePhone} 
                disabled={isUpdatingPhone} 
                className="p-2 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-xl transition-all"
              >
                {isUpdatingPhone ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3 text-slate-300">
              <Lock size={18} className="text-slate-500 group-hover:text-cyan-400" />
              <span className="text-sm font-medium">Contraseña</span>
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
      <PasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </aside>
  );
}