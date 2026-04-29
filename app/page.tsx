import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (session?.user?.email && session.user.id) {
    redirect("/dashboard");
  }

  redirect("/login");
}
