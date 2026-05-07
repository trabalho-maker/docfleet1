import type { OperationalAlert } from "@/features/data/types";

export function getAlertHref(alert: OperationalAlert) {
  if (alert.kind === "document_expiration") {
    return "/documentos";
  }

  return "/dashboard#alertas-criticos";
}

export function getAlertKindLabel(alert: OperationalAlert) {
  if (alert.kind === "document_expiration") {
    return "Documental";
  }

  if (alert.kind === "operational") {
    return "Operacional";
  }

  return "Manual";
}

export function getAlertSubtitle(alert: OperationalAlert) {
  if (alert.kind === "document_expiration") {
    return `${alert.team} - acompanhamento documental`;
  }

  return `${alert.team} - acompanhamento operacional`;
}

export function formatDateTime(date: string) {
  const normalized = date.includes("T") ? date : date.replace(" ", "T");

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(normalized));
  } catch {
    return date;
  }
}

export function getAlertIconTone(severity: OperationalAlert["severity"]) {
  if (severity === "Alta") {
    return "bg-[#EF4444]";
  }

  if (severity === "Media") {
    return "bg-[#FACC15] text-[#6B4F00]";
  }

  return "bg-[#3B82F6]";
}
