import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutTemplate,
  Building2,
  Navigation,
  CheckCircle2,
  Briefcase,
  Loader2,
} from "lucide-react";
import { getIndustries } from "../../supabase/services/organizations";

// Icon and color mapping by id or random fallback
const getIndustryMeta = (id) => {
  const meta = {
    beauty: { icon: LayoutTemplate, color: "text-orange-400", bg: "bg-orange-400" },
    health: { icon: Building2, color: "text-cyan-400", bg: "bg-cyan-400" },
    automotive: { icon: Navigation, color: "text-yellow-400", bg: "bg-yellow-400" },
    services: { icon: Briefcase, color: "text-indigo-400", bg: "bg-indigo-400" },
  };
  return meta[id] || { icon: Briefcase, color: "text-slate-900", bg: "bg-yellow-400" };
};

export default function IndustryStep({ formData, setFormData }) {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIndustries() {
      const { data } = await getIndustries();
      if (data) setIndustries(data);
      setLoading(false);
    }
    loadIndustries();
  }, []);

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col gap-6"
    >
      <div>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
          rubro
        </h2>
        <p className="text-sm font-bold text-slate-600 uppercase tracking-widest bg-cyan-400 border-2 border-slate-900 inline-block px-2 py-1 shadow-[2px_2px_0_0_#0f172a]">
          Selecciona el rubro de tu negocio
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-900">
          <Loader2 size={32} className="animate-spin mb-4" strokeWidth={3} />
          <span className="font-black uppercase tracking-widest text-sm animate-pulse">
            Cargando rubros...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {industries.map((ind) => {
            const meta = getIndustryMeta(ind.id);
            const Icon = meta.icon;
            const isSelected = formData.industry === ind.id;
            
            return (
              <div
                key={ind.id}
                onClick={() => setFormData((prev) => ({ ...prev, industry: ind.id }))}
                className={`relative p-5 border-4 border-slate-900 cursor-pointer transition-all duration-300 group ${
                  isSelected
                    ? "bg-yellow-400 shadow-[6px_6px_0_0_#0f172a] -translate-y-1 -translate-x-1"
                    : "bg-white shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#0f172a]"
                }`}
              >
                <div
                  className={`w-12 h-12 flex items-center justify-center mb-4 border-2 border-slate-900 overflow-hidden ${
                    isSelected ? "bg-white" : meta.bg
                  }`}
                >
                  {ind.image_url ? (
                    <img src={ind.image_url} alt={ind.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  ) : (
                    <Icon size={24} className="text-slate-900" strokeWidth={3} />
                  )}
                </div>
                <h3 className="text-slate-900 font-black uppercase tracking-tight text-lg leading-none mb-1">
                  {ind.name}
                </h3>
                {isSelected && (
                  <div className="absolute top-4 right-4 text-slate-900">
                    <CheckCircle2 size={24} strokeWidth={3} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
