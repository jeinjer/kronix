import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getUserOrganizations } from '@/supabase/services/organizations';
import { 
  Building2, LayoutDashboard, Calendar, Users, 
  BarChart3, Settings, ChevronLeft 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && slug) {
      fetchOrgDetails();
    }
  }, [user, slug]);

  const fetchOrgDetails = async () => {
    setLoading(true);
    const { data } = await getUserOrganizations(user.id);
    const found = data?.find(o => o.slug === slug);
    
    if (!found) {
      navigate('/dashboard'); // Si no existe o no tiene permiso, vuelve al hub
    } else {
      setCurrentOrg(found);
    }
    setLoading(false);
  };

  if (loading) return null; // El HomeLoader de App.jsx ya cubre la carga inicial

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header del Dashboard de la Org */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="w-12 h-12 bg-cyan-600/20 rounded-xl flex items-center justify-center text-cyan-500 border border-cyan-500/20">
            {currentOrg.logo_url ? (
              <img src={currentOrg.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : <Building2 size={24} />}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">{currentOrg.name}</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Panel de Gestión</p>
          </div>
        </div>
        
        <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/5 transition-all">
          Configuración
        </button>
      </div>

      {/* Grid de Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Turnos Hoy', icon: Calendar, color: 'text-cyan-400', value: '12' },
          { label: 'Clientes', icon: Users, color: 'text-blue-400', value: '148' },
          { label: 'Ingresos', icon: BarChart3, color: 'text-emerald-400', value: '$45.200' },
          { label: 'Personal', icon: Settings, color: 'text-purple-400', value: '4' },
        ].map((item, i) => (
          <div key={i} className="bg-[#13131a] border border-white/10 p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 bg-white/5 rounded-xl ${item.color}`}>
                <item.icon size={20} />
              </div>
              <span className="text-2xl font-black text-white">{item.value}</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Contenedor Principal */}
      <div className="mt-8 bg-[#13131a] border border-white/10 rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
        <LayoutDashboard size={48} className="text-slate-800 mb-4" />
        <h2 className="text-xl font-bold text-slate-300">Bienvenido al control total</h2>
        <p className="text-slate-500 max-w-sm mt-2">Próximamente: Calendario y gestión de turnos para {currentOrg.name}.</p>
      </div>
    </div>
  );
}