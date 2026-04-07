"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

export function Button({
  isLoading = false,
  loadingLabel,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#f97316] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdba74] focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#fb923c] disabled:opacity-70 ${className}`}
    >
      {isLoading ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
          />
          <span>{loadingLabel ?? "Carregando..."}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
