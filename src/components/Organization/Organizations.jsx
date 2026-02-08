import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowRight } from 'lucide-react';

export default function Organizations({ organizations, loading }) {
  const navigate = useNavigate();

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Mis Organizaciones</h1>
        <button 
          onClick={() => navigate('/onboarding')} 
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-cyan-900/20"
        >
          + Nuevo Negocio
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
          <div className="h-32 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
        </div>
      ) : organizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => navigate(`/dashboard/${org.slug}`)}
              className="group bg-[#13131a] border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:border-cyan-500/50 transition-all text-left relative overflow-hidden"
            >
              <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                {org.logo_url ? (
                  <img src={org.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : <Building2 size={28} />}
              </div>
              <div>
                <h3 className="text-white font-bold group-hover:text-cyan-400 transition-colors">{org.name}</h3>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">{org.industry || 'Servicios'}</p>
              </div>
              <ArrowRight className="absolute right-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-cyan-500" size={20} />
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center">
          <Building2 className="mx-auto text-slate-700 mb-4" size={48} />
          <p className="text-slate-400 font-medium">Aún no tenés organizaciones.</p>
          <button onClick={() => navigate('/onboarding')} className="text-cyan-500 hover:underline text-sm mt-2 font-bold uppercase">Crear la primera</button>
        </div>
      )}
    </main>
  );
}