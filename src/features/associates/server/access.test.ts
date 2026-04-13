jest.mock("@/features/auth/server/session", () => ({
  getCurrentUser: jest.fn(),
}));

import { getCurrentUser } from "@/features/auth/server/session";
import {
  AssociateAccessDeniedError,
  requireAssociateModuleAccess,
} from "@/src/features/associates/server/access";

const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;

describe("associate access", () => {
  beforeEach(() => {
    mockedGetCurrentUser.mockReset();
  });

  it("allows operators to view the associates module", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: "usr_01",
      name: "Operador",
      email: "operador@docfleet.local",
      role: "Operador",
    });

    await expect(requireAssociateModuleAccess("view")).resolves.toMatchObject({
      role: "Operador",
    });
  });

  it("blocks operators from creating associates", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: "usr_01",
      name: "Operador",
      email: "operador@docfleet.local",
      role: "Operador",
    });

    await expect(requireAssociateModuleAccess("create")).rejects.toThrow(
      AssociateAccessDeniedError,
    );
  });

  it("allows managers to delete associates", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: "usr_02",
      name: "Gestor",
      email: "gestor@docfleet.local",
      role: "Gestor de frota",
    });

    await expect(requireAssociateModuleAccess("delete")).resolves.toMatchObject({
      role: "Gestor de frota",
    });
  });
});
