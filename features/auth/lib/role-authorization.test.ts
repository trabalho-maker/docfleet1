import {
  canManageOperationalData,
  canViewOperationalData,
  isManagerRole,
} from "@/features/auth/lib/role-authorization";

describe("role authorization", () => {
  it("allows managers to view and manage operational data", () => {
    const user = { role: "Gestor de frota" };

    expect(canViewOperationalData(user)).toBe(true);
    expect(canManageOperationalData(user)).toBe(true);
    expect(isManagerRole(user)).toBe(true);
  });

  it("allows operators to view but not manage operational data", () => {
    const user = { role: "Operador" };

    expect(canViewOperationalData(user)).toBe(true);
    expect(canManageOperationalData(user)).toBe(false);
    expect(isManagerRole(user)).toBe(false);
  });

  it("rejects users without a supported role", () => {
    expect(canViewOperationalData({ role: "Visitante" })).toBe(false);
    expect(canManageOperationalData({ role: "Visitante" })).toBe(false);
  });
});
