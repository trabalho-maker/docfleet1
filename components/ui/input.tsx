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
        className={`df-input-shell ${
          error
            ? "border-red-300 focus-within:border-red-400 focus-within:shadow-[0_0_0_3px_rgba(248,113,113,0.14)]"
            : ""
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
