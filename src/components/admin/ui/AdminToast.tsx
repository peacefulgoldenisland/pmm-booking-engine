"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, ToastVariant } from '@/store/useToastStore';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const variantConfig: Record<ToastVariant, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
  },
  danger: {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-500" />,
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
  },
};

export function AdminToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = variantConfig[toast.variant];

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-sm border shadow-luxury backdrop-blur-md",
                config.bg,
                config.border
              )}
            >
              <div className="shrink-0 mt-0.5">{config.icon}</div>
              <div className="flex-1">
                <h4 className={cn("text-xs font-bold uppercase tracking-widest", config.text)}>
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className={cn("text-[11px] mt-1 opacity-90", config.text)}>
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className={cn(
                  "shrink-0 p-1 rounded-sm opacity-50 hover:opacity-100 transition-opacity",
                  config.text
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
