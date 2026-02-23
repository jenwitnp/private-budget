"use client";

import { InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  icon,
  error,
  helperText,
  className,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <i className={`fa-solid ${icon}`}></i>
          </span>
        )}
        <input
          className={clsx(
            "block w-full rounded-xl border transition-all",
            icon ? "pl-10 pr-3" : "px-3",
            "py-2.5 border-slate-200",
            "focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
            error && "border-red-500 focus:ring-red-500 focus:border-red-500",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  options,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <select
        className={clsx(
          "block w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200",
          "focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
          "transition-all",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  rows?: number;
}

export function Textarea({
  label,
  error,
  rows = 4,
  className,
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={clsx(
          "block w-full px-3 py-2.5 rounded-xl border border-slate-200",
          "focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
          "transition-all",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
