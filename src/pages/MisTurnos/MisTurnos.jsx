import React, { useState, useEffect } from "react";
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
        className={`border rounded-[1.5rem] p-6 transition-all ${isUpcoming && !isPastSection ? "border-cyan-500/30 bg-cyan-50/50 shadow-sm" : "border-slate-200 opacity-70"} ${isCancelled && "opacity-50 grayscale"}`}
      >
        {" "}
        <div className="flex flex-col md:flex-row justify-between gap-6">
          {" "}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {" "}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white focus:outline-none shrink-0 bg-slate-100 flex items-center justify-center">
              {" "}
              {app.organizations?.logo_url ? (
                <img
                  src={app.organizations.logo_url}
                  alt={app.organizations.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Sparkles className="text-slate-400" size={24} />
              )}{" "}
            </div>{" "}
            <div className="flex-1">
              {" "}
              {isCancelled && (
                <div className="mb-2">
                  {" "}
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                    Cancelado
                  </span>{" "}
                </div>
              )}{" "}
              <h4 className="flex items-center gap-2 text-xl font-bold mb-1">
                {" "}
                <Scissors size={18} className="text-cyan-500 shrink-0" />{" "}
                {app.organizations?.name || "Negocio"}{" "}
              </h4>{" "}
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                {" "}
                <MapPin size={12} className="text-slate-400 shrink-0" />{" "}
                {rawAddress ? `${rawAddress},` : ""}
                {app.organizations?.cities?.name || "Local"}{" "}
              </div>{" "}
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-3">
                {" "}
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                  <Calendar size={14} /> {fullDateStr}
                </span>{" "}
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                  <Clock size={14} /> {timeStr}
                </span>{" "}
              </div>{" "}
              {!isPastSection && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-700 transition-colors bg-cyan-50 px-3 py-1.5 rounded-lg w-fit"
                >
                  {" "}
                  <MapPin size={12} /> Abrir en Google Maps{" "}
                </a>
              )}{" "}
            </div>{" "}
          </div>{" "}
          {!isPastSection && isUpcoming && (
            <div className="flex flex-row md:flex-col gap-2 shrink-0 mt-4 md:mt-0">
              {" "}
              <button
                onClick={() => handleEditClick(app)}
                disabled={loadingStaff && appToEdit?.id === app.id}
                className="w-full px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {" "}
                {loadingStaff && appToEdit?.id === app.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Pencil size={16} />
                )}{" "}
                Editar{" "}
              </button>{" "}
              <button
                onClick={() => {
                  setAppToCancel(app);
                  setCancelModalOpen(true);
                }}
                className="w-full px-6 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {" "}
                <XCircle size={16} /> Cancelar{" "}
              </button>{" "}
            </div>
          )}{" "}
        </div>{" "}
      </motion.div>
    );
  };
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 animate-in fade-in duration-500">
      {" "}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-sm">
        {" "}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          {" "}
          <h3 className="text-3xl font-black flex items-center gap-3">
            {" "}
            <Calendar className="text-cyan-500" size={32} /> Mis Turnos{" "}
          </h3>{" "}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            {" "}
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === "upcoming" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {" "}
              Próximos{" "}
            </button>{" "}
            <button
              onClick={() => setActiveTab("past")}
              className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === "past" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {" "}
              Anteriores{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        <div className="space-y-10">
          {" "}
          {loading ? (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center gap-2 border border-slate-200 rounded-[1.5rem]">
              {" "}
              <Loader2 size={24} className="animate-spin text-cyan-500" />{" "}
              <p>Obteniendo tus turnos...</p>{" "}
            </div>
          ) : (
            <>
              {" "}
              {!loading && appointments.length === 0 && (
                <div className="text-center py-12 text-slate-500 border border-slate-200 rounded-[1.5rem]">
                  {" "}
                  <Calendar
                    size={48}
                    className="mx-auto opacity-20 mb-4"
                  />{" "}
                  <p>No tienes turnos registrados.</p>{" "}
                </div>
              )}{" "}
              {activeTab === "upcoming" &&
                (upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {" "}
                    {upcomingAppointments.map((app, idx) =>
                      renderAppointment(app, idx, false),
                    )}{" "}
                  </div>
                ) : (
                  appointments.length > 0 && (
                    <div className="text-center py-12 text-slate-500 border border-slate-200 rounded-[1.5rem]">
                      {" "}
                      <Calendar
                        size={48}
                        className="mx-auto opacity-20 mb-4"
                      />{" "}
                      <p>No tenés turnos próximos.</p>{" "}
                    </div>
                  )
                ))}{" "}
              {activeTab === "past" &&
                (pastAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {" "}
                    {pastAppointments.map((app, idx) =>
                      renderAppointment(app, idx, true),
                    )}{" "}
                  </div>
                ) : (
                  appointments.length > 0 && (
                    <div className="text-center py-12 text-slate-500 border border-slate-200 rounded-[1.5rem]">
                      {" "}
                      <Calendar
                        size={48}
                        className="mx-auto opacity-20 mb-4"
                      />{" "}
                      <p>No tenés turnos anteriores.</p>{" "}
                    </div>
                  )
                ))}{" "}
            </>
          )}{" "}
        </div>{" "}
      </div>{" "}
      {/* Cancel Confirmation Modal */}{" "}
      {cancelModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {" "}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCancelModalOpen(false)}
          />{" "}
          <div className="relative w-full max-w-sm rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden text-center">
            {" "}
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5">
              {" "}
              <XCircle size={32} />{" "}
            </div>{" "}
            <h4 className="text-xl font-black tracking-tight text-slate-900 mb-2">
              {" "}
              ¿Cancelar Turno?{" "}
            </h4>{" "}
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              {" "}
              Estás a punto de cancelar tu turno en{" "}
              <strong>{appToCancel?.organizations?.name}</strong>. Esta acción
              no se puede deshacer.{" "}
            </p>{" "}
            <div className="flex flex-col gap-3">
              {" "}
              <button
                type="button"
                onClick={confirmCancel}
                disabled={cancelingId === appToCancel?.id}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50"
              >
                {" "}
                {cancelingId === appToCancel?.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}{" "}
                Sí, cancelar turno{" "}
              </button>{" "}
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                {" "}
                No, mantener mi lugar{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      ) : null}{" "}
      {/* Edit Appointment Modal */}{" "}
      <AppointmentModal
        isOpen={editModalOpen}
        appointment={appToEdit}
        staffOptions={staffOptions}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />{" "}
    </div>
  );
}
