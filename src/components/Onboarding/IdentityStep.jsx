import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle2, X } from 'lucide-react';

export default function IdentityStep({ formData, setFormData, handleNameChange }) {
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, logoFile: file, logoPreview: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, logoFile: null, logoPreview: null }));
  };

  return (
    <motion.div 
      key="step1" 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="flex-1 flex flex-col gap-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Identidad Corporativa</h2>
        <p className="text-slate-400">Datos visibles para tus clientes.</p>
      </div>

      <div 
        onClick={() => fileInputRef.current.click()}
        className={`relative w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group ${formData.logoPreview ? 'border-indigo-500/50 bg-slate-950' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}`}
      >
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        
        {formData.logoPreview ? (
          <div className="relative w-full h-full p-2 flex items-center justify-center">
            <img src={formData.logoPreview} alt="Logo" className="max-h-full object-contain" />
            <button onClick={removeImage} className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-full hover:bg-red-500 transition-colors z-10"><X size={14} /></button>
            <div className="absolute bottom-2 bg-slate-900/90 px-2 py-1 rounded text-[10px] text-green-400 font-bold border border-green-500/30 flex items-center gap-1">
              <CheckCircle2 size={10} /> LISTO
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            <Upload size={24} className="text-slate-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-slate-300">Subir Logo</p>
            <p className="text-xs text-slate-500 mt-1">Requerido (PNG, JPG)</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Razón Social</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={handleNameChange} 
            placeholder="Ej. KRONIX Central" 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">URL del Sistema</label>
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 opacity-80">
            <span className="text-slate-500 select-none text-sm mr-1">kronix.app/</span>
            <input 
              type="text" 
              value={formData.slug} 
              onChange={(e) => setFormData(prev => ({...prev, slug: e.target.value}))} 
              className="bg-transparent border-none focus:outline-none text-white w-full text-sm font-medium" 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}