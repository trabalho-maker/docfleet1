import type { AuthUser } from "@/features/auth/types";

type DashboardHeaderProps = {
  user: AuthUser;
  title: string;
  description: string;
  alertCount: number;
};

export function DashboardHeader({
  user,
  title,
  description,
  alertCount,
}: DashboardHeaderProps) {
  return (
    <header className="rounded-[30px] border border-white/80 bg-white/90 px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6 lg:px-6 xl:px-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-[1.9rem] font-semibold tracking-tight text-[#163559] sm:text-[2.1rem]">
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#64748B]">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center xl:flex-nowrap xl:justify-end">
          <label className="flex min-h-12 w-full min-w-0 items-center gap-3 rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm text-[#64748B] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] lg:flex-1 xl:max-w-[360px] xl:flex-none">
            <SearchIcon />
            <input
              type="text"
              placeholder="Busca ainda nao disponivel nesta tela."
              className="w-full min-w-0 border-none bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
              aria-label="Busca indisponivel"
              disabled
            />
          </label>

          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <div
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#475569] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-colors hover:bg-[#F8FAFC]"
              aria-label="Total de alertas abertos"
              role="img"
            >
              <BellIcon />
              {alertCount > 0 ? (
                <span className="absolute right-0 top-0 inline-flex min-h-5 min-w-5 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-[#F87171] px-1 text-[0.65rem] font-semibold text-white">
                  {alertCount}
                </span>
              ) : null}
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-full border border-[#E2E8F0] bg-white pl-2 pr-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A5F] text-sm font-semibold text-white">
                {getUserInitials(user.name)}
              </span>
              <div className="hidden min-w-0 lg:block">
                <p className="truncate text-sm font-semibold text-[#163559]">
                  {user.name}
                </p>
                <p className="truncate text-xs text-[#64748B]">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function getUserInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "DF";
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 17H5.5a1 1 0 0 1-.8-1.6L6 13.7V10a6 6 0 1 1 12 0v3.7l1.3 1.7a1 1 0 0 1-.8 1.6H18" />
      <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}
