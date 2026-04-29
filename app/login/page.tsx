import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInCard } from "@/features/auth/components/sign-in-card";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesso inicial ao ambiente do DocFleet.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#1B3555_0%,#243F62_100%)]">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.10),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_20%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.08),transparent_28%)]" />
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-80 w-80 rounded-full bg-[#F59E0B]/10 blur-3xl" />
        <div className="relative w-full max-w-[460px]">
          <SignInCard resetSuccess={params.reset === "success"} />
        </div>
      </section>
    </main>
  );
}
