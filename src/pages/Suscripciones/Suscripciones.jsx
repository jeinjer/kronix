import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ShieldCheck, Building2 } from 'lucide-react';

const PLANES = [
  {
    id: 'trial',
    nombre: 'Trial',
    precio: '$0',
    periodo: '/ 7 dias',
    descripcion: 'Para empezar sin riesgo y validar el flujo de tu negocio.',
    cta: 'Empezar prueba',
    destacado: false,
    icono: Sparkles,
    color:
      'border-amber-300/70 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/5',
    funcionalidades: [
      '1 sucursal',
      'Agenda inteligente',
      'Recordatorios basicos',
      'Panel de turnos y clientes',
      'Soporte por email',
    ],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: '$29',
    periodo: '/ mes',
    descripcion: 'Plan recomendado para operar todos los dias con estabilidad.',
    cta: 'Elegir Pro',
    destacado: true,
    icono: ShieldCheck,
    color:
      'border-cyan-300/70 bg-cyan-50/80 dark:border-cyan-500/30 dark:bg-cyan-500/5',
    funcionalidades: [
      'Todo lo de Trial',
      '1 sucursal (maximo)',
      'Integracion con WhatsApp',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio: '$99',
    periodo: '/ mes',
    descripcion: 'Para equipos con varias sucursales y necesidades complejas.',
    cta: 'Elegir Enterprise',
    destacado: false,
    icono: Building2,
    color:
      'border-indigo-300/70 bg-indigo-50/80 dark:border-indigo-500/30 dark:bg-indigo-500/5',
    funcionalidades: [
      'Todo lo de Pro',
      'Multiples sucursales',
      'Permisos por equipos',
      'Soporte dedicado',
      'Asistencia de implementacion',
    ],
  },
];

const COMPARATIVA = [
  {
    nombre: 'Sucursales',
    trial: '1',
    pro: '1',
    enterprise: 'Ilimitadas',
  },
  {
    nombre: 'Agenda y turnos',
    trial: true,
    pro: true,
    enterprise: true,
  },
  {
    nombre: 'Bot de WhatsApp',
    trial: false,
    pro: true,
    enterprise: true,
  },
  {
    nombre: 'Reportes avanzados',
    trial: false,
    pro: true,
    enterprise: true,
  },
  {
    nombre: 'Soporte dedicado',
    trial: false,
    pro: false,
    enterprise: true,
  },
];

const valorCelda = (valor) => {
  if (valor === true) return 'Incluido';
  if (valor === false) return 'No incluido';
  return String(valor);
};

export default function SubscriptionPlansPage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <section className="relative overflow-hidden px-6 pt-36 pb-24">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_55%)]" />
        <div className="relative max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 dark:border-white/10 bg-white/80 dark:bg-white/5 text-xs font-black uppercase tracking-widest">
            Planes Kronix
          </span>
          <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white">
            Suscripciones Simples
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Elegi el plan que mejor se adapta a tu etapa. Podes empezar por Trial y luego pasar a Pro o Enterprise.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/registro"
              className="px-7 py-3 rounded-full bg-white text-slate-950 font-black hover:scale-[1.03] transition-transform"
            >
              Crear Cuenta
            </Link>
            <Link
              to="/"
              className="px-7 py-3 rounded-full border border-slate-400 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANES.map((plan) => {
            const Icono = plan.icono;
            return (
              <article
                key={plan.id}
                className={`rounded-3xl border p-7 transition-all ${
                  plan.destacado
                    ? `${plan.color} lg:-translate-y-2 shadow-[0_20px_60px_-30px_rgba(34,211,238,0.45)]`
                    : `${plan.color} hover:-translate-y-1`
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                    <Icono size={20} />
                  </div>
                  {plan.destacado && (
                    <span className="text-[10px] px-3 py-1 rounded-full bg-cyan-500 text-white font-black uppercase tracking-widest">
                      Recomendado
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-black mb-1">{plan.nombre}</h2>
                <div className="mb-4">
                  <span className="text-4xl font-black">{plan.precio}</span>
                  <span className="ml-1 text-sm font-bold text-slate-600 dark:text-slate-300">{plan.periodo}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-6 min-h-10">{plan.descripcion}</p>
                <ul className="space-y-3 mb-8">
                  {plan.funcionalidades.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/registro"
                  className="w-full inline-flex items-center justify-center rounded-2xl px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-sm hover:opacity-90 transition-opacity"
                >
                  {plan.cta}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur p-6 md:p-8">
          <h3 className="text-2xl md:text-3xl font-black mb-6">Comparativa Rapida</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <th className="py-3 pr-3 text-xs uppercase tracking-widest text-slate-500">Caracteristica</th>
                  <th className="py-3 px-3 text-xs uppercase tracking-widest text-slate-500">Trial</th>
                  <th className="py-3 px-3 text-xs uppercase tracking-widest text-slate-500">Pro</th>
                  <th className="py-3 pl-3 text-xs uppercase tracking-widest text-slate-500">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIVA.map((item) => (
                  <tr key={item.nombre} className="border-b border-slate-200/70 dark:border-white/5">
                    <td className="py-4 pr-3 text-sm font-semibold">{item.nombre}</td>
                    <td className="py-4 px-3 text-sm">{valorCelda(item.trial)}</td>
                    <td className="py-4 px-3 text-sm">{valorCelda(item.pro)}</td>
                    <td className="py-4 pl-3 text-sm">{valorCelda(item.enterprise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
