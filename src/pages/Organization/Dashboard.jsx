import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Routes, Route, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getUserOrganizations } from "@/supabase/services/organizations";
import StaffManager from "@/components/Organization/StaffManager";
import StaffSchedulesManager from "@/components/Organization/StaffSchedulesManager";
import BranchCalendar from "@/components/Organization/BranchCalendar";
import { getOrganizationMetrics } from "@/supabase/services/metrics";
import {
  Building2,
  Calendar,
  Users,
  UserRound,
  ChevronLeft,
  LayoutDashboard,
  Clock,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentOrg, setCurrentOrg] = useState(null);
  const [staffCount, setStaffCount] = useState(0);
  const [dashboardMetrics, setDashboardMetrics] = useState({ freeSlots: 0, reservedSlots: 0 });
  const [staffRefreshKey, setStaffRefreshKey] = useState(0);
  const [schedulesRefreshKey, setSchedulesRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orgMetrics, setOrgMetrics] = useState({
    occupancyRate: 0,
    totalAppointments: 0,
    employeeOfTheMonth: "N/A",
  });

  const currentOrgId = currentOrg?.id || currentOrg?.organization_id || null;

  useEffect(() => {
    if (user && slug) fetchOrgDetails();
  }, [user, slug]);

  const fetchOrgDetails = async () => {
    setLoading(true);
    const { data } = await getUserOrganizations(user.id);
    const found = data?.find((o) => o.slug === slug);
    if (!found) {
      navigate("/dashboard");
    } else {
      const id = found.id || found.organization_id || null;
      setCurrentOrg({ ...found, id });
      fetchMetrics(id);
    }
    setLoading(false);
  };

  const fetchMetrics = async (orgId) => {
    if (!orgId) return;
    setMetricsLoading(true);
    const { data, success } = await getOrganizationMetrics(orgId);
    if (success && data) {
      setOrgMetrics({
        occupancyRate: data.occupancyRate,
        totalAppointments: data.totalAppointments,
        employeeOfTheMonth: data.employeeOfTheMonth,
      });
    }
    setMetricsLoading(false);
  };

  if (loading) return null;

  const basePath = `/dashboard/${slug}`;
  const currentPath = location.pathname;

  const NavItem = ({ to, icon: Icon, label, exact = false }) => {
    const isActive = exact ? currentPath === to : currentPath.startsWith(to);
    return (
      <Link
        to={to}
        title={label}
        className={`flex items-center gap-3 px-4 py-3 border-2 font-black uppercase tracking-widest text-xs transition-all ${
          isActive
            ? "bg-cyan-400 text-slate-900 border-slate-900 shadow-[2px_2px_0_0_#0f172a] translate-x-[2px] translate-y-[2px]"
            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-500"
        } ${sidebarOpen ? "w-full" : "w-fit mx-auto justify-center"}`}
      >
        <Icon size={18} strokeWidth={3} className="shrink-0" />
        {sidebarOpen && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <div className="bg-[#f0f3fa] text-slate-900">

      {/* ── SIDEBAR (desktop, fixed) ── */}
      <aside
        className={`fixed top-[72px] bottom-0 left-0 bg-slate-900 border-r-4 border-slate-900 hidden md:flex flex-col text-white overflow-hidden transition-[width] duration-300 ease-in-out z-40 ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        {/* Brand header */}
        <div className={`border-b-4 border-slate-800 ${sidebarOpen ? "p-5" : "p-3 flex justify-center"}`}>
          {sidebarOpen ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors mb-4"
              >
                <ChevronLeft size={14} strokeWidth={3} /> Volver al panel
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-yellow-400 border-2 border-slate-600 flex items-center justify-center text-slate-900 shrink-0">
                  {currentOrg.logo_url
                    ? <img src={currentOrg.logo_url} className="w-full h-full object-cover" alt={currentOrg.name} />
                    : <Building2 size={18} strokeWidth={2} />}
                </div>
                <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest truncate">
                  {currentOrg.name}
                </h2>
              </div>
            </>
          ) : (
            <div className="w-9 h-9 bg-yellow-400 border-2 border-slate-600 flex items-center justify-center text-slate-900">
              {currentOrg.logo_url
                ? <img src={currentOrg.logo_url} className="w-full h-full object-cover" alt={currentOrg.name} />
                : <Building2 size={18} strokeWidth={2} />}
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className={`flex-1 space-y-2 ${sidebarOpen ? "p-4" : "p-2"}`}>
          <NavItem to={basePath} icon={LayoutDashboard} label="Resumen" exact />
          <NavItem to={`${basePath}/calendario`} icon={Calendar} label="Calendario" />
          <NavItem to={`${basePath}/empleados`} icon={Users} label="Empleados" />
          <NavItem to={`${basePath}/horarios`} icon={Clock} label="Horarios" />
        </nav>

        {/* Toggle */}
        <div className={`border-t-4 border-slate-800 ${sidebarOpen ? "p-4" : "p-2"}`}>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Contraer panel" : "Expandir panel"}
            className={`flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-2 border-slate-700 hover:border-slate-400 hover:text-white transition-all ${
              sidebarOpen ? "w-full" : "w-fit mx-auto"
            }`}
          >
            {sidebarOpen
              ? <PanelLeftClose size={16} strokeWidth={3} />
              : <PanelLeftOpen size={16} strokeWidth={3} />}
            {sidebarOpen && <span>Contraer</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT (offset to match sidebar) ── */}
      <main className={`transition-[margin] duration-300 ease-in-out min-h-screen pt-[72px] overflow-y-auto ${
        sidebarOpen ? "md:ml-64" : "md:ml-16"
      }`}>
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b-4 border-slate-900">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 hover:text-white"
          >
            <ChevronLeft size={16} strokeWidth={3} /> Volver
          </button>
          <span className="text-sm font-black text-cyan-400 uppercase truncate">{currentOrg.name}</span>
        </div>

        <div className="p-6 md:p-8 pb-24 md:pb-8">
          <Routes>

            {/* Resumen */}
            <Route path="/" element={
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">
                  Métricas del Negocio
                </h1>
                {metricsLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-slate-900" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                      { label: "Tasa de Ocupación", icon: BarChart3, color: "bg-cyan-400", value: `${orgMetrics.occupancyRate}%` },
                      { label: "Turnos del Mes", icon: Calendar, color: "bg-yellow-400", value: String(orgMetrics.totalAppointments) },
                      { label: "Empleado del Mes", icon: UserRound, color: "bg-purple-400", value: orgMetrics.employeeOfTheMonth },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-8 min-h-[160px] flex flex-col relative overflow-hidden group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0_0_#0f172a] transition-all cursor-default"
                      >
                        <div className="absolute -right-4 -top-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                          <item.icon size={120} strokeWidth={1} />
                        </div>
                        <div className="flex justify-end relative z-10 mb-4">
                          <div className={`p-3 border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a] ${item.color} text-slate-900 rotate-3`}>
                            <item.icon size={24} strokeWidth={3} />
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-start justify-end relative z-10 w-full mt-auto">
                          <span className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter w-full text-right block pr-2 truncate" title={item.value}>
                            {item.value}
                          </span>
                          <div className="w-full h-1 bg-slate-900 my-2" />
                          <p className="text-slate-900 text-xs font-black uppercase tracking-widest w-full text-right pr-2">
                            {item.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            } />

            {/* Calendario */}
            <Route path="calendario" element={
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <BranchCalendar
                  organizationId={currentOrgId}
                  organizationName={currentOrg.name}
                  onMetricsChange={setDashboardMetrics}
                  staffRefreshKey={staffRefreshKey}
                  schedulesRefreshKey={schedulesRefreshKey}
                />
              </div>
            } />

            {/* Empleados */}
            <Route path="empleados" element={
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">Empleados</h1>
                <StaffManager
                  organizationId={currentOrgId}
                  organizationName={currentOrg.name}
                  onCountChange={setStaffCount}
                  onStaffChanged={() => setStaffRefreshKey((prev) => prev + 1)}
                />
              </div>
            } />

            {/* Horarios */}
            <Route path="horarios" element={
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">Horarios</h1>
                <StaffSchedulesManager
                  organizationId={currentOrgId}
                  staffRefreshKey={staffRefreshKey}
                  onSchedulesChanged={() => setSchedulesRefreshKey((prev) => prev + 1)}
                />
              </div>
            } />

          </Routes>
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t-4 border-slate-900 flex justify-around p-2 z-50">
        {[
          { to: basePath, icon: LayoutDashboard, exact: true },
          { to: `${basePath}/calendario`, icon: Calendar },
          { to: `${basePath}/empleados`, icon: Users },
          { to: `${basePath}/horarios`, icon: Clock },
        ].map((item, idx) => {
          const isActive = item.exact ? currentPath === item.to : currentPath.startsWith(item.to);
          return (
            <Link
              key={idx}
              to={item.to}
              className={`p-3 border-2 transition-all ${
                isActive
                  ? "bg-cyan-400 text-slate-900 border-slate-900 shadow-[2px_2px_0_0_#0f172a] -translate-y-1"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <item.icon size={20} strokeWidth={3} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
