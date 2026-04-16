import type { AssociateOperationRequirementStatus } from "@/features/associates/operations/types";

type AssociateOperationStatusBadgeProps = {
  status: AssociateOperationRequirementStatus;
};

export function AssociateOperationStatusBadge({
  status,
}: AssociateOperationStatusBadgeProps) {
  const tone =
    status === "Valido"
      ? {
          label: "Válido",
          classes: "bg-emerald-100 text-emerald-700",
        }
      : status === "Atencao"
        ? {
            label: "Atenção",
            classes: "bg-amber-100 text-amber-700",
          }
        : status === "Vencido"
          ? {
              label: "Vencido",
              classes: "bg-red-100 text-red-700",
            }
          : {
              label: "Pendente",
              classes: "bg-slate-200 text-slate-700",
            };

  return <span className={`df-badge-pill ${tone.classes}`}>{tone.label}</span>;
}
