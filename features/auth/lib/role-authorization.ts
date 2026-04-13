type RoleAwareUser = {
  role?: string | null;
} | null | undefined;

export const MANAGER_ROLE = "Gestor de frota";
export const OPERATOR_ROLE = "Operador";

const VIEW_ROLES = new Set([
  MANAGER_ROLE.toLowerCase(),
  OPERATOR_ROLE.toLowerCase(),
]);

export function normalizeRole(user: RoleAwareUser) {
  return user?.role?.trim().toLowerCase() ?? "";
}

export function isManagerRole(user: RoleAwareUser) {
  return normalizeRole(user) === MANAGER_ROLE.toLowerCase();
}

export function canViewOperationalData(user: RoleAwareUser) {
  return VIEW_ROLES.has(normalizeRole(user));
}

export function canManageOperationalData(user: RoleAwareUser) {
  return isManagerRole(user);
}
