import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const DAYS_SHORT = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const toInputStr = (year, month, day) => {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
};

export default function DatePicker({ value, onChange, minDate, availableDays, onMonthChange, isMonthLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const initDate = value ? new Date(value + "T12:00:00") : new Date();
  const [currentViewDate, setCurrentViewDate] = useState(initDate);

  const curYear = currentViewDate.getFullYear();
  const curMonth = currentViewDate.getMonth();

  const minDateObj = minDate ? new Date(minDate + "T00:00:00") : null;

  useEffect(() => {
    if (value) {
      setCurrentViewDate(new Date(value + "T12:00:00"));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    const newDate = new Date(curYear, curMonth - 1, 1);
    setCurrentViewDate(newDate);
    if (onMonthChange) onMonthChange(newDate.getFullYear(), newDate.getMonth());
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    const newDate = new Date(curYear, curMonth + 1, 1);
    setCurrentViewDate(newDate);
    if (onMonthChange) onMonthChange(newDate.getFullYear(), newDate.getMonth());
  };

  useEffect(() => {
    if (isOpen && onMonthChange) {
      onMonthChange(curYear, curMonth);
    }
  }, [isOpen, curYear, curMonth]);

  const handleSelectDay = (day) => {
    const selected = toInputStr(curYear, curMonth, day);
    onChange(selected);
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(curYear, curMonth);
  const firstDay = getFirstDayOfMonth(curYear, curMonth);

  const daysArray = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);
  for (let d = 1; d <= daysInMonth; d++) daysArray.push(d);

  // Current selected checks
  const valObj = value ? new Date(value + "T12:00:00") : null;
  const isSelected = (d) => valObj && valObj.getDate() === d && valObj.getMonth() === curMonth && valObj.getFullYear() === curYear;

  const isToday = (d) => {
    const today = new Date();
    return today.getDate() === d && today.getMonth() === curMonth && today.getFullYear() === curYear;
  };

  const isPastDisabled = (d) => {
    if (!minDateObj) return false;
    const testDate = new Date(curYear, curMonth, d, 0, 0, 0);
    return testDate < minDateObj;
  };

  const isDayUnavailable = (d) => {
    // If availableDays is provided, strictly enforce it. If null, ignore.
    if (availableDays !== undefined && availableDays !== null) {
      if (!availableDays.includes(d)) return true;
    }
    return false;
  };

  // Format value for trigger button
  const displayVal = valObj 
    ? `${valObj.getDate()} de ${MONTHS[valObj.getMonth()]} de ${valObj.getFullYear()}` 
    : "Seleccionar fecha";

  return (
    <div className="relative inline-block text-left w-full sm:w-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 w-full sm:w-[240px] border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-xl px-4 py-2.5 text-sm font-bold tracking-tight transition-all shadow-sm ${
          isOpen 
            ? "bg-white border-cyan-500 text-cyan-700" 
            : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-slate-800"
        }`}
      >
        <span className="flex items-center gap-2">
          <CalendarIcon size={16} className={`shrink-0 ${isOpen ? "text-cyan-600" : "text-slate-500"}`} />
          <span className="truncate">{displayVal}</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${isOpen ? "rotate-180 text-cyan-600" : "text-slate-400"}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 sm:right-0 w-[280px] bg-white border border-slate-200 rounded-2xl shadow-xl p-4 origin-top-right overflow-hidden"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <h4 className="text-sm font-black text-slate-800 tracking-tight capitalize flex items-center gap-2">
                {MONTHS[curMonth]} {curYear}
                {isMonthLoading && <span className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>}
              </h4>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_SHORT.map((day) => (
                <div key={day} className="text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid & Loading State */}
            <div className="relative min-h-[190px] w-full flex flex-col">
              {isMonthLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10">
                  <div className="w-6 h-6 border-[3px] border-cyan-500 border-t-transparent rounded-full animate-spin mb-3 shadow-sm"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100 shadow-sm">
                    Analizando Agenda
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1 flex-1">
                  {daysArray.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="h-8 md:h-9" />;

                    const selected = isSelected(day);
                    const disabled = isPastDisabled(day) || isDayUnavailable(day);
                    const today = isToday(day);

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSelectDay(day)}
                        className={`
                          h-8 md:h-9 w-full flex items-center justify-center rounded-lg text-sm transition-all relative
                          ${disabled 
                            ? "text-slate-300 opacity-60 cursor-not-allowed line-through" 
                            : selected
                              ? "bg-cyan-600 text-white font-black shadow-sm"
                              : hoverStyles(today)
                          }
                        `}
                      >
                        <span className="relative z-10">{day}</span>
                        {today && !selected && (
                          <span className="absolute bottom-1 w-1 h-1 bg-cyan-500 rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between gap-2">
               <button
                 type="button"
                 onClick={() => {
                   const today = new Date();
                   setCurrentViewDate(today);
                   onChange(toInputStr(today.getFullYear(), today.getMonth(), today.getDate()));
                   setIsOpen(false);
                 }}
                 className="text-xs font-bold text-cyan-600 hover:text-cyan-800 px-2 py-1 transition-colors"
               >
                 Ir a Hoy
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function hoverStyles(isToday) {
  if (isToday) return "font-bold text-cyan-600 bg-cyan-50 hover:bg-cyan-100";
  return "font-medium text-slate-700 hover:bg-slate-100";
}
