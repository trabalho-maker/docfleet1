import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AuthUser } from "@/features/auth/types";

export async function getCurrentUser(): Promise<AuthUser> {
  const session = await auth();

  if (!session?.user?.email || !session.user.id) {
    redirect("/login");
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "Usuário DocFleet",
    email: session.user.email,
    role: session.user.role,
  };
}
