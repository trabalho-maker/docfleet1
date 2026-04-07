import type { AuthProvider } from "@/features/auth/types";

export const authProviders: AuthProvider[] = [
  {
    id: "credentials",
    name: "Credenciais internas",
    description: "Fluxo simples para integrar formulario, API propria ou diretorio corporativo.",
  },
  {
    id: "sso",
    name: "SSO corporativo",
    description: "Espaco reservado para Azure AD, Google Workspace ou outro provedor OIDC/SAML.",
  },
];
