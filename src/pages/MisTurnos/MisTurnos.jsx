import React, { useState, useEffect } from "react";
import EmptyState from "@/components/UI/EmptyState";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  XCircle,
  Scissors,
  Loader2,
  Sparkles,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import {
  getClientAppointmentsByEmail,
  formatAppointmentDate,
  formatAppointmentTime,
  cancelAppointment,
} from "../../supabase/services/appointments";
import { getOrganizationStaff } from "../../supabase/services/staff";
import AppointmentModal from "../../components/Organization/AppointmentModal";

export default function MisTurnos() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [appToCancel, setAppToCancel] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [appToEdit, setAppToEdit] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    async function fetchApps() {
      if (!user?.email) return;
      setLoading(true);
      const { data } = await getClientAppointmentsByEmail(user.email);
      setAppointments(data || []);
      setLoading(false);
    }
    fetchApps();
  }, [user?.email]);

  const confirmCancel = async () => {
    if (!appToCancel) return;
    setCancelingId(appToCancel.id);
    const { error } = await cancelAppointment({
      appointmentId: appToCancel.id,
    });
    if (error) {
      toast.error("No se pudo cancelar el turno.");
    } else {
      toast.success("Turno cancelado exitosamente.");
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appToCancel.id ? { ...a, status: "canceled" } : a,
        ),
      );
    }
    setCancelingId(null);
    setCancelModalOpen(false);
    setAppToCancel(null);
  };

  const handleEditClick = async (app) => {
    setAppToEdit(app);
    setLoadingStaff(true);
    const { data } = await getOrganizationStaff(app.organization_id);
    setStaffOptions(data?.filter((s) => s.is_active) || []);
    setLoadingStaff(false);
    setEditModalOpen(true);
  };

  const handleEditSuccess = (updatedApp) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updatedApp.id ? { ...a, ...updatedApp } : a)),
    );
  };

  const now = new Date();
  const upcomingAppointments = appointments.filter((app) => {
    const appDate = new Date(app.start_time);
    return appDate >= now && app.status !== "canceled";
  });
  const pastAppointments = appointments.filter((app) => {
    const appDate = new Date(app.start_time);
    return appDate < now || app.status === "canceled";
  });

  const renderAppointment = (app, idx, isPastSection) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dateStr = formatAppointmentDate(app.start_time, tz);
    const timeStr = formatAppointmentTime(app.start_time, tz);
    const dateObj = new Date(app.start_time);
    const rawDayStr = new Intl.DateTimeFormat("es-AR", {
      timeZone: tz,
      weekday: "long",
    }).format(dateObj);
    const capitalizedDay =
      rawDayStr.charAt(0).toUpperCase() + rawDayStr.slice(1);
    const fullDateStr = `${capitalizedDay} ${dateStr}`;
    const isUpcoming = app.status === "pending" || app.status === "confirmed";
    const isCancelled = app.status === "canceled";
    const streetName = app.organizations?.street || "";
    const streetNumber = app.organizations?.number || "";
    const rawAddress = `${streetName} ${streetNumber}`.trim();
    const addressQuery = rawAddress
      ? `${rawAddress}, ${app.organizations?.cities?.name || ""}, ${app.organizations?.provinces?.name || ""}`
      : `${app.organizations?.cities?.name || ""}, ${app.organizations?.provinces?.name || ""}`;
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`;
    return (
      <motion.div
        key={app.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
        className={`border-4 rounded-none p-6 transition-all ${isUpcoming && !isPastSection ? "border-slate-900 bg-cyan-400 shadow-[6px_6px_0_0_#0f172a]" : "border-slate-300 shadow-none bg-slate-50"} ${isCancelled && "opacity-75 grayscale bg-slate-100"}`}
      >
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex flex-col md:flex-row gap-5 items-start md:items-center w-full">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-none overflow-hidden border-4 border-slate-900 focus:outline-none shrink-0 bg-white flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] -rotate-3">
              {app.organizations?.logo_url ? (
                <img
                  src={app.organizations.logo_url}
                  alt={app.organizations.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Sparkles className="text-slate-900" size={32} strokeWidth={2} />
              )}
            </div>
            <div className="flex-1">
              {isCancelled && (
                <div className="mb-3">
                  <span className="px-3 py-1 bg-white border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] text-slate-900 uppercase tracking-widest text-[10px] font-black">
                    Cancelado
                  </span>
                </div>
              )}
              <h4 className="flex items-center gap-3 text-2xl font-black mb-2 uppercase tracking-tighter text-slate-900 truncate">
                <div className="bg-white border-2 border-slate-900 p-1 shadow-[2px_2px_0_0_#0f172a] rotate-3 shrink-0"><Scissors size={20} strokeWidth={3} className="text-slate-900" /></div>
                {app.organizations?.name || "Negocio"}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-800 font-bold uppercase tracking-widest mb-4 truncate bg-white/50 border-2 border-slate-900 px-3 py-1.5 shadow-[2px_2px_0_0_#0f172a] w-fit">
                <MapPin size={14} className="text-slate-900 shrink-0" strokeWidth={3} />
                {rawAddress ? `${rawAddress}, ` : ""}
                {app.organizations?.cities?.name || "Local"}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-900 mb-4">
                <span className="flex items-center gap-2 bg-white border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] px-3 py-2">
                  <Calendar size={16} strokeWidth={3} /> {fullDateStr}
                </span>
                <span className="flex items-center gap-2 bg-white border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] px-3 py-2">
                  <Clock size={16} strokeWidth={3} /> {timeStr}
                </span>
              </div>
              {!isPastSection && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900 hover:text-white transition-colors bg-yellow-400 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] px-4 py-2 hover:bg-slate-900 hover:translate-x-1 hover:translate-y-1 hover:shadow-none w-fit"
                >
                  <MapPin size={16} strokeWidth={3} /> Abrir Google Maps
                </a>
              )}
            </div>
          </div>
          {!isPastSection && isUpcoming && (
            <div className="flex flex-row md:flex-col gap-3 shrink-0 mt-6 md:mt-0 w-full md:w-auto">
              <button
                onClick={() => handleEditClick(app)}
                disabled={loadingStaff && appToEdit?.id === app.id}
                className="w-full px-6 py-4 bg-white border-4 border-slate-900 text-slate-900 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#0f172a] active:translate-y-1 active:translate-x-1 active:shadow-none shadow-[4px_4px_0_0_#0f172a] rounded-none font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loadingStaff && appToEdit?.id === app.id ? (
                  <Loader2 size={18} strokeWidth={3} className="animate-spin" />
                ) : (
                  <Pencil size={18} strokeWidth={3} />
                )}
                Reprogramar
              </button>
              <button
                onClick={() => {
                  setAppToCancel(app);
                  setCancelModalOpen(true);
                }}
                className="w-full px-6 py-4 bg-white border-4 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#0f172a] active:translate-y-1 active:translate-x-1 active:shadow-none shadow-[4px_4px_0_0_#0f172a] rounded-none font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <XCircle size={18} strokeWidth={3} /> Anular
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12 md:py-20 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif]">
      <div className="bg-white border-4 border-slate-900 rounded-none p-6 md:p-12 shadow-[12px_12px_0_0_#0f172a] relative">
        <div className="absolute -top-4 -left-4 bg-cyan-400 border-4 border-slate-900 px-4 py-2 shadow-[6px_6px_0_0_#0f172a] -rotate-3">
          <span className="font-black text-slate-900 uppercase tracking-widest text-xs">Ajustes</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pt-4">
          <h3 className="text-4xl font-black flex items-center gap-4 text-slate-900 uppercase tracking-tighter">
            <div className="bg-yellow-400 border-4 border-slate-900 p-2 shadow-[4px_4px_0_0_#0f172a] rotate-3"><Calendar className="text-slate-900" size={32} strokeWidth={3} /></div> MIS TURNOS
          </h3>
          <div className="flex bg-slate-900 p-1.5 w-fit border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a]">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-6 py-3 font-black text-xs uppercase tracking-widest transition-all ${activeTab === "upcoming" ? "bg-cyan-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]" : "text-white border-2 border-transparent hover:bg-slate-800 cursor-pointer"}`}
            >
              PRÓXIMOS
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-6 py-3 font-black text-xs uppercase tracking-widest transition-all ${activeTab === "past" ? "bg-cyan-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]" : "text-white border-2 border-transparent hover:bg-slate-800 cursor-pointer"}`}
            >
              HISTORIAL
            </button>
          </div>
        </div>
        <div className="space-y-8">
          {loading ? (
            <div className="text-center py-20 bg-slate-50 border-4 border-slate-900 flex flex-col items-center justify-center gap-4 shadow-inner">
              <Loader2 size={48} strokeWidth={3} className="animate-spin text-slate-900" />
              <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Cargando turnos...</p>
            </div>
          ) : (
            <>
              {!loading && appointments.length === 0 && (
                <EmptyState title="No hay turnos registrados" description="Cuando reserves un turno, aparecerá acá." />
              )}
              {activeTab === "upcoming" && (
                upcomingAppointments.length > 0 ? (
                  <div className="space-y-6">
                    {upcomingAppointments.map((app, idx) =>
                      renderAppointment(app, idx, false),
                    )}
                  </div>
                ) : appointments.length > 0 && (
                  <EmptyState title="Sin reservas futuras" description="No tenés turnos próximos agendados." />
                )
              )}
              {activeTab === "past" && (
                pastAppointments.length > 0 ? (
                  <div className="space-y-6">
                    {pastAppointments.map((app, idx) =>
                      renderAppointment(app, idx, true),
                    )}
                  </div>
                ) : appointments.length > 0 && (
                  <EmptyState title="Historial vacío" description="Todavía no tenés turnos en el historial." />
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif]">
          <div
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
            onClick={() => setCancelModalOpen(false)}
          />
          <div className="relative w-full max-w-md border-4 border-slate-900 bg-white p-10 shadow-[16px_16px_0_0_#0f172a] text-center overflow-visible">
            <div className="w-20 h-20 bg-red-500 border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] text-slate-900 font-black rounded-none flex items-center justify-center mx-auto mb-8 absolute -top-10 left-1/2 -translate-x-1/2 rotate-6">
              <XCircle size={40} strokeWidth={3} />
            </div>
            <h4 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-4 pt-8">
              ¿Eliminar turno?
            </h4>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-600 mb-10 leading-relaxed">
              ATENCIÓN: Se cancelará tu reserva en <strong className="text-slate-900 bg-cyan-400 px-1 border-2 border-slate-900">{appToCancel?.organizations?.name}</strong>. Esto es irreversible.
            </p>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={confirmCancel}
                disabled={cancelingId === appToCancel?.id}
                className="w-full flex items-center justify-center gap-3 py-5 border-4 border-slate-900 font-black uppercase tracking-widest text-sm bg-red-500 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#0f172a] active:translate-y-1 active:translate-x-1 active:shadow-none shadow-[4px_4px_0_0_#0f172a] text-slate-900 transition-all disabled:opacity-50 cursor-pointer"
              >
                {cancelingId === appToCancel?.id ? (
                  <Loader2 size={20} strokeWidth={3} className="animate-spin" />
                ) : null}
                Aniquilar Reserva
              </button>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="w-full flex items-center justify-center gap-3 py-5 border-4 border-slate-900 font-black uppercase tracking-widest text-sm bg-white hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#0f172a] active:translate-y-1 active:translate-x-1 active:shadow-none shadow-[4px_4px_0_0_#0f172a] text-slate-900 transition-all cursor-pointer"
              >
                Mala Mía, Volver
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Appointment Modal */}
      <AppointmentModal
        isOpen={editModalOpen}
        appointment={appToEdit}
        staffOptions={staffOptions}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
