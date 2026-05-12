import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserOrganizations } from "@/supabase/services/organizations";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Plus, BarChart3, ChevronRight } from "lucide-react";
import HomeLoader from "@/components/Loaders/HomeLoader";
import { toast } from "sonner";
import { getGlobalMetrics } from "@/supabase/services/metrics";

export default function UserPanel() {
  const { user, perfil } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("negocios");
  const navigate = useNavigate();
  const [globalMetrics, setGlobalMetrics] = useState({
    occupancyRate: 0,
    totalAppointments: 0,
    employeeOfTheMonth: "N/A",
  });
  const [metricsLoading, setMetricsLoading] = useState(false);

  useEffect(() => {
    if (user) fetchOrgs();
  }, [user]);

  const fetchOrgs = async () => {
    setLoading(true);
    const { data } = await getUserOrganizations(user.id);
    if (!data || data.length === 0) {
      navigate("/onboarding");
      return;
    }
    setOrganizations(data || []);
    setLoading(false);

    if (user?.id) {
      setMetricsLoading(true);
      const { success, data: gData } = await getGlobalMetrics(user.id);
      if (success && gData) {
        setGlobalMetrics({
          occupancyRate: gData.occupancyRate,
          totalAppointments: gData.totalAppointments,
          employeeOfTheMonth: gData.employeeOfTheMonth,
        });
      }
      setMetricsLoading(false);
    }
  };

  const handleCreateNew = () => {
    // Check if the user is on the free role (assuming 'free' is the default)
    if (perfil?.role === "free") {
      toast.error("NO PUEDES CREAR MÁS NEGOCIOS", {
        description: "Tu plan actual no permite crear más sucursales. Mejora tu suscripción.",
        style: {
          background: "#fff",
          color: "#0f172a",
          border: "4px solid #0f172a",
          borderRadius: "0",
          boxShadow: "4px 4px 0 0 #0f172a",
          fontFamily: "inherit"
        }
      });
      return;
    }
    navigate("/onboarding");
  };

  if (loading) return <HomeLoader />;

  return (
    <div className="flex min-h-[calc(100vh-6rem)] bg-[#f0f3fa] text-slate-900 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif]">
      {/* Sidebar Brutalista */}
      <aside className="w-64 bg-slate-900 border-r-4 border-slate-900 hidden md:flex flex-col text-white">
        <div className="p-6 pb-4 border-b-4 border-slate-800">
          <h2 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2"><Building2 size={16} strokeWidth={3} /> Panel Central</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab("negocios")}
            className={`w-full flex items-center gap-3 px-4 py-3 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] font-black uppercase tracking-widest text-xs transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${activeTab === "negocios" ? "bg-cyan-400 text-slate-900" : "bg-white text-slate-900"}`}>
            <Building2 size={18} strokeWidth={3} /> Mis Negocios
          </button>
          <button 
            onClick={() => setActiveTab("dashboards")}
            className={`w-full flex items-center gap-3 px-4 py-3 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] font-black uppercase tracking-widest text-xs transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${activeTab === "dashboards" ? "bg-cyan-400 text-slate-900" : "bg-white text-slate-900"}`}>
            <BarChart3 size={18} strokeWidth={3} /> Dashboards
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white border-4 border-slate-900 p-6 shadow-[8px_8px_0_0_#0f172a] relative">
          <div className="absolute -top-4 -left-4 bg-yellow-400 border-2 border-slate-900 px-3 py-1 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_#0f172a] -rotate-3">
            {activeTab === "negocios" ? "Tus locales" : "Métricas"}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Hola, {perfil?.full_name?.split(" ")[0] || "Admin"}</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              {activeTab === "negocios" ? "Selecciona un negocio para administrarlo." : "Visualiza el rendimiento de tus negocios."}
            </p>
          </div>
          {activeTab === "negocios" && (
            <button onClick={handleCreateNew} className="hidden md:flex bg-cyan-400 border-2 border-slate-900 px-4 py-2 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all items-center gap-2">
              <Plus size={16} strokeWidth={3} /> Nuevo Negocio
            </button>
          )}
        </div>

        {activeTab === "negocios" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Link key={org.id} to={`/dashboard/${org.slug}`} className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[12px_12px_0_0_#0f172a] transition-all flex flex-col group cursor-pointer relative">
                <div className="h-32 bg-yellow-400 border-b-4 border-slate-900 overflow-hidden relative">
                   {org.logo_url ? (
                     <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center font-black text-4xl opacity-20 uppercase">{org.name.charAt(0)}</div>
                   )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-4 leading-tight group-hover:text-cyan-600 transition-colors">{org.name}</h3>
                  
                  <div className="mt-auto">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 bg-slate-100 border-2 border-slate-900 px-3 py-2 flex items-center justify-between shadow-[2px_2px_0_0_#0f172a]">
                      Administrar <ChevronRight size={16} strokeWidth={3} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "dashboards" && (
          <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
            <div className="p-8 border-b-4 border-slate-900 text-center bg-cyan-400">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Métricas Globales</h2>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-widest mt-2">Rendimiento consolidado de todos tus negocios en el mes actual.</p>
            </div>
            
            <div className="p-8">
              {metricsLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-slate-900"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      label: "Tasa de Ocupación",
                      icon: BarChart3,
                      color: "bg-cyan-400",
                      value: `${globalMetrics.occupancyRate}%`,
                    },
                    {
                      label: "Turnos del Mes",
                      icon: Building2,
                      color: "bg-yellow-400",
                      value: String(globalMetrics.totalAppointments),
                    },
                    {
                      label: "Empleado del Mes",
                      icon: Plus, // placeholder icon, will use something else if imported, but Plus is fine or Building2
                      color: "bg-purple-400",
                      value: globalMetrics.employeeOfTheMonth,
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] p-6 flex flex-col relative overflow-hidden group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#0f172a] transition-all cursor-default min-h-[160px]"
                    >
                      <div className="flex justify-end relative z-10 mb-4">
                        <div
                          className={`p-3 border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a] ${item.color} text-slate-900 rotate-3`}
                        >
                          <item.icon size={24} strokeWidth={3} />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col items-start justify-end relative z-10 w-full mt-auto">
                        <span className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter w-full text-right block pr-2 truncate" title={item.value}>
                          {item.value}
                        </span>
                        <div className="w-full h-1 bg-slate-900 my-2"></div>
                        <p className="text-slate-900 text-[10px] md:text-xs font-black uppercase tracking-widest w-full text-right pr-2">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
