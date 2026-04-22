"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type AssociateActionsMenuProps = {
  associateId: string;
  associateName: string;
  documentsHref?: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
};

export function AssociateActionsMenu({
  associateId,
  associateName,
  documentsHref = "/documentos",
  open,
  onToggle,
  onClose,
}: AssociateActionsMenuProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  return (
    <div ref={containerRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Abrir ações de ${associateName}`}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-transparent text-[var(--color-muted)] transition-colors hover:border-[var(--color-border)] hover:bg-[#F8FAFC] hover:text-[var(--color-foreground)]"
      >
        <DotsIcon />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-30 min-w-[188px] overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-white py-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
        >
          <MenuLink
            href={`/associados?search=${encodeURIComponent(associateName)}`}
            label="Ver associado"
            onClick={onClose}
          />
          <MenuLink href={documentsHref} label="Documentos" onClick={onClose} />
          <MenuLink
            href={`/associados/${associateId}/editar`}
            label="Editar"
            onClick={onClose}
          />
          <MenuLink
            href={`/associados/${associateId}/impressao`}
            label="Imprimir"
            onClick={onClose}
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex min-h-10 items-center px-4 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[#F8FAFC] hover:text-[#1D4ED8]"
    >
      {label}
    </Link>
  );
}

function DotsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}
