"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  // Menambahkan 3xl, 4xl, 5xl agar lebih fleksibel untuk layout yang lebar
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth = 'lg'
}) => {
  
  // Mencegah scroll pada body saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop Gelap dengan Blur Ekstra (Luxury Vibe) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--color-navy-900)]/80 backdrop-blur-md"
          />

          {/* Kotak Modal (Editorial Strict Design) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300 
            }}
            className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[var(--color-surface-50)] rounded-sm shadow-luxury overflow-hidden flex flex-col max-h-[90vh] border border-gray-200/50`}
          >
            {/* Header Modal */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-gray-200 bg-white z-10">
              <h3 className="text-2xl font-serif text-[var(--color-navy-900)]">{title}</h3>
              <button 
                onClick={onClose}
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 group outline-none focus:ring-2 focus:ring-red-100"
              >
                <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            {/* Body Modal (Scrollable if content is long) */}
            <div className="p-8 overflow-y-auto no-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};