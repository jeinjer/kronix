import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabase/supabaseClient";
import { toast } from "sonner";
import {
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Ban,
  CheckCircle,
  CreditCard,
  Search,
} from "lucide-react";
import EmptyState from "@/components/UI/EmptyState";

import {
  getAllSubscriptions,
  updateSubscriptionStatus,
  extendSubscription,
} from "@/supabase/services/subscriptions";

export default function SuperAdminDashboard() {
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePlan, setInvitePlan] = useState("pro");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");

  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);

  const fetchInvites = async () => {
    setInvitesLoading(true);
    try {
      const { data, error } = await supabase
        .from("saas_invitations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setInvites(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar invitaciones");
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
        status: "pending",
      };
      const { error } = await supabase
        .from("saas_invitations")
        .insert([payload]);
      if (error) throw error;
      toast.success("Invitación creada");
      setInviteEmail("");
      await fetchInvites();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Error creando invitación");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const setInviteStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from("saas_invitations")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      toast.success("Invitación actualizada");
      await fetchInvites();
    } catch (e) {
      console.error(e);
      toast.error("Error actualizando invitación");
    }
  };

  const fetchSubscriptions = async () => {
    setSubsLoading(true);
    try {
      const data = await getAllSubscriptions();
      setSubs(data);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar suscripciones");
    } finally {
      setSubsLoading(false);
    }
  };

  const handleRegisterPayment = async (subscriptionId, currentValidUntil) => {
    try {
      await extendSubscription(subscriptionId, currentValidUntil);
      toast.success("Pago registrado. Acceso extendido 30 días.");
      await fetchSubscriptions();
    } catch (e) {
      console.error(e);
      toast.error("Error al registrar pago");
    }
  };

  const handleSetStatus = async (subscriptionId, status) => {
    try {
      await updateSubscriptionStatus(subscriptionId, status);
      toast.success(`Suscripción actualizada a ${status}`);
      await fetchSubscriptions();
    } catch (e) {
      console.error(e);
      toast.error("Error al actualizar suscripción");
    }
  };

  useEffect(() => {
    fetchInvites();
    fetchSubscriptions();
  }, []);

  const filteredInvites = useMemo(() => {
    const q = inviteSearch.trim().toLowerCase();
    if (!q) return invites;
    return invites.filter((i) =>
      String(i.email || "")
        .toLowerCase()
        .includes(q),
    );
  }, [invites, inviteSearch]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pt-4 gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-cyan-400 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] flex items-center justify-center text-slate-900 -rotate-3">
            <ShieldCheck size={32} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
              Panel de Administración
            </h1>
            <p className="text-slate-900 bg-cyan-400 px-2 py-0.5 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] text-[10px] font-black uppercase tracking-widest w-fit mt-1">
              Gestión de usuarios y suscripciones
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          {[
            { label: "Invitaciones", value: invites.length, color: "bg-cyan-400" },
            { label: "Suscripciones", value: subs.length, color: "bg-yellow-400" },
          ].map((stat, i) => (
            <div
              key={i}
              className="px-6 py-4 bg-white border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] text-center"
            >
              <span className="block text-[10px] text-slate-900 uppercase font-black tracking-widest mb-1">
                {stat.label}
              </span>
              <span className="text-3xl font-black text-slate-900 tracking-tighter">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* INVITATIONS SECTION */}
      <section className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6 md:p-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b-4 border-slate-900 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              Invitaciones
            </h2>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">
              Controla qué emails pueden registrarse
            </p>
          </div>
          <button
            onClick={fetchInvites}
            className="px-4 py-2 bg-white border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-900"
            type="button"
          >
            <RefreshCw size={14} strokeWidth={3} /> Refrescar
          </button>
        </div>

        <form
          onSubmit={handleInviteCreate}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6"
        >
          <div className="md:col-span-6">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] outline-none font-black text-sm text-slate-900 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
              placeholder="email@cliente.com"
              type="email"
              required
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={invitePlan}
              onChange={(e) => setInvitePlan(e.target.value)}
              className="w-full px-4 py-3 bg-white border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] outline-none font-black text-sm text-slate-900 appearance-none cursor-pointer"
            >
              <option value="free">free</option>
              <option value="pro">pro</option>
              <option value="enterprise">enterprise</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <button
              disabled={inviteSubmitting}
              className="w-full px-4 py-3 bg-yellow-400 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_0_#0f172a] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all font-black flex items-center justify-center gap-2 disabled:opacity-50 text-slate-900 uppercase tracking-widest text-xs"
              type="submit"
            >
              <UserPlus size={16} strokeWidth={3} /> Crear
            </button>
          </div>
          <div className="md:col-span-12">
            <div className="relative">
              <Search
                size={16}
                strokeWidth={3}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900"
              />
              <input
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] outline-none font-black text-sm text-slate-900 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
                placeholder="Buscar por email"
                type="text"
              />
            </div>
          </div>
        </form>

        <div className="overflow-x-auto border-4 border-slate-900">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-4 text-[10px] uppercase tracking-widest font-black">Email</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-black">Plan</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-black">Status</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-black">Creada</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900">
              {invitesLoading ? (
                <tr>
                  <td className="p-6 text-center font-black text-slate-500 uppercase tracking-widest text-sm" colSpan={5}>
                    Cargando...
                  </td>
                </tr>
              ) : filteredInvites.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="Sin invitaciones" description="No hay invitaciones que coincidan." />
                  </td>
                </tr>
              ) : (
                filteredInvites.map((i) => {
                  const inviteStatus = String(i.status || "").toLowerCase();
                  const canActivate = inviteStatus !== "active";
                  const canDeactivate = inviteStatus !== "inactive";

                  return (
                    <tr key={i.id} className="hover:bg-yellow-400/10 transition-colors">
                      <td className="p-4 font-black text-slate-900 text-sm">{i.email}</td>
                      <td className="p-4">
                        <span className="bg-cyan-400 border-2 border-slate-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                          {i.plan_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-[2px_2px_0_0_#0f172a] ${
                          inviteStatus === "active" ? "bg-yellow-400" :
                          inviteStatus === "pending" ? "bg-orange-300" : "bg-slate-200"
                        }`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-black text-slate-500 uppercase">
                        {i.created_at ? new Date(i.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={!canActivate}
                            className="p-2 bg-yellow-400 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-30 disabled:cursor-not-allowed text-slate-900"
                            onClick={() => setInviteStatus(i.id, "active")}
                            type="button"
                            title="Activar"
                          >
                            <CheckCircle size={14} strokeWidth={3} />
                          </button>
                          <button
                            disabled={!canDeactivate}
                            className="p-2 bg-rose-400 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-30 disabled:cursor-not-allowed text-slate-900"
                            onClick={() => setInviteStatus(i.id, "inactive")}
                            type="button"
                            title="Desactivar"
                          >
                            <Ban size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SUBSCRIPTIONS SECTION */}
      <section className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b-4 border-slate-900 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              Suscripciones
            </h2>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">
              Vista consolidada: Usuarios, Planes y Negocios
            </p>
          </div>
          <button
            onClick={fetchSubscriptions}
            className="px-4 py-2 bg-white border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-900"
            type="button"
          >
            <RefreshCw size={14} strokeWidth={3} /> Refrescar
          </button>
        </div>

        <div className="overflow-x-auto border-4 border-slate-900">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-4 text-[10px] uppercase tracking-widest font-black">Organización / Dueño</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-black">Plan</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-black">Status</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-black">Válida hasta</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900">
              {subsLoading ? (
                <tr>
                  <td className="p-6 text-center font-black text-slate-500 uppercase tracking-widest text-sm" colSpan={5}>
                    Cargando...
                  </td>
                </tr>
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="Sin suscripciones" description="Aún no hay suscripciones registradas." />
                  </td>
                </tr>
              ) : (
                subs.map((s) => (
                  <tr key={s.id} className="hover:bg-yellow-400/10 transition-colors">
                    <td className="p-4">
                      <div className="font-black text-slate-900 text-sm">{s.org_name}</div>
                      {s.user_email && (
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          {s.user_email}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="bg-cyan-400 border-2 border-slate-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                        {s.plan_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-[2px_2px_0_0_#0f172a] ${
                        s.status === "active" ? "bg-yellow-400" :
                        s.status === "past_due" ? "bg-rose-400" : "bg-slate-200"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-black text-slate-500 uppercase">
                      {s.valid_until ? new Date(s.valid_until).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="p-2 bg-yellow-400 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-slate-900"
                          onClick={() => handleRegisterPayment(s.id, s.valid_until)}
                          type="button"
                          title="Registrar pago (+30d) y activar"
                        >
                          <CreditCard size={14} strokeWidth={3} />
                        </button>
                        <button
                          className="p-2 bg-rose-400 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-slate-900"
                          onClick={() => handleSetStatus(s.id, "past_due")}
                          type="button"
                          title="Marcar past_due"
                        >
                          <Ban size={14} strokeWidth={3} />
                        </button>
                        <button
                          className="p-2 bg-white border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-slate-900"
                          onClick={() => handleSetStatus(s.id, "trialing")}
                          type="button"
                          title="Volver a trialing"
                        >
                          <CheckCircle size={14} strokeWidth={3} />
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
