import React, { useEffect, useRef, useState } from 'react';
import { Mail, Phone, Lock, ArrowRight, Loader2, Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  deleteUserAvatarFile,
  updateProfileAvatar,
  updateUserProfile,
  uploadUserAvatar
} from '@/supabase/services/users';
import PasswordModal from './PasswordModal';
import { convertToWebP } from '@/utils/imageOptimizer';

export default function Profile() {
  const { user, perfil, refreshAuthData } = useAuth();
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || perfil?.avatar_url || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setAvatarUrl(user?.user_metadata?.avatar_url || perfil?.avatar_url || '');
  }, [user?.user_metadata?.avatar_url, perfil?.avatar_url]);

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    return `${name[0]}****${name.slice(-1)}@${domain}`;
  };

  const phoneValue = perfil?.phone || user?.user_metadata?.phone || 'Sin celular cargado';

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 2MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const previousAvatarUrl = avatarUrl;
      const webpFile = await convertToWebP(file, 0.8);
      const { url, error: uploadError } = await uploadUserAvatar(webpFile, user.id);
      if (uploadError || !url) throw uploadError || new Error('No se pudo subir el avatar');

      const [{ error: metadataError }, { error: profileError }] = await Promise.all([
        updateUserProfile({ avatar_url: url }),
        updateProfileAvatar(user.id, url)
      ]);

      if (metadataError) throw metadataError;
      if (profileError) throw profileError;

      setAvatarUrl(url);

      if (previousAvatarUrl && previousAvatarUrl !== url) {
        await deleteUserAvatarFile(previousAvatarUrl);
      }

      await refreshAuthData();

      toast.success('Avatar actualizado');
    } catch (error) {
      toast.error('Error al actualizar el avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl || !user?.id) return;

    try {
      setIsRemovingAvatar(true);
      const previousAvatarUrl = avatarUrl;

      const [{ error: metadataError }, { error: profileError }] = await Promise.all([
        updateUserProfile({ avatar_url: null }),
        updateProfileAvatar(user.id, null)
      ]);

      if (metadataError) throw metadataError;
      if (profileError) throw profileError;

      setAvatarUrl('');
      await deleteUserAvatarFile(previousAvatarUrl);
      await refreshAuthData();
      toast.success('Avatar eliminado');
    } catch (error) {
      toast.error('Error al eliminar el avatar');
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  return (
    <aside className="space-y-6">
      <div className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl transition-colors duration-500">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative group mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-3xl font-black text-white overflow-hidden border-4 border-[#0a0a0f]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : user?.email?.charAt(0).toUpperCase()}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar || isRemovingAvatar}
              className="absolute bottom-0 right-0 p-2 bg-cyan-600 hover:bg-cyan-500 rounded-full text-white transition-all shadow-lg disabled:opacity-60"
            >
              {isUploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={isUploadingAvatar || isRemovingAvatar}
                className="absolute top-0 right-0 p-1.5 bg-red-600 hover:bg-red-500 rounded-full text-white transition-all shadow-lg disabled:opacity-60"
              >
                {isRemovingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {perfil?.full_name || user?.user_metadata?.full_name || 'Usuario'}
          </h2>
          <p className="text-slate-500 text-sm flex items-center gap-2 justify-center mt-1">
            <Mail size={14} /> {maskEmail(user?.email)}
          </p>
          <p className="text-slate-500 text-sm flex items-center gap-2 justify-center mt-1">
            <Phone size={14} /> {phoneValue}
          </p>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-white/5">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3 text-slate-300">
              <Lock size={18} className="text-slate-500 group-hover:text-cyan-400" />
              <span className="text-sm font-medium">Cambiar contraseña</span>
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
      <PasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </aside>
  );
}
