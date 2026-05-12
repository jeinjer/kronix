import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, X, Loader2, Eye, Edit2 } from "lucide-react";
// Importamos la utilidad
import { convertToWebP } from "../../utils/imageOptimizer";

export default function IdentityStep({
  formData,
  setFormData,
  handleNameChange,
}) {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false); // Estado para mostrar "Optimizando..."

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      alert("Solo se permiten archivos JPG o PNG.");
      return;
    }

    try {
      setIsProcessing(true);

      // --- CONVERSIÓN MÁGICA A WEBP CON RESIZE (800x800 max) ---
      const webpFile = await convertToWebP(file, 0.8, 800, 800);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          logoFile: webpFile,
          logoPreview: reader.result,
        }));
        setIsProcessing(false);
      };
      reader.readAsDataURL(webpFile);
    } catch (error) {
      console.error("Error optimizando imagen:", error);
      alert("Hubo un error procesando la imagen.");
      setIsProcessing(false);
    }
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setFormData((prev) => ({ ...prev, logoFile: null, logoPreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
          Crea tu identidad
        </h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* FOTO CONTAINER REDUCIDO Y BRUTALISTA */}
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-cyan-400 border-2 border-slate-900 inline-block px-2 py-0.5 shadow-[2px_2px_0_0_#0f172a] self-start">
            Logo / Foto
          </label>
          <div
            onClick={() => !formData.logoPreview && !isProcessing && fileInputRef.current.click()}
            className={`relative w-32 h-32 md:w-40 md:h-40 border-4 border-slate-900 flex flex-col items-center justify-center transition-all group overflow-hidden bg-white
            ${formData.logoPreview ? "shadow-[4px_4px_0_0_#0f172a]" : "shadow-[6px_6px_0_0_#0f172a] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_#0f172a] cursor-pointer bg-yellow-50"}
            ${isProcessing ? "cursor-wait opacity-80" : ""}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center text-slate-900">
                <Loader2 size={24} className="animate-spin mb-2" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase text-center leading-tight">Procesando...</span>
              </div>
            ) : formData.logoPreview ? (
              <div className="relative w-full h-full group/img">
                <img
                  src={formData.logoPreview}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay on hover for Edit/Remove */}
                <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current.click();
                    }}
                    className="p-2 bg-yellow-400 border-2 border-slate-900 text-slate-900 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_#0f172a] transition-all"
                    title="Cambiar imagen"
                  >
                    <Edit2 size={16} strokeWidth={3} />
                  </button>
                  <button
                    onClick={removeImage}
                    className="p-2 bg-red-400 border-2 border-slate-900 text-slate-900 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_#0f172a] transition-all"
                    title="Eliminar imagen"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 py-1 flex items-center justify-center gap-1 opacity-100 group-hover/img:opacity-0 transition-opacity">
                  <CheckCircle2 size={10} className="text-cyan-400" />
                  <span className="text-[9px] text-white font-black uppercase tracking-widest">Listo</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-2 flex flex-col items-center">
                <div className="bg-cyan-400 p-2 border-2 border-slate-900 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <Upload size={20} className="text-slate-900" strokeWidth={3} />
                </div>
                <p className="text-[11px] font-black text-slate-900 uppercase">
                  Subir Foto
                </p>
                <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase">
                  JPG / PNG
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 w-full space-y-3 pt-6">
          <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest bg-yellow-400 border-2 border-slate-900 inline-block px-3 py-1 shadow-[2px_2px_0_0_#0f172a]">
            Nombre
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            placeholder="Ingresa el nombre de tu negocio"
            className="w-full bg-white border-4 border-slate-900 px-4 py-4 text-slate-900 font-black placeholder:text-slate-400 placeholder:font-bold focus:outline-none focus:shadow-[6px_6px_0_0_#0f172a] focus:-translate-y-1 focus:-translate-x-1 transition-all duration-300"
          />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
            Este nombre es el que se mostrará a los clientes de la página
          </p>
        </div>
      </div>
    </motion.div>
  );
}
