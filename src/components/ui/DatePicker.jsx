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
    if (availableDays !== undefined && availableDays !== null) {
      if (!availableDays.includes(d)) return true;
    }
    return false;
  };

  const displayVal = valObj 
    ? `${valObj.getDate()} de ${MONTHS[valObj.getMonth()]} de ${valObj.getFullYear()}` 
    : "Seleccionar fecha";

  return (
    <div className="relative inline-block text-left w-full sm:w-auto" ref={dropdownRef}>
      {/* Trigger Button — Neo-Brutalist */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 w-full sm:w-[260px] border-4 px-4 py-2.5 text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
          isOpen 
            ? "bg-cyan-400 border-slate-900 text-slate-900 shadow-none translate-x-[2px] translate-y-[2px]" 
            : "bg-white border-slate-900 text-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#0f172a]"
        }`}
      >
        <span className="flex items-center gap-2">
          <CalendarIcon size={16} strokeWidth={3} className="shrink-0" />
          <span className="truncate normal-case font-bold text-xs tracking-normal">{displayVal}</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 mt-2 sm:right-0 w-[290px] bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-4 origin-top-right overflow-hidden"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 border-2 border-slate-900 bg-white hover:bg-yellow-400 transition-all shadow-[2px_2px_0_0_#0f172a] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
              >
                <ChevronLeft size={16} strokeWidth={3} />
              </button>
              <h4 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                {MONTHS[curMonth]} {curYear}
                {isMonthLoading && <span className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>}
              </h4>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 border-2 border-slate-900 bg-white hover:bg-yellow-400 transition-all shadow-[2px_2px_0_0_#0f172a] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
              >
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2 border-b-2 border-slate-900 pb-2">
              {DAYS_SHORT.map((day) => (
                <div key={day} className="text-center text-[10px] uppercase font-black tracking-widest text-slate-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="relative min-h-[190px] w-full flex flex-col">
              {isMonthLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 border-4 border-cyan-400 border-t-slate-900 animate-spin mb-3"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-yellow-400 px-3 py-1 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]">
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
                          h-8 md:h-9 w-full flex items-center justify-center text-sm transition-all relative cursor-pointer
                          ${disabled 
                            ? "text-slate-300 opacity-50 cursor-not-allowed line-through" 
                            : selected
                              ? "bg-cyan-400 text-slate-900 font-black border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]"
                              : today
                                ? "font-black text-cyan-600 bg-cyan-50 border-2 border-cyan-400 hover:bg-cyan-100"
                                : "font-bold text-slate-700 hover:bg-yellow-100 border-2 border-transparent hover:border-slate-900"
                          }
                        `}
                      >
                        <span className="relative z-10">{day}</span>
                        {today && !selected && (
                          <span className="absolute bottom-0.5 w-1.5 h-1.5 bg-cyan-500"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-3 pt-3 border-t-2 border-slate-900 flex justify-between gap-2">
               <button
                 type="button"
                 onClick={() => {
                   const today = new Date();
                   setCurrentViewDate(today);
                   onChange(toInputStr(today.getFullYear(), today.getMonth(), today.getDate()));
                   setIsOpen(false);
                 }}
                 className="text-xs font-black uppercase tracking-widest text-slate-900 bg-yellow-400 border-2 border-slate-900 px-3 py-1.5 shadow-[2px_2px_0_0_#0f172a] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
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
