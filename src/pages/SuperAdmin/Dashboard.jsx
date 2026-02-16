import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { toast } from 'sonner';
import {
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Ban,
  Search,
  Trash2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  applySubscriptionAdjustment,
  deactivateSubscriptionWithReason,
  deleteInvitation,
  getAllSubscriptions,
  setSubscriptionActivity,
} from '@/supabase/services/subscriptions';

const STATUS_LABELS = {
  pending: 'Pendiente',
  active: 'Activa',
  inactive: 'Inactiva',
  revoked: 'Revocada',
  blocked: 'Bloqueada',
  banned: 'Bloqueada',
  trial: 'Prueba',
  pro: 'Pro',
  enterprise: 'Empresarial',
};

const PLAN_LABELS = {
  trial: 'Prueba',
  pro: 'Pro',
  enterprise: 'Empresarial',
};

const normalizePlan = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'trial') return 'trial';
  if (normalized === 'enterprise') return 'enterprise';
  return 'pro';
};

const getInvitationStatusLabel = (value) =>
  STATUS_LABELS[String(value || '').toLowerCase()] || 'Desconocido';

const getPlanLabel = (value) =>
  PLAN_LABELS[String(value || '').toLowerCase()] || 'Pro';

const getSubscriptionPlan = (sub) => {
  const status = String(sub?.status || '').toLowerCase();
  if (status === 'trial' || status === 'pro' || status === 'enterprise') {
    return status;
  }
  return normalizePlan(sub?.plan_type);
};

const isSubscriptionActive = (sub) =>
  !['inactive', 'past_due', 'canceled', 'cancelled'].includes(
    String(sub?.status || '').toLowerCase()
  );

const getSubscriptionActivityLabel = (sub) =>
  isSubscriptionActive(sub) ? 'Activa' : 'Inactiva';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export default function SuperAdminDashboard() {
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteToDelete, setInviteToDelete] = useState(null);
  const [deletingInviteId, setDeletingInviteId] = useState(null);

  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);

  const [adjustModalSub, setAdjustModalSub] = useState(null);
  const [adjustPlan, setAdjustPlan] = useState('pro');
  const [adjustDays, setAdjustDays] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const [deactivateModalSub, setDeactivateModalSub] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);

  const fetchInvites = async () => {
    setInvitesLoading(true);
    try {
      const { data, error } = await supabase
        .from('saas_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar invitaciones');
    } finally {
      setInvitesLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    setSubsLoading(true);
    try {
      const data = await getAllSubscriptions();
      setSubs(data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar suscripciones');
    } finally {
      setSubsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
    fetchSubscriptions();
  }, []);

  const canCreateInvite = (email) => {
    const normalized = normalizeEmail(email);
    if (!normalized) return false;

    const existsInvite = invites.some(
      (invite) => normalizeEmail(invite.email) === normalized
    );
    if (existsInvite) {
      toast.error('Ese correo ya tiene una invitacion registrada');
      return false;
    }

    const existsSubscription = subs.some(
      (sub) => normalizeEmail(sub.user_email) === normalized
    );
    if (existsSubscription) {
      toast.error('Ese correo ya tiene una suscripcion');
      return false;
    }

    return true;
  };

  const handleInviteCreate = async (event) => {
    event.preventDefault();
    const email = normalizeEmail(inviteEmail);
    if (!email) return;
    if (!canCreateInvite(email)) return;

    setInviteSubmitting(true);
    try {
      const { data: existingInvite, error: inviteCheckError } = await supabase
        .from('saas_invitations')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (inviteCheckError) throw inviteCheckError;
      if (existingInvite) {
        throw new Error('Ese correo ya tiene una invitacion registrada');
      }

      const { data: existingSub, error: subCheckError } = await supabase
        .from('subscriptions_details')
        .select('id')
        .eq('user_email', email)
        .maybeSingle();

      if (subCheckError) throw subCheckError;
      if (existingSub) {
        throw new Error('Ese correo ya tiene una suscripcion');
      }

      const payload = {
        email,
        status: 'pending',
      };

      const { error } = await supabase.from('saas_invitations').insert([payload]);
      if (error) throw error;

      toast.success('Invitacion creada');
      setInviteEmail('');
      await fetchInvites();
    } catch (error) {
      console.error(error);
      if (
        String(error?.code || '') === '23505' ||
        String(error?.message || '').toLowerCase().includes('duplicate')
      ) {
        toast.error('Ese correo ya tiene una invitacion');
      } else {
        toast.error(error.message || 'Error creando invitacion');
      }
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleDeleteInvitation = async () => {
    if (!inviteToDelete?.id) return;

    setDeletingInviteId(inviteToDelete.id);
    try {
      await deleteInvitation(inviteToDelete.id);
      toast.success('Invitacion eliminada');
      setInviteToDelete(null);
      await fetchInvites();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar invitacion');
    } finally {
      setDeletingInviteId(null);
    }
  };

  const openAdjustModal = (sub) => {
    setAdjustModalSub(sub);
    setAdjustPlan(getSubscriptionPlan(sub));
    setAdjustDays('');
  };

  const handleApplyAdjustment = async () => {
    if (!adjustModalSub?.id) return;

    const nextPlan = normalizePlan(adjustPlan);
    const previousPlan = getSubscriptionPlan(adjustModalSub);
    const parsedDays = adjustDays === '' ? 0 : Number(adjustDays);
    if (!Number.isFinite(parsedDays) || parsedDays < 0) {
      toast.error('Los dias deben ser un numero mayor o igual a 0');
      return;
    }

    const daysToAdd = Math.trunc(parsedDays);
    const hasPlanChange = nextPlan !== previousPlan;
    const hasDays = Number.isFinite(daysToAdd) && daysToAdd > 0;

    if (!hasPlanChange && !hasDays) {
      toast.error('No hay cambios para aplicar');
      return;
    }

    setAdjustSubmitting(true);
    try {
      await applySubscriptionAdjustment({
        id: adjustModalSub.id,
        planType: nextPlan,
        extraDays: daysToAdd,
      });

      toast.success('Ajuste aplicado');
      setAdjustModalSub(null);
      setAdjustDays('');
      await fetchSubscriptions();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al aplicar ajuste');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleActivateSubscription = async (sub) => {
    if (!sub?.id) return;

    try {
      await setSubscriptionActivity({ id: sub.id, isActive: true });
      toast.success('Suscripcion activada');
      await fetchSubscriptions();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al activar suscripcion');
    }
  };

  const openDeactivateModal = (sub) => {
    setDeactivateModalSub(sub);
    setDeactivateReason('');
  };

  const handleDeactivateSubscription = async () => {
    if (!deactivateModalSub?.id) return;
    const reason = String(deactivateReason || '').trim();

    if (!reason) {
      toast.error('Debes ingresar un motivo');
      return;
    }

    setDeactivateSubmitting(true);
    try {
      const result = await deactivateSubscriptionWithReason({
        subscriptionId: deactivateModalSub.id,
        reason,
        userEmail: deactivateModalSub.user_email,
        organizationName: deactivateModalSub.org_name,
      });

      if (result.emailSent) {
        toast.success('Suscripcion desactivada y correo enviado');
      } else if (result.warning) {
        toast.warning(`Suscripcion desactivada: ${result.warning}`);
      } else {
        toast.warning('Suscripcion desactivada. No se pudo enviar el correo.');
      }

      setDeactivateModalSub(null);
      setDeactivateReason('');
      await fetchSubscriptions();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al desactivar suscripcion');
    } finally {
      setDeactivateSubmitting(false);
    }
  };

  const filteredInvites = useMemo(() => {
    const query = inviteSearch.trim().toLowerCase();
    if (!query) return invites;
    return invites.filter((invite) =>
      String(invite.email || '').toLowerCase().includes(query)
    );
  }, [invites, inviteSearch]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#050507] text-slate-800 dark:text-slate-200 p-6 md:p-10 pb-20 transition-colors duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
              Panel de administracion
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-1">
            Gestion de invitaciones y suscripciones.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/5 text-center transition-colors duration-500">
            <span className="block text-xs text-slate-500 uppercase font-bold">
              Invitaciones
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {invites.length}
            </span>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-[#13131a] rounded-xl border border-slate-200 dark:border-white/5 text-center transition-colors duration-500">
            <span className="block text-xs text-slate-500 uppercase font-bold">
              Suscripciones
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {subs.length}
            </span>
          </div>
        </div>
      </div>

      <section className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 mb-8 transition-colors duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Invitaciones
            </h2>
            <p className="text-sm text-slate-500">
              Envia invitaciones y elimina las que no correspondan.
            </p>
          </div>
          <button
            onClick={fetchInvites}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 flex items-center gap-2 transition-colors"
            type="button"
          >
            <RefreshCw size={16} /> Refrescar
          </button>
        </div>

        <form onSubmit={handleInviteCreate} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
          <div className="md:col-span-9">
            <input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#0b0b10] border border-slate-300 dark:border-white/10 outline-none transition-colors"
              placeholder="correo@cliente.com"
              type="email"
              required
            />
          </div>
          <div className="md:col-span-3">
            <button
              disabled={inviteSubmitting}
              className="w-full px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition font-black flex items-center justify-center gap-2 disabled:opacity-50 text-white"
              type="submit"
            >
              <UserPlus size={16} /> Crear invitacion
            </button>
          </div>
          <div className="md:col-span-12">
            <p className="text-xs text-slate-500 mb-3">
              Todas las cuentas invitadas inician en <span className="font-black uppercase">prueba</span>.
            </p>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={inviteSearch}
                onChange={(event) => setInviteSearch(event.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#0b0b10] border border-slate-300 dark:border-white/10 outline-none transition-colors"
                placeholder="Buscar por correo"
                type="text"
              />
            </div>
          </div>
        </form>

        <div className="overflow-x-auto border border-slate-300 dark:border-white/10 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-white/[0.03]">
              <tr>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Correo</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Estado</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Creada</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {invitesLoading ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={4}>
                    Cargando...
                  </td>
                </tr>
              ) : filteredInvites.length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={4}>
                    Sin resultados
                  </td>
                </tr>
              ) : (
                filteredInvites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-slate-100 dark:hover:bg-white/[0.02]">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">{invite.email}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5">
                        {getInvitationStatusLabel(invite.status)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {invite.created_at ? new Date(invite.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        disabled={deletingInviteId === invite.id}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition disabled:opacity-40"
                        onClick={() => setInviteToDelete(invite)}
                        type="button"
                        title="Eliminar invitacion"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 transition-colors duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Suscripciones
            </h2>
            <p className="text-sm text-slate-500">
              Ajusta plan o dias manualmente. Para desactivar se requiere motivo.
            </p>
          </div>
          <button
            onClick={fetchSubscriptions}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 flex items-center gap-2 transition-colors"
            type="button"
          >
            <RefreshCw size={16} /> Refrescar
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-300 dark:border-white/10 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-white/[0.03]">
              <tr>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">
                  Organizacion / Dueno
                </th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Plan</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Estado</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black">Valida hasta</th>
                <th className="p-4 text-xs uppercase tracking-widest text-slate-500 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {subsLoading ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={5}>
                    Cargando...
                  </td>
                </tr>
              ) : subs.length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={5}>
                    Sin suscripciones
                  </td>
                </tr>
              ) : (
                subs.map((sub) => (
                  <SubscriptionRow
                    key={sub.id}
                    sub={sub}
                    onOpenAdjust={openAdjustModal}
                    onOpenDeactivate={openDeactivateModal}
                    onActivate={handleActivateSubscription}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDeleteModal
        isOpen={Boolean(inviteToDelete)}
        email={inviteToDelete?.email || ''}
        loading={Boolean(inviteToDelete?.id && deletingInviteId === inviteToDelete.id)}
        onClose={() => setInviteToDelete(null)}
        onConfirm={handleDeleteInvitation}
      />

      <AdjustSubscriptionModal
        isOpen={Boolean(adjustModalSub)}
        subscription={adjustModalSub}
        plan={adjustPlan}
        days={adjustDays}
        loading={adjustSubmitting}
        onClose={() => setAdjustModalSub(null)}
        onPlanChange={setAdjustPlan}
        onDaysChange={setAdjustDays}
        onSubmit={handleApplyAdjustment}
      />

      <DeactivateSubscriptionModal
        isOpen={Boolean(deactivateModalSub)}
        subscription={deactivateModalSub}
        reason={deactivateReason}
        loading={deactivateSubmitting}
        onClose={() => setDeactivateModalSub(null)}
        onReasonChange={setDeactivateReason}
        onSubmit={handleDeactivateSubscription}
      />
    </div>
  );
}

function SubscriptionRow({ sub, onOpenAdjust, onOpenDeactivate, onActivate }) {
  const plan = getSubscriptionPlan(sub);
  const isActive = isSubscriptionActive(sub);

  return (
    <tr className="hover:bg-slate-100 dark:hover:bg-white/[0.02]">
      <td className="p-4">
        <div className="font-semibold text-slate-900 dark:text-white">{sub.org_name}</div>
        {sub.user_email && <div className="text-xs text-slate-500">{sub.user_email}</div>}
      </td>
      <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-sm uppercase">
        {getPlanLabel(plan)}
      </td>
      <td className="p-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-black border ${
            isActive
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
          }`}
        >
          {getSubscriptionActivityLabel(sub)}
        </span>
      </td>
      <td className="p-4 text-slate-400 text-sm">
        {sub.valid_until ? new Date(sub.valid_until).toLocaleDateString() : '-'}
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition flex items-center gap-2"
            onClick={() => onOpenAdjust(sub)}
            type="button"
            title="Ajustar suscripcion"
          >
            <SlidersHorizontal size={16} />
            Ajustar
          </button>
          {isActive ? (
            <button
              className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition flex items-center gap-2"
              onClick={() => onOpenDeactivate(sub)}
              type="button"
              title="Desactivar suscripcion"
            >
              <Ban size={16} />
              Desactivar
            </button>
          ) : (
            <button
              className="px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition flex items-center gap-2"
              onClick={() => onActivate(sub)}
              type="button"
              title="Activar suscripcion"
            >
              Activar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ModalShell({ isOpen, title, children, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative z-[121] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <X size={18} />
        </button>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ isOpen, email, loading, onClose, onConfirm }) {
  return (
    <ModalShell isOpen={isOpen} title="Eliminar invitacion" onClose={onClose}>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        Se eliminara definitivamente la invitacion de <strong>{email || 'este correo'}</strong>.
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white disabled:opacity-40"
          disabled={loading}
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </ModalShell>
  );
}

function AdjustSubscriptionModal({
  isOpen,
  subscription,
  plan,
  days,
  loading,
  onClose,
  onPlanChange,
  onDaysChange,
  onSubmit,
}) {
  return (
    <ModalShell isOpen={isOpen} title="Ajustar suscripcion" onClose={onClose}>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Define el plan y agrega dias de vigencia si hace falta.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-black uppercase text-slate-500">Plan</label>
          <select
            value={plan}
            onChange={(event) => onPlanChange(event.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0b0b10] border border-slate-300 dark:border-white/10"
          >
            <option value="trial">Prueba</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Empresarial</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-black uppercase text-slate-500">Dias a sumar</label>
          <input
            type="number"
            min="0"
            step="1"
            value={days}
            onChange={(event) => onDaysChange(event.target.value)}
            placeholder="Ejemplo: 15"
            className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0b0b10] border border-slate-300 dark:border-white/10"
          />
          <p className="text-xs text-slate-500 mt-1">
            Se suman sobre la fecha actual de vencimiento. Si dejas 0, no se agregan dias.
          </p>
        </div>

        <p className="text-xs text-slate-500">
          Estado actual: {getSubscriptionActivityLabel(subscription)}. Plan actual: {getPlanLabel(getSubscriptionPlan(subscription))}.
        </p>

        <p className="text-xs text-slate-500">
          Vigencia actual: {subscription?.valid_until ? new Date(subscription.valid_until).toLocaleDateString() : 'Sin fecha'}.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-40"
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Aplicar'}
        </button>
      </div>
    </ModalShell>
  );
}

function DeactivateSubscriptionModal({
  isOpen,
  subscription,
  reason,
  loading,
  onClose,
  onReasonChange,
  onSubmit,
}) {
  return (
    <ModalShell isOpen={isOpen} title="Desactivar suscripcion" onClose={onClose}>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Se notificara por correo a <strong>{subscription?.user_email || 'este usuario'}</strong>.
      </p>

      <label className="text-xs font-black uppercase text-slate-500">Motivo</label>
      <textarea
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
        rows={4}
        className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0b0b10] border border-slate-300 dark:border-white/10"
        placeholder="Escribe el motivo que se enviara por correo"
      />

      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white disabled:opacity-40"
          disabled={loading}
        >
          {loading ? 'Desactivando...' : 'Desactivar'}
        </button>
      </div>
    </ModalShell>
  );
}
