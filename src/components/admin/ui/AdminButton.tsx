import * as React from "react";
import { cn } from "@/lib/utils";

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    
    // Base style khas PMM Admin (Solid, Elegan, Rapi)
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-sm font-bold uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
    
    const variants = {
      primary: "bg-[var(--color-navy-900)] text-white hover:bg-[var(--color-navy-800)] border border-[var(--color-navy-950)] shadow-sm focus-visible:ring-[var(--color-navy-900)]/50",
      secondary: "bg-gray-100 text-[var(--color-navy-900)] hover:bg-gray-200 border border-gray-200 shadow-sm focus-visible:ring-gray-300",
      gold: "bg-[var(--color-gold-500)] text-[var(--color-navy-900)] hover:bg-[var(--color-gold-400)] border border-[var(--color-gold-600)] shadow-sm focus-visible:ring-[var(--color-gold-500)]/50",
      danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 shadow-sm focus-visible:ring-red-200",
      success: "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 shadow-sm focus-visible:ring-green-200",
      warning: "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 shadow-sm focus-visible:ring-amber-200",
      outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-[var(--color-navy-900)] hover:border-gray-400 shadow-sm focus-visible:ring-gray-300",
      ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-[var(--color-navy-900)] focus-visible:ring-gray-200",
    };

    const sizes = {
      sm: "h-9 px-4 text-[10px]",
      md: "h-11 px-5 text-xs",
      lg: "h-14 px-8 text-sm",
      icon: "h-11 w-11",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
AdminButton.displayName = "AdminButton";
 
export { AdminButton };
