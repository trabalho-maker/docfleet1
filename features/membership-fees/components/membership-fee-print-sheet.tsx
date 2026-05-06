import type { ReactNode } from "react";
import type { MembershipFeeSheetView } from "@/features/membership-fees/types";

type MembershipFeePrintSheetProps = {
  sheetView: MembershipFeeSheetView;
  logoSrc: string | null;
};

export function MembershipFeePrintSheet({
  sheetView,
  logoSrc,
}: MembershipFeePrintSheetProps) {
  const printableMonths = buildPrintableMonths(sheetView);
  const registrationSuffix = sheetView.associate.displayRegistrationSuffix?.trim() || "Nao informado";

  return (
    <article className="membership-print-page print-sheet bg-white text-[#111827]">
      <div className="membership-print-frame">
        <header className="membership-print-header">
          <div className="membership-print-brand">
            <div className="membership-print-logo">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="SINTRARC" className="membership-print-logo-image" />
              ) : (
                <div className="membership-print-logo-fallback">SINTRARC</div>
              )}
            </div>

            <div className="membership-print-brand-copy">
              <p className="membership-print-brand-name">SINTRARC</p>
              <p className="membership-print-brand-subtitle">
                <span>SINDICATO DOS TRANSPORTADORES AUTONOMOS</span>
                <span>DE PESSOAS, DE BENS E DE CARGAS DE RIO CLARO-SP</span>
              </p>
              <h1 className="membership-print-title">FICHA DE MENSALIDADES</h1>
            </div>

            <div className="membership-print-brand-spacer" aria-hidden="true" />
          </div>
        </header>

        <section className="membership-print-section">
          <div className="membership-print-section-title">Dados do associado</div>
          <div className="membership-print-info-grid">
            <div className="membership-print-info-column">
              <PrintField
                icon={<UserFieldIcon />}
                label="Nome"
                value={sheetView.associate.displayName}
              />
              <PrintField
                icon={<AddressFieldIcon />}
                label="Endereco"
                value={sheetView.associate.displayAddress}
              />
              <PrintField
                icon={<ActivityFieldIcon />}
                label="Atividade"
                value={sheetView.associate.displayCategory}
              />
              <PrintField
                icon={<PhoneFieldIcon />}
                label="Telefone"
                value={sheetView.associate.displayPhone}
              />
            </div>

            <div className="membership-print-info-column">
              <PrintField
                icon={<RegistrationFieldIcon />}
                label={"N\u00ba (Matricula)"}
                value={registrationSuffix}
              />
              <PrintField
                icon={<ShieldFieldIcon />}
                label="INSS"
                value={sheetView.associate.displayInss}
              />
              <PrintField
                icon={<CalendarFieldIcon />}
                label="Ano vigente"
                value={String(sheetView.sheet.referenceYear)}
              />
            </div>
          </div>
        </section>

        <section className="membership-print-section membership-print-section-tight">
          <div className="membership-print-section-title">Competencias do ano</div>
          <div className="membership-print-month-sequence" aria-label="Competencias do ano">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index + 1} className="membership-print-sequence-pill">
                {index + 1}
              </span>
            ))}
          </div>
        </section>

        <section className="membership-print-section membership-print-section-tight">
          <div className="membership-print-section-title">Canhotos de mensalidades</div>
          <div className="membership-print-month-grid print-coupons-grid">
            {printableMonths.map((month) => (
              <article key={month.competenceLabel} className="membership-print-month-card">
                <div className="membership-print-month-cutline" aria-hidden="true">
                  <span className="membership-print-scissor">{"\u2702"}</span>
                  <span className="membership-print-cutline-rule" />
                </div>

                <div className="membership-print-month-content">
                  <div className="membership-print-month-top">
                    <strong className="membership-print-month-competence">
                      {month.competenceLabel}
                    </strong>
                    <span className="membership-print-month-brand">SINTRARC</span>
                  </div>

                  <div className="membership-print-month-meta">
                    <span>{"N\u00ba"} {registrationSuffix}</span>
                  </div>

                  <div className="membership-print-month-date-row">
                    <span>Data:</span>
                    <span className="membership-print-month-date-line">____/____/____</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}

function PrintField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="membership-print-field">
      <div className="membership-print-field-icon" aria-hidden="true">
        {icon}
      </div>
      <span>{label}</span>
      <strong>{value?.trim() || "Nao informado"}</strong>
    </div>
  );
}

function buildPrintableMonths(sheetView: MembershipFeeSheetView) {
  return [...sheetView.months]
    .sort((left, right) => right.month - left.month)
    .map((month) => ({
      competenceLabel: month.competenceLabel,
    }));
}

function UserFieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

function AddressFieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function ActivityFieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7h11l2 3h3a2 2 0 0 1 2 2v4h-2" />
      <path d="M3 7v9h2" />
      <path d="M9 16h6" />
      <circle cx="7" cy="16" r="2" />
      <circle cx="17" cy="16" r="2" />
      <path d="M14 7v5" />
    </svg>
  );
}

function PhoneFieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6.7 4h2.2l1.5 4-1.8 1.8a15.4 15.4 0 0 0 5.6 5.6L16 13.6l4 1.5v2.2A1.7 1.7 0 0 1 18.3 19C10.9 19 5 13.1 5 5.7A1.7 1.7 0 0 1 6.7 4Z" />
    </svg>
  );
}

function RegistrationFieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h2" />
      <path d="M7 14h10" />
    </svg>
  );
}

function ShieldFieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6l-7-3Z" />
    </svg>
  );
}

function CalendarFieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 10h16" />
    </svg>
  );
}
