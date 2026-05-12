import React from "react";
import { SearchX } from "lucide-react";

/**
 * Reusable Neo-Brutalist empty state component.
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - Custom icon (defaults to SearchX)
 * @param {string} props.title - Main heading
 * @param {string} [props.description] - Subtext
 * @param {React.ReactNode} [props.action] - Optional action button/element
 * @param {string} [props.className] - Extra container classes
 */
export default function EmptyState({ 
  icon, 
  title = "Sin resultados", 
  description = "No se encontró nada que coincida con tu búsqueda.", 
  action,
  className = "" 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-20 h-20 border-4 border-slate-900 bg-yellow-400 shadow-[6px_6px_0_0_#0f172a] flex items-center justify-center mb-6 -rotate-6">
        {icon || <SearchX size={36} strokeWidth={2} className="text-slate-900" />}
      </div>
      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">
        {title}
      </h3>
      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest max-w-sm">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
