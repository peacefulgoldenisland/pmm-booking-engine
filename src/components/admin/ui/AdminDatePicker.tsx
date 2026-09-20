"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  filterDate?: (date: Date) => boolean;
}

export function AdminDatePicker({ value, onChange, placeholder = "Select date", className, filterDate }: AdminDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse initial date or use today
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Format to YYYY-MM-DD local time
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${d}`);
    setIsOpen(false);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 120 }, (_, i) => currentYear - 100 + i);

  // Format display value
  let displayValue = "";
  if (value) {
    const d = new Date(value);
    // adjust for timezone offset if needed so that Date(value) parses correctly to the intended YYYY-MM-DD. 
    // Usually "2026-09-19" parsed as Date gives UTC midnight, which might be previous day in local if negative timezone.
    // Let's parse manually to be safe from timezone shifts when displaying.
    const [y, m, dayPart] = value.split('-');
    if (y && m && dayPart) {
      displayValue = `${parseInt(dayPart)} ${monthNames[parseInt(m) - 1]} ${y}`;
    }
  }

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div 
        className={cn(
          "flex w-full items-center justify-between rounded-sm border border-gray-200 bg-white py-3 px-4 text-sm font-medium transition-all duration-200 shadow-sm cursor-pointer",
          isOpen ? "border-[var(--color-navy-900)] ring-2 ring-[var(--color-navy-900)]/20" : "hover:border-gray-300",
          !value ? "text-gray-400 font-normal" : "text-[var(--color-navy-900)]"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{displayValue || placeholder}</span>
        </div>
        {value && (
          <X 
            className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors z-10" 
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 shadow-xl rounded-sm z-50 w-72 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }}
              className="p-1 hover:bg-gray-100 rounded-sm text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              <select 
                value={currentMonth.getMonth()} 
                onChange={(e) => {
                  e.stopPropagation();
                  setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1));
                }}
                className="text-sm font-bold text-[var(--color-navy-900)] bg-transparent focus:outline-none cursor-pointer hover:bg-gray-100 rounded-sm px-1 appearance-none text-center"
                onClick={(e) => e.stopPropagation()}
              >
                {monthNames.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select 
                value={currentMonth.getFullYear()} 
                onChange={(e) => {
                  e.stopPropagation();
                  setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1));
                }}
                className="text-sm font-bold text-[var(--color-navy-900)] bg-transparent focus:outline-none cursor-pointer hover:bg-gray-100 rounded-sm px-1 appearance-none text-center"
                onClick={(e) => e.stopPropagation()}
              >
                {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleNextMonth(); }}
              className="p-1 hover:bg-gray-100 rounded-sm text-gray-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isDisabled = filterDate ? !filterDate(dateObj) : false;
              const isSelected = value && parseInt(value.split('-')[2]) === day && parseInt(value.split('-')[1]) - 1 === currentMonth.getMonth() && parseInt(value.split('-')[0]) === currentMonth.getFullYear();
              const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear();
              
              return (
                <button
                  type="button"
                  key={day}
                  disabled={isDisabled}
                  onClick={(e) => { e.stopPropagation(); if (!isDisabled) handleSelectDate(day); }}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center text-xs rounded-sm transition-all mx-auto",
                    isDisabled 
                      ? "text-gray-300 cursor-not-allowed bg-gray-50/50" 
                      : isSelected 
                        ? "bg-[var(--color-navy-900)] text-white font-bold shadow-md" 
                        : isToday
                          ? "bg-blue-50 text-blue-600 font-bold hover:bg-blue-100"
                          : "text-gray-700 hover:bg-gray-100 font-medium"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
