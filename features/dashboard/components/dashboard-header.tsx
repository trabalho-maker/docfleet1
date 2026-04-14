import Link from "next/link";
import type { AuthUser } from "@/features/auth/types";

type DashboardHeaderProps = {
  user: AuthUser;
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="rounded-[32px] border border-[#E5E7EB] bg-white px-6 py-6 shadow-[0_20px_45px_rgba(15,23,42,0.05)] lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#64748B]">
            Dashboard operacional
          </p>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#0F172A] lg:text-4xl">
              Olá, {user.name}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#64748B] lg:text-base">
              Visão consolidada da operação documental com dados reais de documentos,
              vencimentos, associados e alertas conectados ao core atual do DocFleet.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm text-[#64748B] sm:min-w-[280px]">
          <div>
            <p className="font-semibold text-[#0F172A]">{user.email}</p>
            <p className="mt-1">Sessão autenticada com Auth.js e JWT.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/documentos"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#FFF7ED]"
            >
              Abrir documentos
            </Link>
            <Link
              href="/associados"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#FFF7ED]"
            >
              Abrir associados
            </Link>
            <span className="inline-flex h-10 items-center rounded-full bg-[#FFF7ED] px-4 text-sm font-semibold text-[#C2410C]">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
