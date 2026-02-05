import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { toast } from 'sonner';
import { 
  ShieldCheck, UserPlus, Search, Filter, 
  MoreHorizontal, Calendar, CreditCard, Ban, CheckCircle, Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuperAdminDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  
  // Estado para el formulario de alta
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientProject, setNewClientProject] = useState('barberia-v1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. CARGA DE DATOS ---
  const fetchClients = async () => {
    try {
      let query = supabase
        .from('suscripciones_saas')
        .select('*')
        .order('creado_el', { ascending: false });

      if (filterProject !== 'all') {
        query = query.eq('proyecto_id', filterProject);
      }

      const { data, error } = await query;
      if (error) throw error;
      setClients(data);
    } catch (error) {
      toast.error('Error al cargar clientes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [filterProject]);

  // --- 2. LÓGICA DE NEGOCIO ---

  // A. Dar de alta nuevo cliente (Whitelist)
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!newClientEmail) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('suscripciones_saas').insert([
        {
          email: newClientEmail,
          proyecto_id: newClientProject,
          estado: 'Sin activar', // Estado inicial por defecto
          // fecha_limite_pago: null (se setea cuando pague)
        }
      ]);

      if (error) throw error;
      
      toast.success(`Invitación enviada a ${newClientEmail}`);
      setNewClientEmail('');
      fetchClients(); // Refrescar tabla
    } catch (error) {
      toast.error(error.message || 'Error al invitar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  // B. Registrar Pago (Extender 30 días + Activar)
  const handleRegisterPayment = async (id, currentVencimiento) => {
    const today = new Date();
    // Si ya tenía fecha futura, sumamos desde ahí. Si no, desde hoy.
    const baseDate = currentVencimiento && new Date(currentVencimiento) > today 
      ? new Date(currentVencimiento) 
      : today;
    
    // Sumar 30 días
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + 30);

    try {
      const { error } = await supabase
        .from('suscripciones_saas')
        .update({ 
          estado: 'Activa',
          fecha_limite_pago: newDate.toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Pago registrado. Acceso extendido 30 días.');
      fetchClients();
    } catch (error) {
      toast.error('Error al registrar pago');
    }
  };

  // C. Cambiar estado manualmente (Banear / Suspender)
  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('suscripciones_saas')
        .update({ estado: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Estado cambiado a: ${newStatus}`);
      fetchClients();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  // --- RENDERIZADO ---
  return (
    <div className="min-h-screen bg-[#050507] text-slate-200 p-6 md:p-10 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">God Mode</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-1">Gestión centralizada de suscripciones SaaS.</p>
        </div>

        {/* Stats Rápidas (Hardcoded visual por ahora, podrías calcularlas) */}
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-[#13131a] rounded-xl border border-white/5 text-center">
            <span className="block text-xs text-slate-500 uppercase font-bold">Total</span>
            <span className="text-xl font-black text-white">{clients.length}</span>
          </div>
          <div className="px-4 py-2 bg-[#13131a] rounded-xl border border-white/5 text-center">
            <span className="block text-xs text-emerald-500 uppercase font-bold">Activos</span>
            <span className="text-xl font-black text-white">
              {clients.filter(c => c.estado === 'Activa').length}
            </span>
          </div>
        </div>
      </div>

      {/* --- FORMULARIO DE ALTA RÁPIDA --- */}
      <div className="bg-[#13131a] border border-white/10 rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><UserPlus size={120} /></div>
        
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap size={16} className="text-cyan-400" /> Nuevo Cliente (Whitelist)
        </h2>

        <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 relative z-10">
          <div className="flex-1">
            <input 
              type="email" 
              placeholder="Email del dueño (ej: cliente@barberia.com)" 
              className="w-full bg-[#0a0a0f] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="w-full md:w-48">
            <select 
              className="w-full bg-[#0a0a0f] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
              value={newClientProject}
              onChange={(e) => setNewClientProject(e.target.value)}
            >
              <option value="barberia-v1">💈 Barbería</option>
              <option value="gym-v1">💪 Gimnasio</option>
              <option value="taller-v1">🔧 Taller</option>
            </select>
          </div>

          <button 
            disabled={isSubmitting}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Procesando...' : <><UserPlus size={18} /> Autorizar Acceso</>}
          </button>
        </form>
      </div>

      {/* --- TABLA DE GESTIÓN --- */}
      <div className="bg-[#13131a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Toolbar de Tabla */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter size={16} />
            <select 
              className="bg-transparent text-sm font-bold outline-none cursor-pointer hover:text-white transition-colors"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="all">Todos los Proyectos</option>
              <option value="barberia-v1">Barbería V1</option>
              <option value="gym-v1">Gym V1</option>
            </select>
          </div>
          <div className="text-xs font-mono text-slate-600">
            LIVE DATA
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-5">Cliente / Proyecto</th>
                <th className="p-5">Estado</th>
                <th className="p-5">Vencimiento</th>
                <th className="p-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">Cargando base de datos...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">No hay clientes registrados aún.</td></tr>
              ) : (
                clients.map((client) => (
                  <ClientRow 
                    key={client.id} 
                    client={client} 
                    onRegisterPayment={handleRegisterPayment}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE DE FILA (Para limpieza) ---
function ClientRow({ client, onRegisterPayment, onStatusChange }) {
  const isVencido = client.fecha_limite_pago && new Date(client.fecha_limite_pago) < new Date();

  // Estilos de badge según estado
  const statusConfig = {
    'Activa': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'En espera': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Inactiva': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Sin activar': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  return (
    <motion.tr 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="hover:bg-white/[0.02] transition-colors group"
    >
      <td className="p-5">
        <div className="flex flex-col">
          <span className="font-bold text-white text-sm">{client.email}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase border border-indigo-500/10">
              {client.proyecto_id}
            </span>
            {client.nombre_dueno && <span className="text-xs text-slate-500">{client.nombre_dueno}</span>}
          </div>
        </div>
      </td>

      <td className="p-5">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusConfig[client.estado] || statusConfig['Sin activar']}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${client.estado === 'Activa' ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`}></div>
          {client.estado}
        </div>
      </td>

      <td className="p-5">
        <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
          <Calendar size={14} className={isVencido ? 'text-rose-500' : 'text-slate-600'} />
          <span className={isVencido ? 'text-rose-400 font-bold' : ''}>
            {client.fecha_limite_pago 
              ? new Date(client.fecha_limite_pago).toLocaleDateString() 
              : '---'}
          </span>
        </div>
      </td>

      <td className="p-5 text-right">
        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
          
          {/* Botón Registrar Pago */}
          <button 
            onClick={() => onRegisterPayment(client.id, client.fecha_limite_pago)}
            className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all border border-emerald-500/20"
            title="Registrar Pago (+30 días)"
          >
            <CreditCard size={16} />
          </button>

          {/* Botón Banear / Suspender */}
          {client.estado !== 'Inactiva' ? (
            <button 
              onClick={() => onStatusChange(client.id, 'Inactiva')}
              className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all border border-rose-500/20"
              title="Suspender Servicio"
            >
              <Ban size={16} />
            </button>
          ) : (
            <button 
              onClick={() => onStatusChange(client.id, 'Activa')}
              className="p-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-lg transition-all border border-indigo-500/20"
              title="Reactivar Manualmente"
            >
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}