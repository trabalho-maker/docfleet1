"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  error?: string;
  trailingAction?: ReactNode;
};

export function Input({
  label,
  icon,
  error,
  id,
  className = "",
  trailingAction,
  ...props
}: InputProps) {
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <span
        className={`flex h-12 items-center gap-3 rounded-2xl border bg-white px-4 transition-colors duration-200 ${
          error
            ? "border-red-300 focus-within:border-red-400"
            : "border-slate-200 focus-within:border-slate-900"
        }`}
      >
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <input
          id={id}
          className={`h-full w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {trailingAction}
      </span>
      {error ? (
        <span id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
