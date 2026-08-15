"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// KITA OVERRIDE TYPE CHILDREN-NYA DI SINI
interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  children?: React.ReactNode; // Maksa TypeScript buat nerima ReactNode standar
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyle = "relative flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl font-sans font-semibold tracking-wide transition-all duration-300 overflow-hidden outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-[var(--color-navy-800)] text-white hover:bg-[var(--color-navy-700)] shadow-luxury focus:ring-[var(--color-navy-800)]",
    secondary: "bg-[var(--color-gold-500)] text-white hover:bg-[var(--color-gold-600)] shadow-luxury focus:ring-[var(--color-gold-500)]",
    outline: "bg-transparent border border-[var(--color-navy-800)] text-[var(--color-navy-800)] hover:bg-[var(--color-navy-800)] hover:text-white focus:ring-[var(--color-navy-800)]",
    ghost: "bg-transparent text-[var(--color-navy-800)] hover:bg-gray-100 focus:ring-gray-200",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.98, y: 0 }}
      className={`${baseStyle} ${variants[variant]} ${className} ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      
      <span className={isLoading ? 'opacity-90' : ''}>
        {children}
      </span>
    </motion.button>
  );
};