import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SelectOption {
  value: string;
  label: string;
}

interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AdminSelect({
  value,
  onChange,
  options,
  placeholder = "Select option...",
  className,
  disabled = false,
}: AdminSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  React.useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent background scroll when mobile bottom sheet is open
  React.useEffect(() => {
    if (isOpen && isMobile) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen, isMobile]);

  return (
    <div className={cn("relative w-full font-sans", className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-sm border border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all duration-200 shadow-sm",
          "hover:border-gray-300 focus:outline-none focus:ring-2 focus:border-[var(--color-navy-900)] focus:ring-[var(--color-navy-900)]/20",
          disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer",
          !selectedOption ? "text-gray-400 font-normal" : "text-[var(--color-navy-900)]"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200 text-gray-400", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5, transition: { duration: 0.15 } }}
            className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-sm border border-gray-200 bg-white shadow-lg admin-scrollbar"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:bg-gray-50",
                  value === option.value ? "bg-[var(--color-surface-50)] font-bold text-[var(--color-navy-900)]" : "text-gray-700 font-medium"
                )}
              >
                <span className="truncate">{option.label}</span>
                {value === option.value && <Check className="h-4 w-4 shrink-0 text-[var(--color-gold-500)]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && isMobile && (
            <div className="fixed inset-0 z-[10000] flex items-end justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-[var(--color-navy-900)]/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-white rounded-t-3xl shadow-luxury overflow-hidden flex flex-col pb-8 pt-3 max-h-[85vh]"
              >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />
                <div className="px-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                   <h3 className="font-bold text-[var(--color-navy-900)] text-sm uppercase tracking-widest">{placeholder}</h3>
                   <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-50 rounded-full active:bg-gray-200 text-gray-500"><X className="w-4 h-4"/></button>
                </div>
                
                <div className="overflow-y-auto px-4 py-2 admin-scrollbar">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-4 py-4 text-sm text-left transition-colors border-b border-gray-100 last:border-b-0",
                        value === option.value ? "font-bold text-[var(--color-navy-900)]" : "text-gray-700 font-medium"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {value === option.value && <Check className="h-5 w-5 shrink-0 text-[var(--color-gold-500)]" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
