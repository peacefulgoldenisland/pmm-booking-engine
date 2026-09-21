import * as React from "react";
import { cn } from "@/lib/utils";

interface AdminBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "gold" | "brand" | "outline";
}

function AdminBadge({ className, variant = "default", ...props }: AdminBadgeProps) {
  // Styling khas PGI Admin (Solid, Elegan, Pastel untuk Background)
  const variants = {
    default: "bg-gray-100 text-gray-700 border-gray-200 shadow-sm",
    success: "bg-green-50 text-green-700 border-green-200 shadow-sm",
    warning: "bg-orange-50 text-orange-700 border-orange-200 shadow-sm",
    danger: "bg-red-50 text-red-700 border-red-200 shadow-sm",
    info: "bg-blue-50 text-blue-700 border-blue-200 shadow-sm",
    
    // Warna Utama
    gold: "bg-[var(--color-gold-50)] text-[var(--color-gold-700)] border-[var(--color-gold-200)] shadow-sm",
    brand: "bg-[var(--color-navy-900)] text-white border-[var(--color-navy-950)] shadow-sm",
    
    outline: "bg-white text-gray-500 border-gray-300 shadow-sm", 
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
} 

export { AdminBadge };
