import { renderToStaticMarkup } from "react-dom/server";
import { AssociateForm } from "@/features/associates/components/associate-form";

describe("associate form", () => {
  it("hides the sindical category field and keeps only active statuses in the UI", () => {
    const markup = renderToStaticMarkup(
      <AssociateForm onSubmit={() => undefined} />,
    );

    expect(markup).not.toContain("Categoria sindical");
    expect(markup).toContain("Modalidade da ficha");
    expect(markup).toContain(">Ativo<");
    expect(markup).toContain(">Inativo<");
    expect(markup).not.toContain(">Suspenso<");
    expect(markup).not.toContain(">Bloqueado<");
  });
});
