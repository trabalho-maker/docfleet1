"use client";

import Link from "next/link";
import { AssociateStatusBadge } from "@/src/features/associates/components/associate-status-badge";
import { DeleteAssociateButton } from "@/src/features/associates/components/delete-associate-button";
import type { Associate } from "@/src/features/associates/types";

type AssociatesTableProps = {
  associates: Associate[];
  deletingId?: string | null;
  onDeleteAssociate?: (associate: Associate) => Promise<void> | void;
};

export function AssociatesTable({
  associates,
  deletingId = null,
  onDeleteAssociate,
}: AssociatesTableProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--color-border)]">
          <thead className="bg-slate-50/90">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              <th className="px-5 py-4">Nome</th>
              <th className="px-5 py-4">CPF</th>
              <th className="px-5 py-4">Categoria</th>
              <th className="px-5 py-4">Matrícula</th>
              <th className="px-5 py-4">Situação</th>
              <th className="px-5 py-4">Data de entrada</th>
              <th className="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {associates.map((associate) => (
              <tr key={associate.id} className="align-top transition-colors hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <p className="font-semibold text-[var(--color-foreground)]">
                    {associate.name}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                  {formatCpf(associate.cpf)}
                </td>
                <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                  {associate.category}
                </td>
                <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                  {associate.registrationNumber}
                </td>
                <td className="px-5 py-4">
                  <AssociateStatusBadge status={associate.status} />
                </td>
                <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                  {formatDate(associate.admissionDate)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/associados/${associate.id}/editar`}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Editar
                    </Link>
                    {onDeleteAssociate ? (
                      <DeleteAssociateButton
                        isLoading={deletingId === associate.id}
                        disabled={Boolean(deletingId && deletingId !== associate.id)}
                        onConfirm={() => onDeleteAssociate(associate)}
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11) {
    return cpf;
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC",
      dateStyle: "short",
    }).format(new Date(`${date}T00:00:00Z`));
  } catch {
    return date;
  }
}
