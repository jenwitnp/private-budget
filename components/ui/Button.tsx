"use client";

import clsx from "clsx";
import { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary:
      "bg-blue-900 text-white hover:bg-blue-800 shadow-lg shadow-blue-700/30",
    secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={clsx(
        "font-bold rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2",
        variantClasses[variant],
        sizeClasses[size],
        (disabled || isLoading) && "opacity-75 cursor-not-allowed",
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <i className="fa-solid fa-spinner fa-spin"></i>}
      {children}
    </button>
  );
}
