import * as React from "react";
import { cn } from "@/lib/utils";

const AdminCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "rounded-sm bg-white flex flex-col font-sans", 
      "border border-gray-200",
      "shadow-sm",
      className
    )} 
    {...props} 
  />
));
AdminCard.displayName = "AdminCard";

const AdminCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-2 p-6 pb-4 border-b border-gray-100", className)} {...props} />
));
AdminCardHeader.displayName = "AdminCardHeader";

const AdminCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-xl font-serif text-[var(--color-navy-900)] leading-none tracking-tight", className)} {...props} />
));
AdminCardTitle.displayName = "AdminCardTitle";

const AdminCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-xs text-gray-500 font-light leading-relaxed", className)} {...props} />
));
AdminCardDescription.displayName = "AdminCardDescription";

const AdminCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 flex-1", className)} {...props} />
));
AdminCardContent.displayName = "AdminCardContent";

const AdminCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0 mt-auto border-t border-gray-100", className)} {...props} />
));
AdminCardFooter.displayName = "AdminCardFooter";

export { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardDescription, AdminCardContent, AdminCardFooter };
