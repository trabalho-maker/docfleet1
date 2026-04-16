import type { ReactNode } from "react";
import type { Associate } from "@/features/associates/types";

type PrintableAssociateSheetProps = {
  associate: Associate;
  logoSrc: string | null;
};

export function PrintableAssociateSheet({
  associate,
  logoSrc,
}: PrintableAssociateSheetProps) {
  const documentReference = buildDocumentReference(associate);
  const dependentEntries = buildDependentEntries(associate);
  const profileCategory = associate.modalidadeAssociado ?? associate.category;
  const isCompanyProfile = associate.modalidadeAssociado === "CNPJ";

  return (
    <article className="print-sheet-page bg-white text-[#243B55]">
      <div className="print-sheet-frame">
        <header className="print-sheet-header">
          <div className="print-sheet-brand">
            <div className="print-sheet-logo">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt="SINTRARC"
                  className="print-sheet-logo-image"
                />
              ) : (
                <div className="print-sheet-logo-fallback">
                  <span>SINTRARC</span>
                </div>
              )}
            </div>

            <div className="print-sheet-brand-copy">
              <div className="print-sheet-brand-title-row">
                <h1>Ficha de Inscrição</h1>
              </div>
              <div className="print-sheet-brand-subtitle">
                <p>Sindicato dos Transportadores Autônomos</p>
                <p>de Pessoas, de Bens e de Cargas de Rio Claro-SP</p>
              </div>
            </div>

            <div className="print-sheet-photo-box">
              {associate.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={associate.fotoUrl}
                  alt={`Foto de ${associate.name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div>
                  <strong>Foto</strong>
                  <span>3x4</span>
                </div>
              )}
            </div>
          </div>

          <div className="print-sheet-summary-bar">
            <SummaryCell label="Numero" value={deriveMemberNumber(associate)} />
            <SummaryCell label="Admissao" value={formatDate(associate.admissionDate)} />
            <SummaryCell label="Matricula" value={associate.registrationNumber} strong />
            <SummaryCell label="Categoria" value={profileCategory} />
          </div>

          <div className="print-sheet-summary-pill-row">
            <SummaryPill label="Socio" value={associate.name} />
            <SummaryPill label="Categoria" value={profileCategory} />
            <SummaryPill label="Situacao" value={associate.status} />
          </div>
        </header>

        {isCompanyProfile ? (
          <section className="print-sheet-section">
            <SectionTitle title="Dados da empresa" />
            <div className="print-sheet-grid print-sheet-grid-family">
              <FieldCell className="col-span-2" label="Empresa" value={associate.nomeEmpresa} />
              <FieldCell className="col-span-2" label="CNPJ" value={formatCnpj(associate.cnpjEmpresa)} />
            </div>
          </section>
        ) : null}

        <section className="print-sheet-section">
          <SectionTitle title="Informacoes pessoais" />
          <div className="print-sheet-grid print-sheet-grid-personal">
            <FieldCell className="col-span-4" label="1. Nome" value={associate.name} />
            <FieldCell
              className="col-span-4"
              label="2. Endereco completo"
              value={associate.enderecoCompleto}
            />
            <FieldCell label="3. Bairro" value={associate.bairro} />
            <FieldCell label="4. Cidade" value={associate.cidade} />
            <FieldCell label="5. Estado" value={associate.estado} />
            <FieldCell label="6. CEP" value={formatCep(associate.cep)} />
            <FieldCell label="7. Profissao" value={associate.profissao} />
            <FieldCell label="8. Sexo" value={associate.sexo} />
            <FieldCell
              label="9. Data de nascimento"
              value={formatDate(associate.dataNascimento)}
            />
            <FieldCell label="10. Nacionalidade" value={associate.nacionalidade} />
            <FieldCell label="11. Naturalidade" value={associate.naturalidade} />
            <FieldCell label="12. RG" value={associate.rg} />
            <FieldCell label="13. CPF" value={formatCpf(associate.cpf)} />
            <FieldCell label="14. CNH" value={associate.cnh} />
            <FieldCell label="15. Estado civil" value={associate.estadoCivil} />
          </div>
        </section>

        <div className="print-sheet-two-columns">
          <section className="print-sheet-section">
            <SectionTitle title="Dados familiares" />
            <div className="print-sheet-grid print-sheet-grid-family">
              <FieldCell className="col-span-2" label="16. Nome do pai" value={associate.nomePai} />
              <FieldCell className="col-span-2" label="17. Nome da mae" value={associate.nomeMae} />
              <FieldCell className="col-span-2" label="18. Telefone" value={associate.telefone} />
              <FieldCell
                className="col-span-2"
                label="19. Contato"
                value={associate.celular ?? associate.email}
              />
            </div>
          </section>

          <section className="print-sheet-section">
            <SectionTitle title="Dependentes" />
            <div className="print-sheet-grid print-sheet-grid-family">
              <FieldCell className="col-span-2" label="20. Nome" value={dependentEntries[0]?.name} />
              <FieldCell
                className="col-span-2"
                label="21. Grau de parentesco"
                value={dependentEntries[0]?.relationship}
              />
              <FieldCell className="col-span-2" label="22. Nome" value={dependentEntries[1]?.name} />
              <FieldCell
                className="col-span-2"
                label="23. Grau de parentesco"
                value={dependentEntries[1]?.relationship}
              />
            </div>
          </section>
        </div>

        <section className="print-sheet-section">
          <SectionTitle title="Documentacao" />
          <div className="print-sheet-document-table">
            <TableCell head>Documento</TableCell>
            <TableCell head>Numero/Referencia</TableCell>
            <TableCell head>Status</TableCell>
            <TableCell head>Observacao</TableCell>

            <TableCell>RG / CPF / CNH</TableCell>
            <TableCell>{documentReference}</TableCell>
            <TableCell>{associate.status}</TableCell>
            <TableCell>-</TableCell>
          </div>
        </section>

        <footer className="print-sheet-footer">
          <SignatureLine label="Assinatura do Socio" />
          <SignatureLine label="Assinatura do Responsavel" />
        </footer>

        <div className="print-sheet-bottom-accent" aria-hidden="true" />
      </div>
    </article>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div className="print-sheet-section-title">{title}</div>;
}

function SummaryCell({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="print-sheet-summary-cell">
      <span>{label}</span>
      <strong className={strong ? "text-[#F39C12]" : ""}>{value}</strong>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="print-sheet-summary-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FieldCell({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={`print-sheet-field ${className}`.trim()}>
      <span>{label}</span>
      <strong>{value?.trim() || "-"}</strong>
    </div>
  );
}

function TableCell({
  children,
  head = false,
}: {
  children: ReactNode;
  head?: boolean;
}) {
  return <div className={head ? "print-sheet-table-head" : "print-sheet-table-cell"}>{children}</div>;
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div className="print-sheet-signature">
      <div className="print-sheet-signature-line" />
      <span>{label}</span>
    </div>
  );
}

function deriveMemberNumber(associate: Associate) {
  const digits = associate.registrationNumber.replace(/\D/g, "");
  return digits.slice(-4) || associate.id.slice(0, 4).toUpperCase();
}

function formatCpf(cpf: string | null | undefined) {
  if (!cpf) {
    return "-";
  }

  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11) {
    return cpf;
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatCep(cep: string | null | undefined) {
  if (!cep) {
    return "-";
  }

  const digits = cep.replace(/\D/g, "");

  if (digits.length !== 8) {
    return cep;
  }

  return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
}

function formatCnpj(cnpj: string | null | undefined) {
  if (!cnpj) {
    return "-";
  }

  const digits = cnpj.replace(/\D/g, "");

  if (digits.length !== 14) {
    return cnpj;
  }

  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC",
      dateStyle: "short",
    }).format(new Date(`${value}T00:00:00Z`));
  } catch {
    return value;
  }
}

function buildDocumentReference(associate: Associate) {
  const parts = [associate.rg, formatCpf(associate.cpf), associate.cnh].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "-";
}

function buildDependentEntries(associate: Associate) {
  const names = splitSheetValues(associate.dependentes);
  const relationships = splitSheetValues(associate.grauParentesco);

  return [0, 1].map((index) => ({
    name: names[index] ?? null,
    relationship: relationships[index] ?? null,
  }));
}

function splitSheetValues(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}
