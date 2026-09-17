import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";
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

  const selectedOption = options.find((opt) => opt.value === value);

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
        {isOpen && (
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
    </div>
  );
}
