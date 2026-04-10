import { getCurrentUser } from "@/features/auth/server/session";

export async function requireAssociateModuleAccess() {
  return getCurrentUser();
}
