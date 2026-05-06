"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import { AssociatesPageHeader } from "@/features/associates/components/associates-page-header";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { confirmMembershipPaymentAction } from "@/features/membership-fees/actions/confirm-membership-payment";
import { reverseMembershipPaymentAction } from "@/features/membership-fees/actions/reverse-membership-payment";
import type {
  MembershipFeePayment,
  MembershipFeeMonthState,
  MembershipFeeSheetView,
} from "@/features/membership-fees/types";

type MembershipFeeSectionProps = {
  sheetView: MembershipFeeSheetView;
  canEdit: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
  currentYear: number;
};

export function MembershipFeeSection({
  sheetView,
  canEdit,
  userName,
  userEmail,
  userRole,
  currentYear,
}: MembershipFeeSectionProps) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState<MembershipFeeMonthState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReversing, setIsReversing] = useState(false);
  const [isReverseConfirmationOpen, setIsReverseConfirmationOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const associateId = sheetView.associate.id;
  const basePath = `/associados/${associateId}/mensalidades`;
  const selectedPayment = selectedMonth
    ? findPaymentForMonth(sheetView.payments, sheetView.sheet.referenceYear, selectedMonth.month)
    : null;

  async function handleConfirmPayment() {
    if (!selectedMonth || selectedMonth.status === "paid") {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await confirmMembershipPaymentAction({
        associateId,
        competenceYear: sheetView.sheet.referenceYear,
        competenceMonth: selectedMonth.month,
      });

      if (!result.success) {
        setFeedback({
          type: result.duplicate ? "info" : "error",
          message: result.formError,
        });

        if (result.notFound) {
          router.push("/associados");
        }

        return;
      }

      setSelectedMonth(null);
      setFeedback({
        type: "success",
        message: `Pagamento de ${selectedMonth.competenceLabel} confirmado com sucesso.`,
      });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReversePayment() {
    if (!selectedMonth || selectedMonth.status !== "paid") {
      return;
    }

    setIsReversing(true);
    setFeedback(null);

    try {
      const result = await reverseMembershipPaymentAction({
        associateId,
        competenceYear: sheetView.sheet.referenceYear,
        competenceMonth: selectedMonth.month,
      });

      if (!result.success) {
        setFeedback({
          type: result.notFound ? "info" : "error",
          message: result.formError,
        });

        if (result.notFound) {
          setSelectedMonth(null);
          setIsReverseConfirmationOpen(false);
          router.refresh();
        }

        return;
      }

      setIsReverseConfirmationOpen(false);
      setSelectedMonth(null);
      setFeedback({
        type: "success",
        message: `Pagamento de ${result.competenceLabel} estornado com sucesso.`,
      });
      router.refresh();
    } finally {
      setIsReversing(false);
    }
  }

  async function handleCopyMessage() {
    if (!sheetView.chargeMessage) {
      return;
    }

    try {
      await navigator.clipboard.writeText(sheetView.chargeMessage);
      setCopyFeedback("Mensagem copiada para envio manual.");
    } catch {
      setCopyFeedback("Nao foi possivel copiar a mensagem agora.");
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-2 sm:py-4">
      <AssociatesPageHeader
        eyebrow="Associados > Mensalidades"
        title="Ficha de mensalidades"
        description="Controle financeiro anual do associado, separado da gestao documental e com leitura clara de pagamentos, abertos e atrasos."
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        supportingText="A ficha organiza competencias mensais, confirma pagamentos com data real e preserva o historico anual do associado."
        action={
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/associados/${associateId}/mensalidades/imprimir${sheetView.sheet.referenceYear === currentYear ? "" : `?year=${sheetView.sheet.referenceYear}`}`}
              className="df-button-secondary"
            >
              Imprimir ficha
            </Link>
            <Link href={`/associados/${associateId}/editar`} className="df-button-secondary">
              Editar
            </Link>
            <Link href={`/associados/${associateId}/documentos`} className="df-button-secondary">
              Documentos
            </Link>
            <Link href={`/associados/${associateId}/impressao`} className="df-button-secondary">
              Ver ficha
            </Link>
            <Link href="/associados" className="df-button-secondary">
              Voltar
            </Link>
          </div>
        }
      />

      {feedback ? (
        <FeedbackAlert
          type={feedback.type}
          title={feedback.type === "success" ? "Pagamento registrado" : undefined}
          message={feedback.message}
        />
      ) : null}

      <section className="grid gap-5 xl:grid-cols-4">
        <MetricCard
          metric={{
            label: "Ano",
            value: sheetView.sheet.referenceYear,
            helper: "Competencias exibidas nesta ficha anual.",
          }}
        />
        <MetricCard
          metric={{
            label: "Pagas",
            value: sheetView.summary.paidMonths,
            helper: "Mensalidades confirmadas com data real de pagamento.",
          }}
        />
        <MetricCard
          metric={{
            label: "Em aberto",
            value: sheetView.summary.currentOpenMonths,
            helper: "Competencias do mes atual ainda abertas.",
          }}
        />
        <MetricCard
          metric={{
            label: "Criticos",
            value: sheetView.summary.totalOverdueMonths,
            helper:
              sheetView.summary.totalOverdueMonths >= 3
                ? "Atraso critico com tres ou mais competencias em debito."
                : "Competencias vencidas sem pagamento confirmado.",
          }}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="df-section-card p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-5">
            <div>
              <p className="df-eyebrow">Associado vinculado</p>
              <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
                {sheetView.associate.displayName}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Matricula {sheetView.associate.registrationNumber}
              </p>
            </div>
            <span className="df-badge-pill bg-[#EEF4FB] text-[#35577E]">
              {sheetView.sheet.referenceYear}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoCard
              label="Endereco"
              value={sheetView.associate.displayAddress ?? "Nao informado"}
            />
            <InfoCard
              label="Atividade / categoria"
              value={sheetView.associate.displayCategory ?? "Nao informado"}
            />
            <InfoCard
              label="Telefone"
              value={sheetView.associate.displayPhone ?? "Nao informado"}
            />
            <InfoCard
              label="No. matricula"
              value={sheetView.associate.displayRegistrationSuffix ?? "Nao informado"}
            />
            <InfoCard
              label="INSS"
              value={sheetView.associate.displayInss ?? "Nao informado"}
            />
            <InfoCard
              label="Situacao anual"
              value={buildAnnualSituationLabel(sheetView)}
            />
          </div>

          <div className="mt-6 border-t border-[var(--color-border)] pt-5">
            <div className="flex flex-wrap gap-3">
              {sheetView.availableYears.map((year) => {
                const href = year === currentYear ? basePath : `${basePath}?year=${year}`;

                return (
                  <Link
                    key={year}
                    href={href}
                    className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors ${
                      year === sheetView.sheet.referenceYear
                        ? "bg-[#1D4ED8] text-white shadow-[0_12px_24px_rgba(29,78,216,0.22)]"
                        : "border border-[var(--color-border)] bg-white text-[var(--color-foreground)] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {year}
                  </Link>
                );
              })}
            </div>
          </div>
        </article>

        <article className="df-section-card p-6 lg:p-7">
          <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5">
            <p className="df-eyebrow">Cobranca manual</p>
            <h2 className="text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
              Mensagem para WhatsApp
            </h2>
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              A mensagem so aparece quando existem duas ou mais competencias em debito. O envio continua manual.
            </p>
          </div>

          {sheetView.chargeEligible && sheetView.chargeMessage ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-[28px] border border-amber-200 bg-[linear-gradient(180deg,#FFF7ED_0%,#FFFFFF_100%)] p-5 shadow-[0_20px_45px_rgba(180,83,9,0.08)]">
                <p className="text-sm leading-7 text-[#7C2D12]">
                  {sheetView.chargeMessage}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => void handleCopyMessage()} className="df-button-primary w-auto px-5">
                  Copiar mensagem
                </button>
                {copyFeedback ? (
                  <span className="inline-flex items-center text-sm text-[var(--color-muted)]">
                    {copyFeedback}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-[var(--color-border)] bg-[#F8FAFC] px-5 py-10 text-sm leading-6 text-[var(--color-muted)]">
              A mensagem de cobranca sera liberada automaticamente quando houver pelo menos duas mensalidades em debito.
            </div>
          )}
        </article>
      </section>

      <article className="df-section-card p-6 lg:p-7">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="df-eyebrow">Competencias mensais</p>
            <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
              Grade anual de mensalidades
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Cada card representa uma competencia mensal do ano {sheetView.sheet.referenceYear}.
            </p>
          </div>
          <span className="df-badge-pill bg-[#FFF7ED] text-[#C2410C]">
            {sheetView.summary.totalOverdueMonths} em debito
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sheetView.months.map((month) => {
            const cardPalette = getMonthPalette(month.status);
            const isPaid = month.status === "paid";
            const isClickable = isPaid || (canEdit && month.canConfirmPayment);
            const helpText = month.paidAt
              ? `Pago em ${formatPaidAt(month.paidAt)}. Clique para ver detalhes.`
              : month.status === "future"
                ? canEdit
                  ? "Competencia futura - pode ser paga antecipadamente."
                  : "Competencia futura disponivel para pagamento antecipado por usuarios com permissao de edicao."
                : canEdit && month.canConfirmPayment
                  ? "Clique para confirmar o pagamento desta competencia."
                  : "Somente usuarios com permissao de edicao podem confirmar pagamentos.";

            return (
              <button
                key={month.competenceLabel}
                type="button"
                disabled={!isClickable}
                onClick={() => setSelectedMonth(month)}
                title={month.status === "future" && !month.paidAt ? "Competencia futura - pode ser paga antecipadamente" : undefined}
                className={`group flex min-h-[184px] flex-col rounded-[28px] border p-5 text-left transition-all ${cardPalette.wrapper} ${
                  isClickable
                    ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(15,23,42,0.10)]"
                    : "cursor-default"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      {month.monthLabel}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
                      {month.competenceLabel}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cardPalette.badge}`}>
                    {getMonthStatusLabel(month.status)}
                  </span>
                </div>

                <div className="mt-5 flex-1">
                  <p className="text-sm leading-6 text-[var(--color-muted)]">{helpText}</p>
                </div>

                <div className={`mt-5 h-2.5 rounded-full ${cardPalette.bar}`} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </article>

      {selectedMonth ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 px-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-payment-dialog-title"
            className="w-full max-w-lg rounded-[32px] border border-[var(--color-border)] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
          >
            <p className="df-eyebrow">
              {selectedMonth.status === "paid"
                ? "Pagamento registrado"
                : "Confirmacao de pagamento"}
            </p>
            <h2
              id="membership-payment-dialog-title"
              className="mt-2 text-[1.9rem] font-semibold tracking-tight text-[var(--color-foreground)]"
            >
              {selectedMonth.status === "paid"
                ? "Pagamento registrado"
                : selectedMonth.status === "future"
                ? "Confirmar pagamento antecipado da mensalidade"
                : "Confirmar pagamento da mensalidade"}
            </h2>
            <div className="mt-5 rounded-[24px] border border-[var(--color-border)] bg-[#F8FAFC] p-5">
              <p className="text-sm text-[var(--color-muted)]">Associado</p>
              <p className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                {sheetView.associate.displayName}
              </p>
              <p className="mt-4 text-sm text-[var(--color-muted)]">Competencia</p>
              <p className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                {selectedMonth.competenceLabel}
              </p>
              <p className="mt-4 text-sm text-[var(--color-muted)]">Status</p>
              <p className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                {getMonthStatusLabel(selectedMonth.status)}
              </p>
              {selectedPayment?.paidAt ? (
                <>
                  <p className="mt-4 text-sm text-[var(--color-muted)]">Pago em</p>
                  <p className="mt-1 text-base font-semibold text-[var(--color-foreground)]">
                    {formatPaidAt(selectedPayment.paidAt)}
                  </p>
                </>
              ) : null}
              {selectedMonth.status === "paid" ? (
                <>
                  <p className="mt-4 text-sm text-[var(--color-muted)]">Observacao</p>
                  <p className="mt-1 text-base text-[var(--color-foreground)]">
                    {selectedPayment?.notes ?? "Sem observacao registrada."}
                  </p>
                </>
              ) : null}
            </div>
            <p className="mt-5 text-sm leading-6 text-[var(--color-muted)]">
              {selectedMonth.status === "paid"
                ? "Esta competencia ja possui pagamento confirmado. Se o lancamento foi feito por engano, voce pode estornar apenas este pagamento."
                : selectedMonth.status === "future"
                ? "Ao confirmar, o sistema gravara a data real do pagamento antecipado e mantera a competencia mensal sem alterar os atrasos anteriores."
                : "Ao confirmar, o sistema gravara a data real do pagamento e atualizara a ficha imediatamente."}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setSelectedMonth(null)}
                disabled={isSubmitting || isReversing}
                className="df-button-secondary sm:flex-1"
              >
                Fechar
              </button>
              {selectedMonth.status === "paid" ? (
                canEdit ? (
                  <button
                    type="button"
                    onClick={() => setIsReverseConfirmationOpen(true)}
                    disabled={isReversing}
                    className="df-button-primary sm:flex-1"
                  >
                    Estornar pagamento
                  </button>
                ) : null
              ) : (
                <Button
                  type="button"
                  onClick={() => void handleConfirmPayment()}
                  isLoading={isSubmitting}
                  loadingLabel="Confirmando..."
                  className="sm:flex-1"
                >
                  Confirmar pagamento
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {selectedMonth && isReverseConfirmationOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0F172A]/60 px-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-reverse-dialog-title"
            className="w-full max-w-md rounded-[32px] border border-[var(--color-border)] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.24)]"
          >
            <p className="df-eyebrow">Confirmacao de estorno</p>
            <h2
              id="membership-reverse-dialog-title"
              className="mt-2 text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]"
            >
              Estornar pagamento?
            </h2>
            <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
              Esta acao removera o lancamento de pagamento desta competencia. A mensalidade voltara ao status correspondente ao mes.
            </p>
            <p className="mt-4 text-sm font-semibold text-[var(--color-foreground)]">
              Tem certeza que deseja remover o pagamento desta competencia?
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsReverseConfirmationOpen(false)}
                disabled={isReversing}
                className="df-button-secondary sm:flex-1"
              >
                Cancelar
              </button>
              <Button
                type="button"
                onClick={() => void handleReversePayment()}
                isLoading={isReversing}
                loadingLabel="Estornando..."
                className="sm:flex-1"
              >
                Confirmar estorno
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function findPaymentForMonth(
  payments: MembershipFeePayment[],
  competenceYear: number,
  competenceMonth: number,
) {
  return (
    payments.find(
      (payment) =>
        payment.competenceYear === competenceYear &&
        payment.competenceMonth === competenceMonth,
    ) ?? null
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="df-surface-card px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-foreground)]">{value}</p>
    </div>
  );
}

function buildAnnualSituationLabel(sheetView: MembershipFeeSheetView) {
  if (sheetView.summary.totalOverdueMonths >= 3) {
    return "Atraso critico";
  }

  if (sheetView.summary.totalOverdueMonths >= 1) {
    return "Com debitos";
  }

  if (sheetView.summary.currentOpenMonths >= 1) {
    return "Mes atual em aberto";
  }

  return "Sem atrasos";
}

function getMonthStatusLabel(status: MembershipFeeMonthState["status"]) {
  switch (status) {
    case "paid":
      return "Pago";
    case "current_open":
      return "Em aberto";
    case "future":
      return "Futuro";
    case "critical_overdue":
      return "Critico";
    default:
      return "Atrasado";
  }
}

function getMonthPalette(status: MembershipFeeMonthState["status"]) {
  switch (status) {
    case "paid":
      return {
        wrapper: "border-emerald-200 bg-[linear-gradient(180deg,#ECFDF5_0%,#FFFFFF_100%)]",
        badge: "bg-emerald-100 text-emerald-700",
        bar: "bg-[#22C55E]",
      };
    case "current_open":
      return {
        wrapper: "border-amber-200 bg-[linear-gradient(180deg,#FFF7ED_0%,#FFFFFF_100%)]",
        badge: "bg-amber-100 text-amber-700",
        bar: "bg-[#F59E0B]",
      };
    case "future":
      return {
        wrapper: "border-slate-200 bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)]",
        badge: "bg-slate-100 text-slate-600",
        bar: "bg-[#CBD5E1]",
      };
    case "critical_overdue":
      return {
        wrapper: "border-red-300 bg-[linear-gradient(180deg,#FEF2F2_0%,#FFFFFF_100%)]",
        badge: "bg-red-100 text-red-700",
        bar: "bg-[#DC2626]",
      };
    default:
      return {
        wrapper: "border-rose-200 bg-[linear-gradient(180deg,#FFF1F2_0%,#FFFFFF_100%)]",
        badge: "bg-rose-100 text-rose-700",
        bar: "bg-[#F97316]",
      };
  }
}

function formatPaidAt(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
