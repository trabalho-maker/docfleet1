import type {
  TaxistaAlvaraStatus,
  TaxistaCadastroRecord,
} from "@/features/taxistas/cadastro/types";

export type TaxistaCadastroFilterMode = "ALL" | "PROTOCOLADO" | "PRONTO";

export function sortTaxistaCadastroRecords(records: TaxistaCadastroRecord[]) {
  return [...records].sort((left, right) =>
    left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" }),
  );
}

export function countTaxistaCadastroRecords(records: TaxistaCadastroRecord[]) {
  return {
    all: records.length,
    protocolado: records.filter((record) => record.statusAlvara === "PROTOCOLADO")
      .length,
    pronto: records.filter((record) => record.statusAlvara === "PRONTO").length,
  };
}

export function filterTaxistaCadastroRecords(
  records: TaxistaCadastroRecord[],
  options: {
    query?: string;
    mode?: TaxistaCadastroFilterMode;
  } = {},
) {
  const normalizedQuery = normalizeSearch(options.query ?? "");
  const mode = options.mode ?? "ALL";

  return records.filter((record) => {
    if (mode !== "ALL" && record.statusAlvara !== (mode as TaxistaAlvaraStatus)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const fields = [
      record.name,
      record.cpf,
      record.selo ?? "",
      record.placa ?? "",
    ];

    return fields.some((field) => normalizeSearch(field).includes(normalizedQuery));
  });
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLowerCase()
    .trim();
}
