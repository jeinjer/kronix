import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Navigation,
  ArrowLeft,
  Users,
  CalendarDays,
  Loader2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { getOrganizationBySlug } from "../../supabase/services/organizations";
import { getOrganizationStaff } from "../../supabase/services/staff";
import { getStaffSchedules } from "../../supabase/services/schedules";
import AvailableSlots from "../../components/Organization/AvailableSlots";
import { useAuth } from "../../context/AuthContext";
export default function PublicBooking() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, perfil } = useAuth();
  const [org, setOrg] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: orgData } = await getOrganizationBySlug(slug);
      if (!orgData) {
        setLoading(false);
        return;
      }
      setOrg(orgData);
      
      const { data: staffData } = await getOrganizationStaff(orgData.id);
      const activeStaff = staffData?.filter((s) => s.is_active) || [];

      // Filter staff to only those who actually have schedules
      const staffWithSchedules = await Promise.all(
        activeStaff.map(async (staff) => {
          const { data: schedules } = await getStaffSchedules(staff.id);
          return (schedules && schedules.length > 0) ? staff : null;
        })
      );
      
      setStaffList(staffWithSchedules.filter(Boolean));
      setLoading(false);
    }
    loadData();
  }, [slug]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        {" "}
        <Loader2 size={40} className="animate-spin text-cyan-500" />{" "}
      </div>
    );
  }
  if (!org) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
        {" "}
        <Sparkles size={48} className="opacity-20" />{" "}
        <h2 className="text-xl font-bold">Organización no encontrada</h2>{" "}
        <button
          onClick={() => navigate("/")}
          className="text-cyan-500 hover:underline"
        >
          Volver al inicio
        </button>{" "}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-24 pb-16 px-4 md:px-8 font-sans transition-colors duration-500">
      {" "}
      <div className="max-w-5xl mx-auto space-y-8">
        {" "}
        {/* Header / Nav de retroceso */}{" "}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-500 hover:text-cyan-500 transition-colors font-bold text-sm"
        >
          {" "}
          <ArrowLeft size={16} /> Volver a explorar{" "}
        </button>{" "}
        {/* Info de la Organización */}{" "}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
          {" "}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg shrink-0 bg-slate-100 flex items-center justify-center">
            {" "}
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Sparkles className="text-slate-400" size={32} />
            )}{" "}
          </div>{" "}
          <div className="text-center md:text-left">
            {" "}
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {org.name}
            </h1>{" "}
            <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2">
              {" "}
              <MapPin size={16} className="text-cyan-500" />{" "}
              {org.street
                ? `${org.street} ${org.number || ""}`.trim() + ","
                : ""}
              {org.cities?.name || "Ciudad"},{" "}
              {org.provinces?.name || "Provincia"}{" "}
            </p>{" "}
            <div className="mt-3 inline-block px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold uppercase tracking-wider">
              {" "}
              {org.industry || "Servicio"}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {" "}
          {/* Col 1: Selección de Staff */}{" "}
          <div className="lg:col-span-4 space-y-4">
            {" "}
            <h3 className="text-lg font-black flex items-center gap-2">
              {" "}
              <Users className="text-cyan-500" /> Selecciona un Profesional{" "}
            </h3>{" "}
            <div className="space-y-3">
              {" "}
              {staffList.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaff(staff)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedStaff?.id === staff.id ? "bg-cyan-50 border-cyan-500/50 shadow-md" : "bg-white border-slate-200 hover:border-cyan-500/30"}`}
                >
                  {" "}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
                    {" "}
                    {staff.avatar_url ? (
                      <img
                        src={staff.avatar_url}
                        alt={staff.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserRound className="text-slate-400" size={20} />
                    )}{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h4 className="font-bold text-slate-900">
                      {staff.name}
                    </h4>{" "}
                    <p className="text-xs text-slate-500">
                      Profesional disponible
                    </p>{" "}
                  </div>{" "}
                </button>
              ))}{" "}
              {staffList.length === 0 && (
                <div className="text-slate-500 text-sm text-center py-6 border border-dashed rounded-2xl border-slate-300">
                  {" "}
                  No hay profesionales disponibles en este momento.{" "}
                </div>
              )}{" "}
            </div>{" "}
          </div>{" "}
          {/* Col 2: Calendario / AvailableSlots */}{" "}
          <div className="lg:col-span-8">
            {" "}
            {selectedStaff ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {" "}
                <AvailableSlots
                  organizationId={org.id}
                  staffId={selectedStaff.id}
                  staffName={selectedStaff.name}
                  serviceDuration={30} // default
                  isPublicMode={true}
                  onBookingCreated={(newApp) => {
                    setSuccessBooking(newApp);
                  }}
                />{" "}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-[2rem] p-12 shadow-sm flex flex-col items-center justify-center text-center text-slate-500 h-full min-h-[400px]">
                {" "}
                <CalendarDays size={48} className="opacity-20 mb-4" />{" "}
                <p className="font-bold">
                  Selecciona un profesional
                  <br />
                  para ver sus horarios disponibles.
                </p>{" "}
              </div>
            )}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {successBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {" "}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSuccessBooking(null)}
          />{" "}
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden text-center">
            {" "}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-400"></div>{" "}
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
              {" "}
              <Sparkles size={32} />{" "}
            </div>{" "}
            <h4 className="text-xl font-black tracking-tight text-slate-900 mb-2">
              {" "}
              ¡Turno Confirmado!{" "}
            </h4>{" "}
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              {" "}
              Tu reserva en <strong>{org?.name}</strong> con{" "}
              <strong>{selectedStaff?.name}</strong> fue agendada
              correctamente.{" "}
            </p>{" "}
            <div className="flex flex-col gap-3">
              {" "}
              <button
                type="button"
                onClick={() => navigate("/mis-turnos")}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                {" "}
                <UserRound size={16} /> Ver en mi perfil{" "}
              </button>{" "}
              <button
                type="button"
                onClick={() => setSuccessBooking(null)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                {" "}
                Cerrar y seguir navegando{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      ) : null}{" "}
    </div>
  );
}
