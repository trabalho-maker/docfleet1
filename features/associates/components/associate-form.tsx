"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  associateCategories,
  associateStatuses,
} from "@/features/associates/constants";
import { validateCreateAssociateInput } from "@/features/associates/lib/associate.validators";
import type {
  AssociateCategory,
  AssociateFieldErrors,
  AssociateFormValues,
  AssociateStatus,
} from "@/features/associates/types";

type AssociateFormProps = {
  initialValues?: Partial<AssociateFormValues>;
  mode?: "create" | "edit";
  submitLabel?: string;
  isSubmitting?: boolean;
  serverErrors?: AssociateFieldErrors;
  message?: {
    type: "success" | "error";
    text: string;
  } | null;
  onSubmit: (values: AssociateFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

const defaultValues: AssociateFormValues = {
  name: "",
  cpf: "",
  category: "Titular",
  registrationNumber: "",
  status: "Ativo",
  admissionDate: "",
};

export function AssociateForm({
  initialValues,
  mode = "create",
  submitLabel,
  isSubmitting = false,
  serverErrors,
  message,
  onSubmit,
  onCancel,
}: AssociateFormProps) {
  const [values, setValues] = useState<AssociateFormValues>(() =>
    mergeInitialValues(initialValues),
  );
  const [errors, setErrors] = useState<AssociateFieldErrors>({});

  useEffect(() => {
    setValues(mergeInitialValues(initialValues));
  }, [initialValues]);

  useEffect(() => {
    setErrors(serverErrors ?? {});
  }, [serverErrors]);

  function updateField<K extends keyof AssociateFormValues>(
    field: K,
    value: AssociateFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateCreateAssociateInput({
      ...values,
      cpf: unmaskCpf(values.cpf),
    });

    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    await onSubmit(validation.data);
  }

  const resolvedSubmitLabel =
    submitLabel ?? (mode === "edit" ? "Salvar alterações" : "Criar associado");

  return (
    <article className="df-section-card p-6 lg:p-7">
      <div className="space-y-2">
        <p className="df-eyebrow">
          {mode === "edit" ? "Editar associado" : "Novo associado"}
        </p>
        <h2 className="text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
          {mode === "edit"
            ? "Atualize os dados do associado selecionado"
            : "Cadastre um novo associado"}
        </h2>
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          Preencha os dados principais para manter a base de associados organizada e
          pronta para operação.
        </p>
      </div>

      {message ? (
        <div
          role="alert"
          className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <form
        className="mt-6 grid gap-5"
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        <Input
          id="associate-name"
          label="Nome"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Ex.: Maria de Souza"
          error={errors.name}
          autoComplete="name"
          required
        />

        <Input
          id="associate-cpf"
          label="CPF"
          value={values.cpf}
          onChange={(event) => updateField("cpf", formatCpfInput(event.target.value))}
          placeholder="000.000.000-00"
          error={errors.cpf}
          inputMode="numeric"
          autoComplete="off"
          required
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Select
            id="associate-category"
            label="Categoria"
            value={values.category}
            error={errors.category}
            options={associateCategories.map((category) => ({
              value: category,
              label: category,
            }))}
            onChange={(event) =>
              updateField("category", event.target.value as AssociateCategory)
            }
          />

          <Select
            id="associate-status"
            label="Situação"
            value={values.status}
            error={errors.status}
            options={associateStatuses.map((status) => ({
              value: status,
              label: status,
            }))}
            onChange={(event) =>
              updateField("status", event.target.value as AssociateStatus)
            }
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            id="associate-registration-number"
            label="Matrícula"
            value={values.registrationNumber}
            onChange={(event) => updateField("registrationNumber", event.target.value)}
            placeholder="Ex.: MAT-2026-0042"
            error={errors.registrationNumber}
            autoComplete="off"
            required
          />

          <Input
            id="associate-admission-date"
            label="Data de entrada"
            type="date"
            value={values.admissionDate}
            onChange={(event) => updateField("admissionDate", event.target.value)}
            error={errors.admissionDate}
            required
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingLabel={mode === "edit" ? "Salvando..." : "Criando..."}
            className="sm:flex-1"
          >
            {resolvedSubmitLabel}
          </Button>

          {onCancel ? (
            <button type="button" onClick={onCancel} className="df-button-secondary">
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </article>
  );
}

function mergeInitialValues(
  initialValues?: Partial<AssociateFormValues>,
): AssociateFormValues {
  return {
    ...defaultValues,
    ...initialValues,
    cpf: initialValues?.cpf ? formatCpfInput(initialValues.cpf) : defaultValues.cpf,
  };
}

function unmaskCpf(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpfInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return digits.replace(/(\d{3})(\d+)/, "$1.$2");
  }

  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
}
