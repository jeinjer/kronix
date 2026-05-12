import React, { useEffect, useMemo, useState } from "react";
import { UserPlus, Loader2, Mail, UserRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createStaffMember,
  getOrganizationStaff,
  softDeleteStaffMember,
  updateStaffStatus,
} from "@/supabase/services/staff";

export default function StaffManager({
  organizationId,
  organizationName,
  onCountChange,
  onStaffChanged,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [staffToDelete, setStaffToDelete] = useState(null);

  const activeCount = useMemo(
    () => staffList.filter((employee) => employee.is_active).length,
    [staffList],
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
      toast.error("No se pudo cargar el staff");
      setStaffList([]);
    } else {
      setStaffList(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Ingresa el nombre del empleado");
      return;
    }

    setSubmitting(true);

    const { data, error } = await createStaffMember({
      organizationId,
      name,
      email,
    });

    if (error || !data) {
      toast.error(error?.message || "No se pudo agregar el empleado");
    } else {
      setStaffList((prev) => [data, ...prev]);
      setName("");
      setEmail("");
      toast.success("Empleado agregado");
      onStaffChanged?.();
    }

    setSubmitting(false);
  };

  const handleToggleStatus = async (employee) => {
    if (employee.is_active && activeCount <= 1) {
      toast.error(
        "Debe existir al menos un empleado activo para poder reservar turnos.",
      );
      return;
    }

    setUpdatingId(employee.id);

    const { data, error } = await updateStaffStatus({
      staffId: employee.id,
      isActive: !employee.is_active,
    });

    if (error || !data) {
      toast.error("No se pudo actualizar el estado");
    } else {
      setStaffList((prev) =>
        prev.map((item) =>
          item.id === employee.id
            ? { ...item, is_active: data.is_active }
            : item,
        ),
      );
      toast.success(
        data.is_active ? "Empleado activado" : "Empleado desactivado",
      );
      onStaffChanged?.();
    }

    setUpdatingId("");
  };

  const handleDeleteEmployee = (employee) => {
    if (staffList.length <= 1) {
      toast.error("No puedes eliminar el único empleado de la sucursal.");
      return;
    }

    if (employee.is_active && activeCount <= 1) {
      toast.error("No puedes eliminar al último empleado activo.");
      return;
    }

    setStaffToDelete(employee);
  };

  const confirmDeleteEmployee = async () => {
    if (!staffToDelete?.id) return;

    setDeletingId(staffToDelete.id);
    const { data, error } = await softDeleteStaffMember({
      staffId: staffToDelete.id,
    });

    if (error || !data) {
      toast.error("No se pudo eliminar el empleado");
    } else {
      setStaffList((prev) =>
        prev.filter((item) => item.id !== staffToDelete.id),
      );
      toast.success("Empleado eliminado");
      onStaffChanged?.();
    }

    setStaffToDelete(null);
    setDeletingId("");
  };

  return (
    <div className="space-y-8 font-[System-ui,-apple-system,BlinkMacSystemFont,Segoe_UI,Roboto,Helvetica_Neue,Arial,sans-serif]">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Formulario de Agregar */}
        <article className="xl:col-span-1 bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6 relative h-fit">
           <div className="absolute -top-4 -right-4 bg-yellow-400 border-2 border-slate-900 px-3 py-1 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_#0f172a] rotate-3">
              Nuevo Integrante
           </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6">
            Agregar Empleado
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest bg-cyan-400 border-2 border-slate-900 px-2 py-0.5 shadow-[2px_2px_0_0_#0f172a]">
                Nombre del profesional
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej: Juan Perez"
                className="w-full mt-3 bg-slate-50 border-4 border-slate-900 rounded-none px-4 py-3 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-cyan-400 transition-colors shadow-[4px_4px_0_0_#0f172a] focus:shadow-[6px_6px_0_0_#0f172a]"
              />
            </label>

            <label className="block">
              <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest bg-white border-2 border-slate-900 px-2 py-0.5 shadow-[2px_2px_0_0_#0f172a]">
                Email (Opcional)
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Para vincular cuenta"
                className="w-full mt-3 bg-slate-50 border-4 border-slate-900 rounded-none px-4 py-3 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-cyan-400 transition-colors shadow-[4px_4px_0_0_#0f172a] focus:shadow-[6px_6px_0_0_#0f172a]"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 border-4 border-slate-900 disabled:opacity-70 text-slate-900 px-4 py-3 text-sm font-black uppercase tracking-widest transition-all shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0f172a] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] mt-4"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" strokeWidth={3} />
              ) : (
                <UserPlus size={18} strokeWidth={3} />
              )}
              {submitting ? "Guardando..." : "Registrar"}
            </button>
          </form>
        </article>

        {/* Lista de Empleados */}
        <article className="xl:col-span-2 bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6">
          <div className="flex items-center justify-between mb-8 pb-4 border-b-4 border-slate-900">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              Equipo Actual
            </h3>
            <span className="text-[10px] uppercase tracking-widest text-slate-900 font-black bg-cyan-400 border-2 border-slate-900 px-2 py-1 shadow-[2px_2px_0_0_#0f172a]">
              {activeCount} ACTIVOS / {staffList.length} TOTAL
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-20 bg-slate-100 border-4 border-slate-900 animate-pulse" />
              <div className="h-20 bg-slate-100 border-4 border-slate-900 animate-pulse" />
            </div>
          ) : staffList.length === 0 ? (
            <div className="border-4 border-dashed border-slate-300 p-12 text-center bg-slate-50">
              <UserRound size={48} className="mx-auto text-slate-300 mb-4" strokeWidth={2} />
              <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
                No hay empleados registrados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {staffList.map((employee) => (
                <div
                  key={employee.id}
                  className="border-4 border-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 bg-cyan-400 border-2 border-slate-900 text-slate-900 flex items-center justify-center font-black text-xl overflow-hidden shadow-[2px_2px_0_0_#0f172a] shrink-0">
                      {employee.avatar_url ? (
                        <img
                          src={employee.avatar_url}
                          alt=""
                          className="w-full h-full object-cover grayscale"
                        />
                      ) : (
                        (employee.name?.[0] || "E").toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <p className="font-black text-slate-900 uppercase tracking-tight text-lg truncate">
                          {employee.name}
                        </p>
                        <span
                          className={`text-[9px] uppercase tracking-widest px-2 py-0.5 font-black border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] ${
                            employee.is_active
                              ? "bg-yellow-400 text-slate-900"
                              : "bg-white text-slate-500"
                          }`}
                        >
                          {employee.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 truncate">
                        <Mail size={14} strokeWidth={3} />
                        {employee.profile?.email || "Sin email vinculado"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-col lg:flex-row items-center gap-2 sm:min-w-[200px] justify-end">
                    {employee.is_active && activeCount <= 1 && (
                      <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 font-black bg-rose-400 border-2 border-slate-900 text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                        Mínimo Req.
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(employee)}
                      disabled={
                        updatingId === employee.id ||
                        (employee.is_active && activeCount <= 1)
                      }
                      className={`inline-flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2 border-2 border-slate-900 transition-all shadow-[2px_2px_0_0_#0f172a] disabled:opacity-50 disabled:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
                        employee.is_active ? "bg-slate-200 text-slate-900" : "bg-cyan-400 text-slate-900"
                      }`}
                    >
                      {updatingId === employee.id ? (
                        <Loader2 size={14} className="animate-spin" strokeWidth={3} />
                      ) : null}
                      {employee.is_active ? "Pausar" : "Activar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEmployee(employee)}
                      disabled={
                        deletingId === employee.id ||
                        staffList.length <= 1 ||
                        (employee.is_active && activeCount <= 1)
                      }
                      className="inline-flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2 border-2 border-slate-900 bg-rose-400 text-slate-900 hover:bg-rose-500 transition-all shadow-[2px_2px_0_0_#0f172a] disabled:opacity-50 disabled:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                    >
                      {deletingId === employee.id ? (
                        <Loader2 size={14} className="animate-spin" strokeWidth={3} />
                      ) : (
                        <Trash2 size={14} strokeWidth={3} />
                      )}
                      Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      {/* Modal de Eliminación */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border-4 border-slate-900 p-8 shadow-[12px_12px_0_0_#0f172a] animate-in zoom-in-95 duration-200">
            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              ¿Despedir empleado?
            </h4>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">
              Estás a punto de eliminar a <span className="text-slate-900 bg-yellow-400 px-1">{staffToDelete.name}</span>. Esta acción no se puede deshacer.
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="px-4 py-3 text-xs font-black uppercase tracking-widest border-2 border-slate-900 bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteEmployee}
                disabled={deletingId === staffToDelete.id}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest border-2 border-slate-900 bg-rose-400 text-slate-900 hover:bg-rose-500 shadow-[4px_4px_0_0_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-70"
              >
                {deletingId === staffToDelete.id ? (
                  <Loader2 size={16} className="animate-spin" strokeWidth={3} />
                ) : (
                  <Trash2 size={16} strokeWidth={3} />
                )}
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
