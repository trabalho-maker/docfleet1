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
      className={`df-button-primary w-full ${className}`}
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
