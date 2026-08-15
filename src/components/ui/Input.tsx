"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="flex flex-col w-full relative">
        <label className={`text-sm font-medium mb-1.5 transition-colors duration-300 ${
          error ? 'text-red-500' : isFocused ? 'text-[var(--color-navy-800)]' : 'text-gray-500'
        }`}>
          {label}
        </label>
        
        <div className="relative flex items-center">
          {icon && (
            <div className={`absolute left-4 transition-colors duration-300 ${
              error ? 'text-red-500' : isFocused ? 'text-[var(--color-gold-500)]' : 'text-gray-400'
            }`}>
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`w-full bg-[var(--color-surface-50)] text-[var(--color-navy-900)] rounded-xl border transition-all duration-300 outline-none placeholder:text-gray-400
              ${icon ? 'py-3.5 pl-11 pr-4' : 'p-3.5'}
              ${error 
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                : 'border-gray-200 hover:border-[var(--color-gold-400)] focus:border-[var(--color-gold-500)] focus:ring-4 focus:ring-[var(--color-gold-500)]/15'
              } 
              ${className}
            `}
            {...props}
          />
        </div>

        {/* Animasi Error Message Ala Enterprise */}
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
      </div>
    );
  }
);

Input.displayName = 'Input';