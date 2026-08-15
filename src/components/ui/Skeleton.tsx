// src/components/ui/Skeleton.tsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular' 
}) => {
  const baseClass = "bg-[var(--color-surface-100)] overflow-hidden relative";
  
  const variantClasses = {
    rectangular: "rounded-xl",
    circular: "rounded-full",
    text: "rounded-md h-4 w-full",
  };

  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ 
        repeat: Infinity, 
        duration: 1.5, 
        ease: "easeInOut" 
      }}
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
    >
      {/* Efek Shimmer Mewah (Garis cahaya lewat) */}
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/2"
      />
    </motion.div>
  );
};