"use client";

import Link from "next/link";
import { AssociateStatusBadge } from "@/features/associates/components/associate-status-badge";
import { DeleteAssociateButton } from "@/features/associates/components/delete-associate-button";
import type { Associate } from "@/features/associates/types";

type AssociatesTableProps = {
  associates: Associate[];
  canEdit: boolean;
  canDelete: boolean;
  deniedReason?: string | null;
  deletingId?: string | null;
  onDeleteAssociate?: (associate: Associate) => Promise<void> | void;
};

export function AssociatesTable({
  associates,
  canEdit,
  canDelete,
  deniedReason = null,
  deletingId = null,
  onDeleteAssociate,
}: AssociatesTableProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E5E7EB]">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#64748B]">
              <th className="px-5 py-4">Nome</th>
              <th className="px-5 py-4">CPF</th>
              <th className="px-5 py-4">Categoria</th>
              <th className="px-5 py-4">Matrícula</th>
              <th className="px-5 py-4">Situação</th>
              <th className="px-5 py-4">Data de entrada</th>
              <th className="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {associates.map((associate) => (
              <tr key={associate.id} className="align-top transition-colors hover:bg-[#FCFDFE]">
                <td className="px-5 py-4">
                  <p className="font-semibold text-[#0F172A]">{associate.name}</p>
                </td>
                <td className="px-5 py-4 text-sm text-[#64748B]">
                  {formatCpf(associate.cpf)}
                </td>
                <td className="px-5 py-4 text-sm text-[#64748B]">
                  {associate.category}
                </td>
                <td className="px-5 py-4 text-sm text-[#64748B]">
                  {associate.registrationNumber}
                </td>
                <td className="px-5 py-4">
                  <AssociateStatusBadge status={associate.status} />
                </td>
                <td className="px-5 py-4 text-sm text-[#64748B]">
                  {formatDate(associate.admissionDate)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-3">
                    <ActionLink
                      href={`/associados/${associate.id}/editar`}
                      disabled={!canEdit}
                      deniedReason={deniedReason}
                    >
                      Editar
                    </ActionLink>

                    {onDeleteAssociate ? (
                      <DeleteAssociateButton
                        isLoading={deletingId === associate.id}
                        disabled={!canDelete || Boolean(deletingId && deletingId !== associate.id)}
                        deniedReason={!canDelete ? deniedReason : null}
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

function ActionLink({
  href,
  disabled,
  deniedReason,
  children,
}: {
  href: string;
  disabled: boolean;
  deniedReason?: string | null;
  children: string;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        title={deniedReason ?? undefined}
        className="inline-flex h-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-slate-100 px-4 text-sm font-semibold text-slate-400"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#FFF7ED]"
    >
      {children}
    </Link>
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
