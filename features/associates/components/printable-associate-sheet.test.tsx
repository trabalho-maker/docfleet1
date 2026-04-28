import { renderToStaticMarkup } from "react-dom/server";
import { PrintableAssociateSheet } from "@/features/associates/components/printable-associate-sheet";
import type { Associate } from "@/features/associates/types";
import type { FleetDocument } from "@/features/data/types";

const associateFixture: Associate = {
  id: "asc_print_01",
  name: "Maria de Souza",
  cpf: "39053344705",
  category: "Titular",
  registrationNumber: "MAT-2026-0001",
  status: "Ativo",
  admissionDate: "2023-02-15",
  createdAt: "2026-04-06T08:15:00.000Z",
  updatedAt: "2026-04-06T08:15:00.000Z",
  modalidadeAssociado: "TAXI",
  cnpjEmpresa: null,
  nomeEmpresa: null,
  enderecoCompleto: "Rua 1, 200 - Centro",
  bairro: "Centro",
  cidade: "Rio Claro",
  estado: "SP",
  cep: "13500000",
  profissao: "Taxista",
  sexo: "F",
  dataNascimento: "1989-06-20",
  nacionalidade: "Brasileira",
  naturalidade: "Rio Claro",
  rg: "28.456.789-0",
  cnh: "01234567890",
  estadoCivil: "Casado(a)",
  nomePai: "Carlos de Souza",
  nomeMae: "Helena de Souza",
  dependentes: "2",
  grauParentesco: "Filhos",
  telefone: "(19) 3522-0001",
  celular: "(19) 99888-0001",
  email: "maria.souza@exemplo.com",
  observacoes: null,
  situacaoFinanceira: null,
  situacaoDocumental: "Texto legado",
  historicoResumo: null,
  fotoUrl: null,
};

describe("printable associate sheet", () => {
  it("renders the real documentary status from documents instead of associate status", () => {
    const documents: FleetDocument[] = [
      {
        id: "doc_01",
        name: "CNH",
        owner: "Operacao",
        documentType: "CNH",
        status: "Vencido",
        dueDate: "2026-01-10",
        associateId: "asc_print_01",
        associateName: "Maria de Souza",
        associateRegistrationNumber: "MAT-2026-0001",
        associateCategory: "TAXI",
        notes: null,
      },
    ];

    const markup = renderToStaticMarkup(
      <PrintableAssociateSheet
        associate={associateFixture}
        documents={documents}
        logoSrc={null}
      />,
    );

    expect(markup).toContain("Vencido");
    expect(markup).not.toContain("Texto legado");
    expect(markup).toContain("1 documento oficial vinculado");
  });

  it("renders a neutral message when no documents are registered", () => {
    const markup = renderToStaticMarkup(
      <PrintableAssociateSheet
        associate={associateFixture}
        documents={[]}
        logoSrc={null}
      />,
    );

    expect(markup).toContain("Sem documentos cadastrados");
    expect(markup).toContain("Base documental");
  });
});
