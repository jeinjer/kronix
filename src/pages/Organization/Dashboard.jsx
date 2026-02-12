import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getUserOrganizations } from '@/supabase/services/organizations';
import StaffManager from '@/components/Organization/StaffManager';
import StaffSchedulesManager from '@/components/Organization/StaffSchedulesManager';
import BranchCalendar from '@/components/Organization/BranchCalendar';
import {
  Building2,
  Calendar,
  Users,
  UserRound,
  ChevronLeft,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [currentOrg, setCurrentOrg] = useState(null);
  const [staffCount, setStaffCount] = useState(0);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    freeSlots: 0,
    reservedSlots: 0,
  });
  const [staffRefreshKey, setStaffRefreshKey] = useState(0);
  const [schedulesRefreshKey, setSchedulesRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const currentOrgId = currentOrg?.id || currentOrg?.organization_id || null;

  useEffect(() => {
    if (user && slug) {
      fetchOrgDetails();
    }
  }, [user, slug]);

  const fetchOrgDetails = async () => {
    setLoading(true);
    const { data } = await getUserOrganizations(user.id);
    const found = data?.find((organization) => organization.slug === slug);

    if (!found) {
      navigate('/dashboard');
    } else {
      setCurrentOrg({
        ...found,
        id: found.id || found.organization_id || null,
      });
    }

    setLoading(false);
  };

  if (loading) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <div className="mb-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={14} />
            Volver al panel
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-600/20 rounded-xl flex items-center justify-center text-cyan-500 border border-cyan-500/20">
            {currentOrg.logo_url ? (
              <img src={currentOrg.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Building2 size={24} />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {currentOrg.name}
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Panel de Gestion</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Turnos Libres',
            icon: Calendar,
            color: 'text-cyan-400',
            value: String(dashboardMetrics.freeSlots),
          },
          {
            label: 'Turnos Reservados',
            icon: Users,
            color: 'text-orange-400',
            value: String(dashboardMetrics.reservedSlots),
          },
          {
            label: 'Cantidad de Empleados',
            icon: UserRound,
            color: 'text-purple-400',
            value: String(staffCount),
          },
        ].map((item, index) => (
          <div
            key={index}
            className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 p-6 rounded-2xl transition-colors duration-500 min-h-[170px] flex flex-col"
          >
            <div className="flex justify-end">
              <div className={`p-2.5 bg-slate-100 dark:bg-white/5 rounded-lg ${item.color}`}>
                <item.icon size={20} />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-5xl leading-none font-black text-slate-900 dark:text-white">
                {item.value}
              </span>
              <p className="mt-3 text-slate-500 text-xs font-bold uppercase tracking-widest">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <BranchCalendar
        organizationId={currentOrgId}
        organizationName={currentOrg.name}
        onMetricsChange={setDashboardMetrics}
        staffRefreshKey={staffRefreshKey}
        schedulesRefreshKey={schedulesRefreshKey}
      />

      <StaffManager
        organizationId={currentOrgId}
        organizationName={currentOrg.name}
        onCountChange={setStaffCount}
        onStaffChanged={() => setStaffRefreshKey((prev) => prev + 1)}
      />

      <StaffSchedulesManager
        organizationId={currentOrgId}
        staffRefreshKey={staffRefreshKey}
        onSchedulesChanged={() => setSchedulesRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}
