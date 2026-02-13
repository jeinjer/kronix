import React, { useEffect, useMemo, useState } from 'react';
import { UserPlus, Loader2, Mail, UserRound, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createStaffMember,
  getOrganizationStaff,
  softDeleteStaffMember,
  updateStaffStatus,
} from '@/supabase/services/staff';

export default function StaffManager({ organizationId, organizationName, onCountChange, onStaffChanged }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [staffToDelete, setStaffToDelete] = useState(null);

  const activeCount = useMemo(
    () => staffList.filter((employee) => employee.is_active).length,
    [staffList]
  );

  useEffect(() => {
    if (!organizationId) return;
    fetchStaff();
  }, [organizationId]);

  useEffect(() => {
    onCountChange?.(staffList.length);
  }, [staffList.length, onCountChange]);

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await getOrganizationStaff(organizationId);

    if (error) {
      toast.error('No se pudo cargar el staff');
      setStaffList([]);
    } else {
      setStaffList(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Ingresa el nombre del empleado');
      return;
    }

    setSubmitting(true);

    const { data, error } = await createStaffMember({
      organizationId,
      name,
      email,
    });

    if (error || !data) {
      toast.error(error?.message || 'No se pudo agregar el empleado');
    } else {
      setStaffList((prev) => [data, ...prev]);
      setName('');
      setEmail('');
      toast.success('Empleado agregado');
      onStaffChanged?.();
    }

    setSubmitting(false);
  };

  const handleToggleStatus = async (employee) => {
    setUpdatingId(employee.id);

    const { data, error } = await updateStaffStatus({
      staffId: employee.id,
      isActive: !employee.is_active,
    });

    if (error || !data) {
      toast.error('No se pudo actualizar el estado');
    } else {
      setStaffList((prev) =>
        prev.map((item) =>
          item.id === employee.id ? { ...item, is_active: data.is_active } : item
        )
      );
      toast.success(data.is_active ? 'Empleado activado' : 'Empleado desactivado');
      onStaffChanged?.();
    }

    setUpdatingId('');
  };

  const handleDeleteEmployee = (employee) => {
    setStaffToDelete(employee);
  };

  const confirmDeleteEmployee = async () => {
    if (!staffToDelete?.id) return;

    setDeletingId(staffToDelete.id);
    const { data, error } = await softDeleteStaffMember({ staffId: staffToDelete.id });

    if (error || !data) {
      toast.error('No se pudo eliminar el empleado');
    } else {
      setStaffList((prev) => prev.filter((item) => item.id !== staffToDelete.id));
      toast.success('Empleado eliminado');
      onStaffChanged?.();
    }

    setStaffToDelete(null);
    setDeletingId('');
  };

  return (
    <section className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-4">
      <article className="xl:col-span-1 bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 transition-colors duration-500">
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
          Agregar Empleado
        </h3>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
          Sucursal: {organizationName}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
              Nombre
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej: Juan Perez"
              className="w-full mt-2 bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </label>

          <label className="block">
            <span className="text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
              Email (opcional)
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Si existe en profiles, se vincula"
              className="w-full mt-2 bg-slate-50 dark:bg-[#181824] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-70 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-900/20"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {submitting ? 'Guardando...' : 'Agregar a la sucursal'}
          </button>
        </form>
      </article>

      <article className="xl:col-span-2 bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 transition-colors duration-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Equipo
          </h3>
          <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">
            {activeCount} activos de {staffList.length}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
            <div className="h-16 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-8 text-center">
            <UserRound size={28} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Esta sucursal todavia no tiene empleados cargados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {staffList.map((employee) => (
              <div
                key={employee.id}
                className="rounded-xl border border-slate-200 dark:border-white/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 dark:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-cyan-600/20 text-cyan-500 flex items-center justify-center font-bold overflow-hidden">
                    {employee.avatar_url ? (
                      <img src={employee.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (employee.name?.[0] || 'E').toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{employee.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                      <Mail size={12} />
                      {employee.profile?.email || 'Sin cuenta vinculada'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span
                    className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold ${
                      employee.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-400/20 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {employee.is_active ? 'Activo' : 'Inactivo'}
                  </span>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Activo</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={employee.is_active}
                      onClick={() => handleToggleStatus(employee)}
                      disabled={updatingId === employee.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${
                        employee.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          employee.is_active ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    {updatingId === employee.id ? <Loader2 size={13} className="animate-spin" /> : null}
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDeleteEmployee(employee)}
                    disabled={deletingId === employee.id}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 transition-colors disabled:opacity-60"
                  >
                    {deletingId === employee.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Eliminar empleado
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {staffToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setStaffToDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13131a] p-6 shadow-2xl">
            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Confirmar eliminacion
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
              Seguro que quieres eliminar a <span className="font-bold">{staffToDelete.name}</span>? Desaparecera de la lista.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteEmployee}
                disabled={deletingId === staffToDelete.id}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-70"
              >
                {deletingId === staffToDelete.id ? <Loader2 size={13} className="animate-spin" /> : null}
                {deletingId === staffToDelete.id ? 'Eliminando...' : 'Si, eliminar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
