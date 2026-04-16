"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  associateCivilStates,
  associateProfileCategories,
  associateSexOptions,
  associateStatuses,
  brazilianStates,
} from "@/features/associates/constants";
import { validateCreateAssociateInput } from "@/features/associates/lib/associate.validators";
import type {
  AssociateFieldErrors,
  AssociateFormValues,
  AssociateProfileCategory,
  AssociateSex,
  AssociateStatus,
} from "@/features/associates/types";

type AssociateFormSubmitIntent = "save" | "saveAndPrint";

type DependentDraft = {
  firstName: string;
  firstRelationship: string;
  secondName: string;
  secondRelationship: string;
};

type AssociateFormProps = {
  initialValues?: Partial<AssociateFormValues>;
  mode?: "create" | "edit";
  submitLabel?: string;
  saveAndPrintLabel?: string;
  isSubmitting?: boolean;
  serverErrors?: AssociateFieldErrors;
  message?: {
    type: "success" | "error";
    text: string;
  } | null;
  onSubmit: (
    values: AssociateFormValues,
    intent: AssociateFormSubmitIntent,
  ) => Promise<void> | void;
  onCancel?: () => void;
};

const defaultValues: AssociateFormValues = {
  name: "",
  cpf: "",
  category: "Titular",
  registrationNumber: "",
  status: "Ativo",
  admissionDate: "",
  modalidadeAssociado: "",
  cnpjEmpresa: "",
  nomeEmpresa: "",
  enderecoCompleto: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  profissao: "",
  sexo: "",
  dataNascimento: "",
  nacionalidade: "",
  naturalidade: "",
  rg: "",
  cnh: "",
  estadoCivil: "",
  nomePai: "",
  nomeMae: "",
  dependentes: "",
  grauParentesco: "",
  telefone: "",
  celular: "",
  email: "",
  observacoes: "",
  situacaoFinanceira: "",
  situacaoDocumental: "",
  historicoResumo: "",
  fotoUrl: "",
};

export function AssociateForm({
  initialValues,
  mode = "create",
  submitLabel,
  saveAndPrintLabel,
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
  const [dependentDraft, setDependentDraft] = useState<DependentDraft>(() =>
    extractDependentDraft(initialValues),
  );
  const submitIntentRef = useRef<AssociateFormSubmitIntent>("save");

  useEffect(() => {
    setValues(mergeInitialValues(initialValues));
    setDependentDraft(extractDependentDraft(initialValues));
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

  function updateDependentDraft<K extends keyof DependentDraft>(
    field: K,
    value: DependentDraft[K],
  ) {
    setDependentDraft((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      dependentes: undefined,
      grauParentesco: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const valuesForSubmit: AssociateFormValues = {
      ...values,
      category: values.category || "Titular",
      cnpjEmpresa: values.cnpjEmpresa ? unmaskDigits(values.cnpjEmpresa) : "",
      dependentes: joinDependentValues(
        dependentDraft.firstName,
        dependentDraft.secondName,
      ),
      grauParentesco: joinDependentValues(
        dependentDraft.firstRelationship,
        dependentDraft.secondRelationship,
      ),
    };

    const validation = validateCreateAssociateInput({
      ...valuesForSubmit,
      cpf: unmaskCpf(valuesForSubmit.cpf),
      cep: valuesForSubmit.cep ? unmaskDigits(valuesForSubmit.cep) : valuesForSubmit.cep,
    });

    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    await onSubmit(valuesForSubmit, submitIntentRef.current);
  }

  const resolvedSubmitLabel =
    submitLabel ?? (mode === "edit" ? "Salvar alteracoes" : "Criar associado");
  const resolvedSaveAndPrintLabel =
    saveAndPrintLabel ??
    (mode === "edit" ? "Salvar e imprimir" : "Criar e imprimir");
  const isCompanyProfile = values.modalidadeAssociado === "CNPJ";

  return (
    <article className="df-section-card p-6 lg:p-7">
      <div className="space-y-2">
        <p className="df-eyebrow">{mode === "edit" ? "Editar associado" : "Novo associado"}</p>
        <h2 className="text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
          {mode === "edit"
            ? "Atualize o cadastro conforme a ficha institucional"
            : "Cadastre um novo associado conforme a ficha institucional"}
        </h2>
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          A ficha interna do sistema continua titular por padrao, enquanto a categoria exibida abaixo define o tipo de associado na ficha impressa.
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
        className="mt-6 grid gap-6"
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        <FormSection
          title="Identificacao"
          description="Campos principais para localizar, classificar e emitir a ficha do associado."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              id="associate-name"
              label="Nome"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Ex.: Rafael Guedes de Almeida"
              error={errors.name}
              autoComplete="name"
              required
            />

            <Input
              id="associate-registration-number"
              label="Matricula"
              value={values.registrationNumber}
              onChange={(event) =>
                updateField("registrationNumber", event.target.value)
              }
              placeholder="Ex.: MAT-2026-0042"
              error={errors.registrationNumber}
              autoComplete="off"
              required
            />
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <Select
              id="associate-profile-category"
              label="Categoria"
              value={values.modalidadeAssociado ?? ""}
              error={errors.modalidadeAssociado}
              placeholder="Selecione"
              options={associateProfileCategories.map((category) => ({
                value: category,
                label: category,
              }))}
              onChange={(event) =>
                updateField(
                  "modalidadeAssociado",
                  event.target.value as AssociateProfileCategory | "",
                )
              }
            />

            <Select
              id="associate-status"
              label="Situacao"
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

            <Input
              id="associate-admission-date"
              label="Admissao"
              type="date"
              value={values.admissionDate}
              onChange={(event) => updateField("admissionDate", event.target.value)}
              error={errors.admissionDate}
              required
            />

            <Input
              id="associate-photo-url"
              label="Foto URL"
              value={values.fotoUrl ?? ""}
              onChange={(event) => updateField("fotoUrl", event.target.value)}
              placeholder="Preparado para upload futuro"
              error={errors.fotoUrl}
            />
          </div>

          {isCompanyProfile ? (
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                id="associate-company-document"
                label="CNPJ"
                value={formatCnpjInput(values.cnpjEmpresa ?? "")}
                onChange={(event) => updateField("cnpjEmpresa", event.target.value)}
                error={errors.cnpjEmpresa}
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
              />
              <Input
                id="associate-company-name"
                label="Nome da empresa"
                value={values.nomeEmpresa ?? ""}
                onChange={(event) => updateField("nomeEmpresa", event.target.value)}
                error={errors.nomeEmpresa}
                placeholder="Ex.: Transportadora Exemplo Ltda"
              />
            </div>
          ) : null}
        </FormSection>

        <FormSection
          title="Informacoes pessoais"
          description="Mesmo agrupamento da ficha impressa, incluindo RG, CPF e CNH no mesmo bloco."
        >
          <div className="grid gap-5">
            <Input
              id="associate-full-address"
              label="Endereco completo"
              value={values.enderecoCompleto ?? ""}
              onChange={(event) => updateField("enderecoCompleto", event.target.value)}
              placeholder="Rua, numero, complemento"
              error={errors.enderecoCompleto}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <Input
              id="associate-bairro"
              label="Bairro"
              value={values.bairro ?? ""}
              onChange={(event) => updateField("bairro", event.target.value)}
              error={errors.bairro}
            />
            <Input
              id="associate-cidade"
              label="Cidade"
              value={values.cidade ?? ""}
              onChange={(event) => updateField("cidade", event.target.value)}
              error={errors.cidade}
            />
            <Select
              id="associate-estado"
              label="Estado"
              value={values.estado ?? ""}
              error={errors.estado}
              placeholder="Selecione"
              options={brazilianStates.map((state) => ({
                value: state,
                label: state,
              }))}
              onChange={(event) => updateField("estado", event.target.value)}
            />
            <Input
              id="associate-cep"
              label="CEP"
              value={formatCepInput(values.cep ?? "")}
              onChange={(event) => updateField("cep", event.target.value)}
              error={errors.cep}
              inputMode="numeric"
              placeholder="00000-000"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Input
              id="associate-profissao"
              label="Profissao"
              value={values.profissao ?? ""}
              onChange={(event) => updateField("profissao", event.target.value)}
              error={errors.profissao}
            />
            <Select
              id="associate-sexo"
              label="Sexo"
              value={values.sexo ?? ""}
              error={errors.sexo}
              placeholder="Selecione"
              options={associateSexOptions.map((option) => ({
                value: option,
                label: option,
              }))}
              onChange={(event) =>
                updateField("sexo", event.target.value as AssociateSex | "")
              }
            />
            <Input
              id="associate-birth-date"
              label="Data de nascimento"
              type="date"
              value={values.dataNascimento ?? ""}
              onChange={(event) => updateField("dataNascimento", event.target.value)}
              error={errors.dataNascimento}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Input
              id="associate-nacionalidade"
              label="Nacionalidade"
              value={values.nacionalidade ?? ""}
              onChange={(event) => updateField("nacionalidade", event.target.value)}
              error={errors.nacionalidade}
            />
            <Input
              id="associate-naturalidade"
              label="Naturalidade"
              value={values.naturalidade ?? ""}
              onChange={(event) => updateField("naturalidade", event.target.value)}
              error={errors.naturalidade}
            />
            <Select
              id="associate-civil-state"
              label="Estado civil"
              value={values.estadoCivil ?? ""}
              error={errors.estadoCivil}
              placeholder="Selecione"
              options={associateCivilStates.map((state) => ({
                value: state,
                label: state,
              }))}
              onChange={(event) => updateField("estadoCivil", event.target.value)}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Input
              id="associate-rg"
              label="RG"
              value={values.rg ?? ""}
              onChange={(event) => updateField("rg", event.target.value)}
              error={errors.rg}
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
            <Input
              id="associate-cnh"
              label="CNH"
              value={values.cnh ?? ""}
              onChange={(event) => updateField("cnh", event.target.value)}
              error={errors.cnh}
            />
          </div>
        </FormSection>

        <FormSection
          title="Dados familiares"
          description="Mantem a mesma leitura da ficha: pai, mae, telefone e contato."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              id="associate-father-name"
              label="Nome do pai"
              value={values.nomePai ?? ""}
              onChange={(event) => updateField("nomePai", event.target.value)}
              error={errors.nomePai}
            />
            <Input
              id="associate-mother-name"
              label="Nome da mae"
              value={values.nomeMae ?? ""}
              onChange={(event) => updateField("nomeMae", event.target.value)}
              error={errors.nomeMae}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              id="associate-telefone"
              label="Telefone"
              value={values.telefone ?? ""}
              onChange={(event) => updateField("telefone", event.target.value)}
              error={errors.telefone}
            />
            <Input
              id="associate-celular"
              label="Contato"
              value={values.celular ?? ""}
              onChange={(event) => updateField("celular", event.target.value)}
              error={errors.celular}
            />
          </div>

          <div className="grid gap-5">
            <Input
              id="associate-email"
              label="E-mail complementar"
              type="email"
              value={values.email ?? ""}
              onChange={(event) => updateField("email", event.target.value)}
              error={errors.email}
            />
          </div>
        </FormSection>

        <FormSection
          title="Dependentes"
          description="Os campos abaixo alimentam diretamente as linhas 20 a 23 da ficha de impressao."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              id="associate-dependent-name-1"
              label="20. Nome"
              value={dependentDraft.firstName}
              onChange={(event) =>
                updateDependentDraft("firstName", event.target.value)
              }
            />
            <Input
              id="associate-dependent-relationship-1"
              label="21. Grau de parentesco"
              value={dependentDraft.firstRelationship}
              onChange={(event) =>
                updateDependentDraft("firstRelationship", event.target.value)
              }
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              id="associate-dependent-name-2"
              label="22. Nome"
              value={dependentDraft.secondName}
              onChange={(event) =>
                updateDependentDraft("secondName", event.target.value)
              }
            />
            <Input
              id="associate-dependent-relationship-2"
              label="23. Grau de parentesco"
              value={dependentDraft.secondRelationship}
              onChange={(event) =>
                updateDependentDraft("secondRelationship", event.target.value)
              }
            />
          </div>
        </FormSection>

        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row">
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingLabel={mode === "edit" ? "Salvando..." : "Criando..."}
            className="sm:flex-1"
            onClick={() => {
              submitIntentRef.current = "save";
            }}
          >
            {resolvedSubmitLabel}
          </Button>

          <button
            type="submit"
            className="df-button-secondary min-h-12 justify-center rounded-[14px]"
            disabled={isSubmitting}
            onClick={() => {
              submitIntentRef.current = "saveAndPrint";
            }}
          >
            {resolvedSaveAndPrintLabel}
          </button>

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

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-strong)]">
          {title}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function mergeInitialValues(
  initialValues?: Partial<AssociateFormValues>,
): AssociateFormValues {
  return {
    ...defaultValues,
    ...initialValues,
    cpf: initialValues?.cpf ? formatCpfInput(initialValues.cpf) : defaultValues.cpf,
    cnpjEmpresa: initialValues?.cnpjEmpresa
      ? formatCnpjInput(initialValues.cnpjEmpresa)
      : defaultValues.cnpjEmpresa,
    cep: initialValues?.cep ? formatCepInput(initialValues.cep) : defaultValues.cep,
  };
}

function extractDependentDraft(initialValues?: Partial<AssociateFormValues>): DependentDraft {
  const dependentNames = splitDependentValues(initialValues?.dependentes);
  const dependentRelationships = splitDependentValues(initialValues?.grauParentesco);

  return {
    firstName: dependentNames[0] ?? "",
    firstRelationship: dependentRelationships[0] ?? "",
    secondName: dependentNames[1] ?? "",
    secondRelationship: dependentRelationships[1] ?? "",
  };
}

function splitDependentValues(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinDependentValues(firstValue: string, secondValue: string) {
  const values = [firstValue, secondValue]
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values.join("\n") : "";
}

function unmaskCpf(value: string) {
  return value.replace(/\D/g, "");
}

function unmaskDigits(value: string) {
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

function formatCepInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return digits.replace(/(\d{5})(\d+)/, "$1-$2");
}

function formatCnpjInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    return digits.replace(/(\d{2})(\d+)/, "$1.$2");
  }

  if (digits.length <= 8) {
    return digits.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  }

  if (digits.length <= 12) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  }

  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/,
    "$1.$2.$3/$4-$5",
  );
}
