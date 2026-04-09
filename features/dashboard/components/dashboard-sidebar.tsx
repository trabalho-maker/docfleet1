import Link from "next/link";
import { signOutAction } from "@/features/auth/actions/sign-out";
import type { AuthUser } from "@/features/auth/types";

type DashboardSidebarProps = {
  user: AuthUser;
};

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", active: true },
  { label: "Documentos", href: "/documentos", active: false },
  { label: "Recuperacao", href: "/recuperar-senha", active: false },
];

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  return (
    <aside className="flex h-full flex-col justify-between bg-[#1E3A5F] px-5 py-6 text-white lg:px-6 lg:py-8">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <DocFleetMark />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/65">
              DocFleet
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              TransDocs Panel
            </h1>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/6 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            Usuario ativo
          </p>
          <p className="mt-3 text-lg font-semibold">{user.name}</p>
          <p className="mt-1 text-sm text-white/70">{user.email}</p>
          <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/82">
            {user.role}
          </p>
        </div>

        <nav aria-label="Navegacao principal" className="space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                item.active
                  ? "bg-[#F59E0B] text-slate-950"
                  : "bg-transparent text-white/78 hover:bg-[#29476D] hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  item.active ? "bg-slate-950/70" : "bg-white/25 group-hover:bg-white/60"
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/16 p-4">
          <p className="text-sm font-semibold text-white">Governanca documental</p>
          <p className="mt-2 text-sm leading-6 text-white/68">
            Painel conectado a dados reais, alertas incrementais e autenticacao com
            sessao ativa.
          </p>
        </div>
      </div>

      <form action={signOutAction} className="mt-8">
        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/12 bg-white/8 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F]"
        >
          Sair do painel
        </button>
      </form>
    </aside>
  );
}

function DocFleetMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-7 w-7 text-white"
      fill="none"
    >
      <path
        d="M11 12.5A4.5 4.5 0 0 1 15.5 8h12.2a4.5 4.5 0 0 1 3.182 1.318l6.8 6.8A4.5 4.5 0 0 1 39 19.3v13.2A7.5 7.5 0 0 1 31.5 40h-16A4.5 4.5 0 0 1 11 35.5v-23Z"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path d="M29 8.5V17h8.5" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M17 25h16M17 31h10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
