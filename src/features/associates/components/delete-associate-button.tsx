"use client";

import { useState } from "react";

type DeleteAssociateButtonProps = {
  disabled?: boolean;
  isLoading?: boolean;
  onConfirm: () => Promise<void> | void;
};

export function DeleteAssociateButton({
  disabled = false,
  isLoading = false,
  onConfirm,
}: DeleteAssociateButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    await onConfirm();
    setIsConfirming(false);
  }

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={disabled || isLoading}
          className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Excluindo..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      onClick={() => setIsConfirming(true)}
      className="inline-flex h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
    >
      Excluir
    </button>
  );
}
