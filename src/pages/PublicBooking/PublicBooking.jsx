import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
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
import EmptyState from "@/components/UI/EmptyState";

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
      <div className="min-h-screen flex items-center justify-center bg-[#f0f3fa]">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: [0, -6, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 bg-yellow-400 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] flex items-center justify-center"
          >
            <Loader2 size={28} className="animate-spin text-slate-900" />
          </motion.div>
          <span className="font-black text-xs uppercase tracking-widest text-slate-500">Cargando negocio...</span>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f3fa] px-4">
        <EmptyState 
          title="Organización no encontrada"
          description="El negocio que buscás no existe o fue eliminado."
          action={
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-cyan-400 border-4 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_0_#0f172a] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer"
            >
              Volver al inicio
            </button>
          }
        />
      </div>
    );
  }

  const fullAddress = [
    org.street ? `${org.street} ${org.number || ""}`.trim() : null,
    org.cities?.name,
    org.provinces?.name,
  ].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-[#f0f3fa] text-slate-900 pt-24 pb-16 px-4 md:px-8 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif] transition-colors duration-500">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:shadow-none hover:translate-y-[1px] hover:translate-x-[1px] bg-white text-slate-900 font-black uppercase tracking-widest text-xs transition-all cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={3} /> Volver a explorar
        </button>

        {/* Organization Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 overflow-hidden border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] shrink-0 bg-yellow-400 flex items-center justify-center">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Sparkles className="text-slate-900" size={32} />
            )}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
              {org.name}
            </h1>
            {fullAddress && (
              <p className="text-slate-600 flex items-center justify-center md:justify-start gap-2 font-bold text-sm">
                <MapPin size={16} className="text-cyan-500 shrink-0" />
                {fullAddress}
              </p>
            )}
            <div className="mt-3 inline-block px-3 py-1.5 bg-cyan-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] text-xs font-black uppercase tracking-widest">
              {org.industry || "Servicio"}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Staff Selection */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-tight">
              <Users className="text-cyan-500" strokeWidth={3} /> Profesional
            </h3>
            <div className="space-y-3">
              {staffList.map((staff, idx) => (
                <motion.button
                  key={staff.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedStaff(staff)}
                  className={`w-full flex items-center gap-4 p-4 border-4 transition-all text-left cursor-pointer ${
                    selectedStaff?.id === staff.id
                      ? "bg-cyan-400 border-slate-900 shadow-none translate-x-1 translate-y-1"
                      : "bg-white border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_0_#0f172a]"
                  }`}
                >
                  <div className="w-12 h-12 overflow-hidden bg-yellow-400 border-2 border-slate-900 shrink-0 flex items-center justify-center">
                    {staff.avatar_url ? (
                      <img
                        src={staff.avatar_url}
                        alt={staff.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserRound className="text-slate-900" size={20} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">
                      {staff.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Profesional disponible
                    </p>
                  </div>
                </motion.button>
              ))}
              {staffList.length === 0 && (
                <EmptyState
                  title="Sin profesionales"
                  description="No hay profesionales disponibles en este momento."
                />
              )}
            </div>
          </div>

          {/* Calendar / Slots */}
          <div className="lg:col-span-8">
            {selectedStaff ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AvailableSlots
                  organizationId={org.id}
                  staffId={selectedStaff.id}
                  staffName={selectedStaff.name}
                  serviceDuration={30}
                  isPublicMode={true}
                  onBookingCreated={(newApp) => {
                    setSuccessBooking(newApp);
                  }}
                />
              </motion.div>
            ) : (
              <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <div className="w-16 h-16 bg-yellow-400 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] flex items-center justify-center mb-4 rotate-3">
                  <CalendarDays size={28} className="text-slate-900" />
                </div>
                <p className="font-black uppercase tracking-widest text-sm text-slate-500">
                  Selecciona un profesional
                  <br />
                  para ver sus horarios.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSuccessBooking(null)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            className="relative w-full max-w-sm border-4 border-slate-900 bg-white p-8 shadow-[12px_12px_0_0_#0f172a] text-center"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
            <div className="w-16 h-16 bg-yellow-400 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] flex items-center justify-center mx-auto mb-5 -rotate-3">
              <Sparkles size={28} className="text-slate-900" />
            </div>
            <h4 className="text-xl font-black tracking-tight text-slate-900 mb-2 uppercase">
              ¡Turno Confirmado!
            </h4>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-bold">
              Tu reserva en <strong className="text-slate-900">{org?.name}</strong> con{" "}
              <strong className="text-slate-900">{selectedStaff?.name}</strong> fue agendada
              correctamente.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate("/mis-turnos")}
                className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-black bg-cyan-400 border-4 border-slate-900 text-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase tracking-widest cursor-pointer"
              >
                <UserRound size={16} strokeWidth={3} /> Ver en mi perfil
              </button>
              <button
                type="button"
                onClick={() => setSuccessBooking(null)}
                className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-black bg-white border-4 border-slate-900 text-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase tracking-widest cursor-pointer"
              >
                Cerrar y seguir navegando
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
