import Link from "next/link";
import type { FleetDocument } from "@/features/data/types";
import { getDocumentTypeLabel } from "@/features/documents/constants";
import { getDaysUntilDocumentDueDate } from "@/features/documents/lib/expiration";

type UpcomingDocumentsTableProps = {
  documents: FleetDocument[];
};

export function UpcomingDocumentsTable({
  documents,
}: UpcomingDocumentsTableProps) {
  return (
    <article className="df-section-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#E2E8F0] px-5 py-5 sm:flex-row sm:items-end sm:justify-between lg:px-6">
        <div>
          <p className="df-eyebrow">Fila documental</p>
          <h2 className="mt-2 text-[1.4rem] font-semibold tracking-tight text-[#163559]">
            Próximos Vencimentos
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Leitura rápida dos documentos com vencimento mais próximo e ação direta para acompanhamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[#35577E]">
            {documents.length} item(ns)
          </span>
          <Link href="/documentos" className="df-button-secondary">
            Ver todos
          </Link>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="px-5 py-12 lg:px-6">
          <div className="rounded-[24px] border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-5 py-10 text-center text-sm leading-6 text-[#64748B]">
            Nenhum vencimento próximo encontrado. A base documental está regular no período analisado.
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-[#F8FAFC] text-xs uppercase tracking-[0.16em] text-[#64748B]">
              <tr>
                {[
                  "Associado",
                  "Documento",
                  "Validade",
                  "Responsável",
                  "Status",
                  "Ação",
                ].map((column) => (
                  <th
                    key={column}
                    className="px-5 py-4 font-semibold lg:px-6"
                    scope="col"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr
                  key={document.id}
                  className="border-t border-[#E2E8F0] bg-white text-sm text-[#1E293B] transition-colors hover:bg-[#FBFDFF]"
                >
                  <td className="px-5 py-4 lg:px-6">
                    <div className="min-w-[15rem]">
                      <p className="font-semibold text-[#0F172A]">
                        {document.associateName ?? "Sem associado vinculado"}
                      </p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {document.associateRegistrationNumber
                          ? `Matrícula ${document.associateRegistrationNumber}`
                          : "Sem matrícula informada"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#475569] lg:px-6">
                    <div>
                      <p className="font-medium text-[#0F172A]">
                        {getDocumentTypeLabel(document.documentType)}
                      </p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {document.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#475569] lg:px-6">
                    <div className="tabular-nums">
                      <p className="font-medium text-[#0F172A]">
                        {formatDate(document.dueDate)}
                      </p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {formatDueContext(document)}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#475569] lg:px-6">
                    {document.owner}
                  </td>
                  <td className="px-5 py-4 lg:px-6">
                    <DocumentStatusPill document={document} />
                  </td>
                  <td className="px-5 py-4 lg:px-6">
                    <Link href="/documentos" className="df-button-secondary">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
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

function formatDueContext(document: FleetDocument) {
  const daysUntilDue = getDaysUntilDocumentDueDate(document.dueDate);

  if (document.status === "Vencido") {
    return `${Math.abs(daysUntilDue ?? 0)} dia(s) de atraso`;
  }

  if (document.status === "Atencao") {
    if (daysUntilDue === 0) {
      return "Vence hoje";
    }

    if (daysUntilDue === 1) {
      return "Vence amanhã";
    }

    return `Vence em ${Math.max(daysUntilDue ?? 0, 0)} dia(s)`;
  }

  return "Sem criticidade imediata";
}

function DocumentStatusPill({ document }: { document: FleetDocument }) {
  const daysUntilDue = getDaysUntilDocumentDueDate(document.dueDate);

  if (document.status === "Vencido") {
    const days = Math.abs(daysUntilDue ?? 0);
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-semibold text-[#DC2626]">
        <AlertTriangleIcon />
        Vencido ({days}d)
      </span>
    );
  }

  if (document.status === "Atencao") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#D97706]">
        <ClockStatusIcon />
        Atenção ({Math.max(daysUntilDue ?? 0, 0)}d)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#16A34A]">
      <CheckCircleIcon />
      Em dia
    </span>
  );
}

function ClockStatusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function AlertTriangleIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CheckCircleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.2 2.2L15.5 9.5" />
    </svg>
  );
}
