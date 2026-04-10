import type { AuthUser } from "@/features/auth/types";

const MANAGER_ROLE = "Gestor de frota";
const VIEWER_ROLES = new Set([MANAGER_ROLE, "Operador"]);

function normalizeRole(user: AuthUser | null | undefined) {
  return user?.role.trim().toLowerCase() ?? "";
}

function isManager(user: AuthUser | null | undefined) {
  return normalizeRole(user) === MANAGER_ROLE.toLowerCase();
}

export function canViewAssociates(user: AuthUser | null | undefined) {
  const role = user?.role?.trim();

  return role ? VIEWER_ROLES.has(role) : false;
}

export function canCreateAssociate(user: AuthUser | null | undefined) {
  return isManager(user);
}

export function canEditAssociate(user: AuthUser | null | undefined) {
  return isManager(user);
}

export function canDeleteAssociate(user: AuthUser | null | undefined) {
  return isManager(user);
}

export function getAssociateAccessMessage(user: AuthUser | null | undefined) {
  if (!canViewAssociates(user)) {
    return "Seu perfil não tem permissão para acessar o módulo de associados.";
  }

  if (!canCreateAssociate(user) || !canEditAssociate(user) || !canDeleteAssociate(user)) {
    return "Seu perfil pode consultar associados, mas não pode criar, editar ou excluir registros.";
  }

  return null;
}
