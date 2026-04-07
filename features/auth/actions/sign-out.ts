"use server";

import { signOut } from "@/auth";
import { logger } from "@/lib/logger";

export async function signOutAction() {
  logger.info("auth.sign_out_action.attempt");
  await signOut({
    redirectTo: "/login",
  });
}
