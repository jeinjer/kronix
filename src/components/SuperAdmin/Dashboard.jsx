import React from 'react';
import { ShieldCheck } from 'lucide-react';
// Aquí importarás tu SuperAdminTable y AltaClienteForm cuando los crees
import SuperAdminTable from './Table';

export default function SuperAdminDashboard() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <ShieldCheck size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">BACKOFFICE</h1>
            <p className="text-slate-600 dark:text-slate-400">Gestión centralizada de suscripciones SaaS.</p>
        </div>
      </div>
      <div className="p-12 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl text-center text-slate-500">
        Acá va la tabla de suscripciones que diseñamos antes.
      </div>
    </div>
  );
}
