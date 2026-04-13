import type { AuthUser } from "@/features/auth/types";
import {
  canManageOperationalData,
  canViewOperationalData,
} from "@/features/auth/lib/role-authorization";

export function canViewAssociates(user: AuthUser | null | undefined) {
  return canViewOperationalData(user);
}

export function canCreateAssociate(user: AuthUser | null | undefined) {
  return canManageOperationalData(user);
}

export function canEditAssociate(user: AuthUser | null | undefined) {
  return canManageOperationalData(user);
}

export function canDeleteAssociate(user: AuthUser | null | undefined) {
  return canManageOperationalData(user);
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
