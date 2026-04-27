import { renderToStaticMarkup } from "react-dom/server";
import { AssociateStatusBadge } from "@/features/associates/components/associate-status-badge";

describe("associate status badge", () => {
  it("renders legacy statuses without breaking the badge", () => {
    const suspendedMarkup = renderToStaticMarkup(
      <AssociateStatusBadge status="Suspenso" />,
    );
    const blockedMarkup = renderToStaticMarkup(
      <AssociateStatusBadge status="Bloqueado" />,
    );

    expect(suspendedMarkup).toContain("Suspenso");
    expect(blockedMarkup).toContain("Bloqueado");
  });
});
