import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { toast } from 'sonner';
import { ShieldCheck, UserPlus, RefreshCw, Ban, CheckCircle, CreditCard, Search } from 'lucide-react';

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const computeNextValidUntil = (currentValidUntil, extraDays = 30) => {
  const now = new Date();
  const base =
    currentValidUntil && new Date(currentValidUntil) > now
      ? new Date(currentValidUntil)
      : now;

  return addDays(base, extraDays).toISOString();
};

export default function SuperAdminDashboard() {
  // Invitaciones (whitelist)
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePlan, setInvitePlan] = useState('pro');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');

  // Suscripciones por organización
  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);

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

  const fetchSubscriptions = async () => {
    setSubsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, organization_id, plan_type, status, valid_until, created_at, organizations(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []).map((r) => ({
        id: r.id,
        organization_id: r.organization_id,
        org_name: r.organizations?.name ?? 'Sin nombre',
        plan_type: r.plan_type,
        status: r.status,
        valid_until: r.valid_until,
        created_at: r.created_at,
      }));

      setSubs(rows);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar suscripciones');
    } finally {
      setSubsLoading(false);
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

  const registerPayment = async (subscriptionId, currentValidUntil) => {
    try {
      const newValidUntil = computeNextValidUntil(currentValidUntil, 30);

      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active', valid_until: newValidUntil })
        .eq('id', subscriptionId);

      if (error) throw error;
      toast.success('Pago registrado. Acceso extendido 30 días.');
      await fetchSubscriptions();
    } catch (e) {
      console.error(e);
      toast.error('Error al registrar pago');
    }
  };

  const setSubscriptionStatus = async (subscriptionId, status) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status })
        .eq('id', subscriptionId);

      if (error) throw error;
      toast.success('Suscripción actualizada');
      await fetchSubscriptions();
    } catch (e) {
      console.error(e);
      toast.error('Error al actualizar suscripción');
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-slate-200 p-6 md:p-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">God Mode</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-1">
            Invitaciones (whitelist) y suscripciones por organización.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="px-4 py-2 bg-[#13131a] rounded-xl border border-white/5 text-center">
            <span className="block text-xs text-slate-500 uppercase font-bold">Invitaciones</span>
            <span className="text-xl font-black text-white">{invites.length}</span>
          </div>
          <div className="px-4 py-2 bg-[#13131a] rounded-xl border border-white/5 text-center">
            <span className="block text-xs text-slate-500 uppercase font-bold">Suscripciones</span>
            <span className="text-xl font-black text-white">{subs.length}</span>
          </div>
        </div>
      </div>

      {/* INVITACIONES */}
      <section className="bg-[#13131a] border border-white/10 rounded-3xl p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Invitaciones</h2>
            <p className="text-sm text-slate-500">Controla qué emails pueden registrarse.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchInvites}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2"
              type="button"
            >
              <RefreshCw size={16} />
              Refrescar
            </button>
          </div>
        </div>

        <form onSubmit={handleInviteCreate} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
          <div className="md:col-span-6">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#0b0b10] border border-white/10 outline-none"
              placeholder="email@cliente.com"
              type="email"
              required
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={invitePlan}
              onChange={(e) => setInvitePlan(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#0b0b10] border border-white/10 outline-none"
            >
              <option value="free">free</option>
              <option value="pro">pro</option>
              <option value="enterprise">enterprise</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              disabled={inviteSubmitting}
              className="w-full px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition font-black flex items-center justify-center gap-2 disabled:opacity-50"
              type="submit"
            >
              <UserPlus size={16} />
              Crear invitación
            </button>
          </div>

          <div className="md:col-span-12">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0b0b10] border border-white/10 outline-none"
                placeholder="Buscar por email"
                type="text"
              />
            </div>
          </div>
        </form>

        <div className="overflow-x-auto border border-white/10 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Email</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Plan</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Status</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Creada</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invitesLoading ? (
                <tr><td className="p-4 text-slate-500" colSpan={5}>Cargando...</td></tr>
              ) : filteredInvites.length === 0 ? (
                <tr><td className="p-4 text-slate-500" colSpan={5}>Sin resultados</td></tr>
              ) : (
                filteredInvites.map((i) => (
                  <tr key={i.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-semibold text-white">{i.email}</td>
                    <td className="p-4 text-slate-300 font-mono text-sm">{i.plan_type}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black border border-white/10 bg-white/5">
                        {i.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {i.created_at ? new Date(i.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition"
                          onClick={() => setInviteStatus(i.id, 'active')}
                          type="button"
                          title="Activar"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                          onClick={() => setInviteStatus(i.id, 'inactive')}
                          type="button"
                          title="Desactivar"
                        >
                          <Ban size={16} />
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

      {/* SUSCRIPCIONES */}
      <section className="bg-[#13131a] border border-white/10 rounded-3xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Suscripciones</h2>
            <p className="text-sm text-slate-500">Estado de suscripción por organización (tabla subscriptions).</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchSubscriptions}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2"
              type="button"
            >
              <RefreshCw size={16} />
              Refrescar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-white/10 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Organización</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Plan</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Status</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Válida hasta</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {subsLoading ? (
                <tr><td className="p-4 text-slate-500" colSpan={5}>Cargando...</td></tr>
              ) : subs.length === 0 ? (
                <tr><td className="p-4 text-slate-500" colSpan={5}>Sin suscripciones</td></tr>
              ) : (
                subs.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-semibold text-white">{s.org_name}</td>
                    <td className="p-4 text-slate-300 font-mono text-sm">{s.plan_type}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black border border-white/10 bg-white/5">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {s.valid_until ? new Date(s.valid_until).toLocaleString() : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition"
                          onClick={() => registerPayment(s.id, s.valid_until)}
                          type="button"
                          title="Registrar pago (+30d) y activar"
                        >
                          <CreditCard size={16} />
                        </button>
                        <button
                          className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                          onClick={() => setSubscriptionStatus(s.id, 'past_due')}
                          type="button"
                          title="Marcar past_due"
                        >
                          <Ban size={16} />
                        </button>
                        <button
                          className="px-3 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition border border-white/10"
                          onClick={() => setSubscriptionStatus(s.id, 'trialing')}
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
