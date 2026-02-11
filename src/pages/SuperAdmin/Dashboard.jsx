import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient'; // Solo para invitaciones (si no las moviste al servicio)
import { toast } from 'sonner';
import { ShieldCheck, UserPlus, RefreshCw, Ban, CheckCircle, CreditCard, Search } from 'lucide-react';

// IMPORTAMOS EL SERVICIO NUEVO
import { 
  getAllSubscriptions, 
  updateSubscriptionStatus, 
  extendSubscription 
} from '@/supabase/services/subscriptions';

export default function SuperAdminDashboard() {
  // --- Estado: Invitaciones ---
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePlan, setInvitePlan] = useState('pro');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');

  // --- Estado: Suscripciones ---
  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);

  // --- Lógica: Invitaciones (Se mantiene igual por ahora) ---
  const fetchInvites = async () => {
    setInvitesLoading(true);
    try {
      const { data, error } = await supabase
        .from('saas_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar invitaciones');
    } finally {
      setInvitesLoading(false);
    }
  };

  const handleInviteCreate = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteSubmitting(true);
    try {
      const payload = {
        email: inviteEmail.trim().toLowerCase(),
        plan_type: invitePlan,
        status: 'pending',
      };
      const { error } = await supabase.from('saas_invitations').insert([payload]);
      if (error) throw error;

      toast.success('Invitación creada');
      setInviteEmail('');
      await fetchInvites();
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Error creando invitación');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const setInviteStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('saas_invitations')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      toast.success('Invitación actualizada');
      await fetchInvites();
    } catch (e) {
      console.error(e);
      toast.error('Error actualizando invitación');
    }
  };

  // --- LÓGICA NUEVA: USANDO EL SERVICIO DE SUSCRIPCIONES ---

  const fetchSubscriptions = async () => {
    setSubsLoading(true);
    try {
      // Llamada limpia al servicio (usa la Vista SQL por detrás)
      const data = await getAllSubscriptions();
      setSubs(data);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar suscripciones');
    } finally {
      setSubsLoading(false);
    }
  };

  const handleRegisterPayment = async (subscriptionId, currentValidUntil) => {
    try {
      // La lógica de fechas ahora está encapsulada en el servicio
      await extendSubscription(subscriptionId, currentValidUntil);
      toast.success('Pago registrado. Acceso extendido 30 días.');
      await fetchSubscriptions();
    } catch (e) {
      console.error(e);
      toast.error('Error al registrar pago');
    }
  };

  const handleSetStatus = async (subscriptionId, status) => {
    try {
      await updateSubscriptionStatus(subscriptionId, status);
      toast.success(`Suscripción actualizada a ${status}`);
      await fetchSubscriptions();
    } catch (e) {
      console.error(e);
      toast.error('Error al actualizar suscripción');
    }
  };

  useEffect(() => {
    fetchInvites();
    fetchSubscriptions();
  }, []);

  const filteredInvites = useMemo(() => {
    const q = inviteSearch.trim().toLowerCase();
    if (!q) return invites;
    return invites.filter((i) => String(i.email || '').toLowerCase().includes(q));
  }, [invites, inviteSearch]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#050507] text-slate-800 dark:text-slate-200 p-6 md:p-10 pb-20 transition-colors duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Panel de administración</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-1">
            Gestión de usuarios VIP y Suscripciones.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/5 text-center transition-colors duration-500">
            <span className="block text-xs text-slate-500 uppercase font-bold">Invitaciones</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{invites.length}</span>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/5 text-center transition-colors duration-500">
            <span className="block text-xs text-slate-500 uppercase font-bold">Suscripciones</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{subs.length}</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN INVITACIONES (Sin cambios visuales) */}
      <section className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 mb-8 transition-colors duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Invitaciones</h2>
            <p className="text-sm text-slate-500">Controla qué emails pueden registrarse.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchInvites}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 flex items-center gap-2 transition-colors"
              type="button"
            >
              <RefreshCw size={16} /> Refrescar
            </button>
          </div>
        </div>

        <form onSubmit={handleInviteCreate} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
          <div className="md:col-span-6">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#0b0b10] border border-slate-300 dark:border-white/10 outline-none transition-colors"
              placeholder="email@cliente.com"
              type="email"
              required
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={invitePlan}
              onChange={(e) => setInvitePlan(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#0b0b10] border border-slate-300 dark:border-white/10 outline-none transition-colors"
            >
              <option value="free">free</option>
              <option value="pro">pro</option>
              <option value="enterprise">enterprise</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <button
              disabled={inviteSubmitting}
              className="w-full px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition font-black flex items-center justify-center gap-2 disabled:opacity-50 text-white"
              type="submit"
            >
              <UserPlus size={16} /> Crear invitación
            </button>
          </div>
          <div className="md:col-span-12">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#0b0b10] border border-slate-300 dark:border-white/10 outline-none transition-colors"
                placeholder="Buscar por email"
                type="text"
              />
            </div>
          </div>
        </form>

        <div className="overflow-x-auto border border-slate-300 dark:border-white/10 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-white/[0.03]">
              <tr>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Email</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Plan</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Status</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Creada</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {invitesLoading ? (
                <tr><td className="p-4 text-slate-500" colSpan={5}>Cargando...</td></tr>
              ) : filteredInvites.length === 0 ? (
                <tr><td className="p-4 text-slate-500" colSpan={5}>Sin resultados</td></tr>
              ) : (
                filteredInvites.map((i) => (
                  (() => {
                    const inviteStatus = String(i.status || '').toLowerCase();
                    const canActivate = inviteStatus !== 'active';
                    const canDeactivate = inviteStatus !== 'inactive';

                    return (
                  <tr key={i.id} className="hover:bg-slate-100 dark:hover:bg-white/[0.02]">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">{i.email}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-sm">{i.plan_type}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5">
                        {i.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {i.created_at ? new Date(i.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={!canActivate}
                          className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => setInviteStatus(i.id, 'active')}
                          type="button"
                          title="Activar"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          disabled={!canDeactivate}
                          className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => setInviteStatus(i.id, 'inactive')}
                          type="button"
                          title="Desactivar"
                        >
                          <Ban size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                    );
                  })()
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECCIÓN SUSCRIPCIONES (Lógica refactorizada) */}
      <section className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 transition-colors duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Suscripciones</h2>
            <p className="text-sm text-slate-500">Vista consolidada: Usuarios, Planes y Negocios.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchSubscriptions}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 flex items-center gap-2 transition-colors"
              type="button"
            >
              <RefreshCw size={16} /> Refrescar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-300 dark:border-white/10 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-white/[0.03]">
              <tr>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Organización / Dueño</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Plan</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Status</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Válida hasta</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {subsLoading ? (
                <tr><td className="p-4 text-slate-500" colSpan={5}>Cargando...</td></tr>
              ) : subs.length === 0 ? (
                <tr><td className="p-4 text-slate-500" colSpan={5}>Sin suscripciones</td></tr>
              ) : (
                subs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-100 dark:hover:bg-white/[0.02]">
                    <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{s.org_name}</div>
                        {/* Mostramos el mail del dueño si existe */}
                        {s.user_email && <div className="text-xs text-slate-500">{s.user_email}</div>}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-sm uppercase">{s.plan_type}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                        s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        s.status === 'past_due' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {s.valid_until ? new Date(s.valid_until).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition"
                          onClick={() => handleRegisterPayment(s.id, s.valid_until)}
                          type="button"
                          title="Registrar pago (+30d) y activar"
                        >
                          <CreditCard size={16} />
                        </button>
                        <button
                          className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                          onClick={() => handleSetStatus(s.id, 'past_due')}
                          type="button"
                          title="Marcar past_due"
                        >
                          <Ban size={16} />
                        </button>
                        <button
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition border border-slate-300 dark:border-white/10"
                          onClick={() => handleSetStatus(s.id, 'trialing')}
                          type="button"
                          title="Volver a trialing"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
