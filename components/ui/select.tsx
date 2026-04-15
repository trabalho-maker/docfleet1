"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  icon?: ReactNode;
  error?: string;
  placeholder?: string;
  options: Array<{
    value: string;
    label: string;
  }>;
};

export function Select({
  label,
  icon,
  error,
  id,
  className = "",
  placeholder,
  options,
  ...props
}: SelectProps) {
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <span
        className={`df-select-shell ${
          error
            ? "border-red-300 focus-within:border-red-400 focus-within:shadow-[0_0_0_3px_rgba(248,113,113,0.14)]"
            : ""
        }`}
      >
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <select
          id={id}
          className={`h-full w-full appearance-none border-none bg-transparent text-sm text-slate-900 outline-none ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon />
      </span>
      {error ? (
        <span id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}
