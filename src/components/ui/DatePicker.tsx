// src/components/ui/DatePicker.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay 
} from 'date-fns';

interface DatePickerProps {
  label: string;
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  error?: string;
  filterDate?: (date: Date) => boolean; // Prop baru untuk memfilter hari
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, selectedDate, onSelect, error, filterDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const today = startOfDay(new Date());
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => {
    const previous = subMonths(currentMonth, 1);
    if (!isBefore(endOfMonth(previous), startOfMonth(today))) {
      setCurrentMonth(previous);
    }
  };

  const handleSelect = (date: Date) => {
    const isPast = isBefore(date, today);
    const isFiltered = filterDate ? !filterDate(date) : false;
    
    if (!isPast && !isFiltered) {
      onSelect(date);
      setIsOpen(false);
    }
  };

  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="flex flex-col w-full relative" ref={dropdownRef}>
      <label className="text-sm font-medium mb-1.5 text-gray-500">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3.5 bg-[var(--color-surface-50)] text-left rounded-xl border transition-all duration-300 outline-none
          ${error ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 hover:border-[var(--color-gold-400)] focus:border-[var(--color-gold-500)] focus:ring-4 focus:ring-[var(--color-gold-500)]/15'} 
        `}
      >
        <span className={`text-base ${selectedDate ? 'text-[var(--color-navy-900)]' : 'text-gray-400'}`}>
          {selectedDate ? format(selectedDate, 'dd MMMM yyyy') : 'Select departure date'}
        </span>
        <CalendarIcon className={`w-5 h-5 ${isOpen ? 'text-[var(--color-gold-500)]' : 'text-gray-400'}`} />
      </button>

      <AnimatePresence>
        {error && (
          <motion.span 
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            className="text-xs font-medium text-red-500 mt-1.5 overflow-hidden block"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-full mt-2 left-0 w-full md:w-[320px] bg-white rounded-2xl shadow-luxury border border-gray-100 p-4 z-50 origin-top"
          >
            <div className="flex justify-between items-center mb-4">
              <button onClick={prevMonth} type="button" className="p-1.5 rounded-full hover:bg-gray-100 text-[var(--color-navy-800)] transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h4 className="font-serif font-bold text-lg text-[var(--color-navy-800)]">
                {format(currentMonth, 'MMMM yyyy')}
              </h4>
              <button onClick={nextMonth} type="button" className="p-1.5 rounded-full hover:bg-gray-100 text-[var(--color-navy-800)] transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {DAYS.map(day => (
                <span key={day} className="text-xs font-bold text-gray-400">
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}
              
              {daysInMonth.map(date => {
                const isPast = isBefore(date, today);
                // Validasi filter date (hari sabtu)
                const isFiltered = filterDate ? !filterDate(date) : false;
                const isDisabled = isPast || isFiltered;
                
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const isCurrentToday = isToday(date);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleSelect(date)}
                    disabled={isDisabled}
                    type="button"
                    className={`
                      relative flex items-center justify-center p-2 text-sm rounded-lg transition-all
                      ${isDisabled ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer text-[var(--color-navy-800)]'}
                      ${isSelected ? '!bg-[var(--color-navy-800)] !text-white font-bold shadow-md shadow-[var(--color-navy-800)]/30' : ''}
                      ${isCurrentToday && !isSelected && !isDisabled ? 'text-[var(--color-gold-600)] font-bold border border-[var(--color-gold-400)]/30' : ''}
                    `}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};