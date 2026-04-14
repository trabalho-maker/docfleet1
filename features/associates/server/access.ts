import { getCurrentUser } from "@/features/auth/server/session";
import {
  canCreateAssociate,
  canDeleteAssociate,
  canEditAssociate,
  canViewAssociates,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";

export type AssociateModuleAction = "view" | "create" | "edit" | "delete";

export class AssociateAccessDeniedError extends Error {
  constructor(
    public readonly action: AssociateModuleAction,
    message = "ASSOCIATE_ACCESS_DENIED",
  ) {
    super(message);
    this.name = "AssociateAccessDeniedError";
  }
}

export async function requireAssociateModuleAccess(
  action: AssociateModuleAction = "view",
) {
  const user = await getCurrentUser();

  if (!hasAssociateModuleAccess(user, action)) {
    throw new AssociateAccessDeniedError(
      action,
      getAssociateDeniedMessage(user, action),
    );
  }

  return user;
}

function hasAssociateModuleAccess(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  action: AssociateModuleAction,
) {
  switch (action) {
    case "view":
      return canViewAssociates(user);
    case "create":
      return canCreateAssociate(user);
    case "edit":
      return canEditAssociate(user);
    case "delete":
      return canDeleteAssociate(user);
  }
}

function getAssociateDeniedMessage(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  action: AssociateModuleAction,
) {
  if (action === "view") {
    return (
      getAssociateAccessMessage(user) ??
      "Seu perfil não pode acessar o módulo de associados."
    );
  }

  const verb = {
    view: "acessar",
    create: "criar",
    edit: "editar",
    delete: "excluir",
  }[action];

  return `Seu perfil não pode ${verb} associados.`;
}
