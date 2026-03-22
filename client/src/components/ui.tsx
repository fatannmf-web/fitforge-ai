import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";

export function Button({ 
  className, variant = "primary", size = "md", isLoading, children, disabled, ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30",
    accent: "bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90 hover:shadow-accent/30",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border-2 border-border bg-transparent hover:border-primary/50 hover:text-primary",
    ghost: "bg-transparent hover:bg-white/5",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    lg: "h-14 px-8 text-lg",
    icon: "h-11 w-11"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}

export function Input({ className, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div className="w-full">
      <input 
        className={cn(
          "w-full h-12 px-4 rounded-xl bg-background border-2 border-border text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
          error && "border-destructive focus:border-destructive focus:ring-destructive/10",
          className
        )} 
        {...props} 
      />
      {error && <p className="mt-1.5 text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("block text-sm font-semibold text-foreground mb-2", className)} {...props}>
      {children}
    </label>
  );
}

export function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "primary" | "accent" }) {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary/10 text-primary border border-primary/20",
    accent: "bg-accent/10 text-accent border border-accent/20"
  };
  
  return (
    <span className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider inline-flex items-center", variants[variant], className)}>
      {children}
    </span>
  );
}

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(
        "relative w-full max-w-lg bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
        className
      )}>
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="text-xl font-bold font-display">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full px-4 py-3 rounded-xl bg-background border-2 border-border text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none",
        className
      )}
      {...props}
    />
  );
}
