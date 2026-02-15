import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CollapsiblePanel({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
  className = '',
  contentClassName = '',
}) {
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (!contentRef.current) return;
      setContentHeight(contentRef.current.scrollHeight);
    };

    updateHeight();
    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && contentRef.current) {
      observer = new ResizeObserver(() => updateHeight());
      observer.observe(contentRef.current);
    }
    window.addEventListener('resize', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
      if (observer) observer.disconnect();
    };
  }, [children, isOpen]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2.5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
      >
        <div className="text-left">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              {subtitle}
            </p>
          ) : null}
        </div>
        {isOpen ? (
          <ChevronUp size={18} className="text-slate-500" />
        ) : (
          <ChevronDown size={18} className="text-slate-500" />
        )}
      </button>

      <div
        className="overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? `${contentHeight + 24}px` : '0px',
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? '12px' : '0px',
        }}
      >
        <div ref={contentRef} className={contentClassName}>
          {children}
        </div>
      </div>
    </div>
  );
}
