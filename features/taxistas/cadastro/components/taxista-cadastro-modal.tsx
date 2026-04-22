"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { updateTaxistaCadastroAction } from "@/features/taxistas/cadastro/actions/update-taxista-cadastro";
import type {
  TaxistaCadastroFieldErrors,
  TaxistaCadastroFormValues,
  TaxistaCadastroRecord,
} from "@/features/taxistas/cadastro/types";
import { mapTaxistaCadastroRecordToFormValues } from "@/features/taxistas/cadastro/types";

type TaxistaCadastroModalProps = {
  record: TaxistaCadastroRecord | null;
  canEdit: boolean;
  open: boolean;
  onClose: () => void;
};

type ModalFieldDefinition = {
  key: keyof TaxistaCadastroFormValues;
  label: string;
  span?: string;
};

type ModalSection = {
  title: string;
  fields: ModalFieldDefinition[];
};

export function TaxistaCadastroModal({
  record,
  canEdit,
  open,
  onClose,
}: TaxistaCadastroModalProps) {
  const router = useRouter();
  const [values, setValues] = useState<TaxistaCadastroFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<TaxistaCadastroFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !record) {
      return;
    }

    setValues(mapTaxistaCadastroRecordToFormValues(record));
    setFieldErrors({});
    setFormError(null);
  }, [open, record]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const sections = useMemo<ModalSection[]>(
    () => [
      {
        title: "Dados do taxista",
        fields: [
          { key: "selo", label: "Selo" },
          { key: "name", label: "Nome", span: "sm:col-span-2" },
          { key: "cpf", label: "CPF" },
          { key: "telefone", label: "Telefone" },
          { key: "endereco", label: "Endereco", span: "sm:col-span-2" },
          { key: "ponto", label: "Ponto", span: "sm:col-span-2" },
        ] as const,
      },
      {
        title: "Veiculo",
        fields: [
          { key: "placa", label: "Placa" },
          { key: "modeloVeiculo", label: "Modelo do veiculo", span: "sm:col-span-2" },
        ] as const,
      },
      {
        title: "Taximetro",
        fields: [
          { key: "numeroTaximetro", label: "Nº Taximetro" },
          { key: "modeloTaximetro", label: "Modelo do taximetro" },
          { key: "constante", label: "Constante" },
          { key: "inmetro", label: "Inmetro" },
          { key: "instalacao", label: "Instalacao" },
          { key: "trocaTaximetro", label: "Troca do taximetro" },
        ] as const,
      },
      {
        title: "Equipamentos e controle",
        fields: [
          { key: "pneu", label: "Pneu" },
          { key: "deca", label: "Deca" },
          { key: "lacreModulo", label: "Lacre modulo" },
          { key: "lacreTaxi", label: "Lacre taxi" },
          { key: "modulo", label: "Modulo" },
          { key: "cinta", label: "Cinta" },
          { key: "colocado", label: "Colocado" },
          { key: "retirado", label: "Retirado" },
        ] as const,
      },
    ],
    [],
  );

  if (!open || !record || !values) {
    return null;
  }

  const modalRecord = record;
  const formValues = values;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      setFormError("Seu perfil nao pode editar o cadastro do taxista.");
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const result = await updateTaxistaCadastroAction(
        modalRecord.associateId,
        formValues,
      );

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.formError ?? null);
        return;
      }

      router.refresh();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<Key extends keyof TaxistaCadastroFormValues>(
    key: Key,
    value: TaxistaCadastroFormValues[Key],
  ) {
    setValues((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [key]: value,
      };
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/55 px-4 py-6 backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_26px_80px_rgba(15,23,42,0.26)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#173450_0%,#1E3A5F_55%,#29476B_100%)] px-6 py-5 text-white sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFD38A]">
                Cadastro do taxista
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {modalRecord.name}
              </h2>
              <p className="mt-2 text-sm text-blue-50/76">
                Atualize os dados operacionais do taxista sem sair da base do modulo.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white transition-colors hover:bg-white/14"
              aria-label="Fechar janela de cadastro"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            <div className="space-y-6">
              {sections.map((section) => (
                <section
                  key={section.title}
                  className="rounded-[24px] border border-slate-200 bg-[#FAFCFF] p-5"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#35577E]">
                    {section.title}
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {section.fields.map((field) => (
                      <ModalField
                        key={field.key}
                        className={field.span}
                        label={field.label}
                        error={fieldErrors[field.key]}
                      >
                        <input
                          value={formValues[field.key]}
                          onChange={(event) =>
                            updateField(field.key, event.target.value)
                          }
                          disabled={!canEdit || isSubmitting}
                          className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#93C5FD] focus:ring-2 focus:ring-[#DBEAFE] disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                      </ModalField>
                    ))}
                  </div>
                </section>
              ))}

              {formError ? (
                <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
            <button
              type="button"
              onClick={onClose}
              className="df-button-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canEdit || isSubmitting}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#F39C12] px-5 text-sm font-semibold text-[#163559] shadow-[0_14px_32px_rgba(243,156,18,0.28)] transition-colors hover:bg-[#FFB238] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
            >
              {isSubmitting ? "Salvando..." : "Salvar edicao"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalField({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`.trim()}>
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      {children}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
