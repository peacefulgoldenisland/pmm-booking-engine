import * as React from "react";
import { cn } from "@/lib/utils";

export interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const AdminInput = React.forwardRef<HTMLInputElement, AdminInputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center font-sans">
        {/* Render Left Icon if exists */}
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center justify-center text-gray-400 pointer-events-none z-10">
            {leftIcon}
          </div>
        )}

        <input
          type={type}
          className={cn(
            // Solid Clean Styling (PGI Admin Theme)
            "flex w-full rounded-sm border border-gray-200 bg-white py-3 text-sm font-medium text-[var(--color-navy-900)] transition-all duration-200 shadow-sm",
            "placeholder:text-gray-400 placeholder:font-normal",
            
            // Hover & Focus States
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:border-[var(--color-navy-900)] focus-visible:bg-white hover:border-gray-300",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            
            // Padding adjustments based on icons
            leftIcon ? "pl-11" : "pl-4",
            rightIcon ? "pr-11" : "pr-4",
            
            // Error states
            error 
              ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20 bg-red-50/50" 
              : "focus-visible:ring-[var(--color-navy-900)]/20",
            className
          )}
          ref={ref}
          {...props}
        />

        {/* Render Right Icon if exists */}
        {rightIcon && (
          <div className="absolute right-3.5 flex items-center justify-center text-gray-400 z-10">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
AdminInput.displayName = "AdminInput";

export { AdminInput };
