import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserOrganizations } from '@/supabase/services/organizations';
import Profile from '@/components/Profile/Profile';
import Organizations from '@/components/Organization/Organizations';

export default function UserPanel() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrgs();
    }
  }, [user]);

  const fetchOrgs = async () => {
    setLoading(true);
    const { data } = await getUserOrganizations(user.id);
    setOrganizations(data || []);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Izquierdo: Perfil */}
        <div className="lg:col-span-4">
          <Profile />
        </div>

        {/* Lado Derecho: Listado de Negocios */}
        <div className="lg:col-span-8">
          <Organizations organizations={organizations} loading={loading} />
        </div>
      </div>
    </div>
  );
}