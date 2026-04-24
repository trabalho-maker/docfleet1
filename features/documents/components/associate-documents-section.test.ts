import { readFileSync } from "node:fs";
import path from "node:path";

describe("associate documents section", () => {
  it('does not contain the "Â·" encoding artifact in the associate header', () => {
    const componentPath = path.join(
      process.cwd(),
      "features",
      "documents",
      "components",
      "associate-documents-section.tsx",
    );
    const source = readFileSync(componentPath, "utf-8");

    expect(source).not.toContain("Â·");
    expect(source).toContain("associateRegistrationNumber} - {associateCategoryLabel");
  });
});
