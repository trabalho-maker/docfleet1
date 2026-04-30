"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type JSX, type ReactNode } from "react";
import { signOutAction } from "@/features/auth/actions/sign-out";
import type { AuthUser } from "@/features/auth/types";

type DashboardSidebarProps = {
  user: AuthUser;
};

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardGridIcon },
  { label: "Documentos", href: "/documentos", icon: DocumentsIcon },
  { label: "Associados", href: "/associados", icon: AssociatesIcon },
  { label: "Taxistas", href: "/taxistas", icon: TaxiIcon },
  {
    label: "Transporte escolar",
    href: "/transportes-escolares",
    icon: SchoolBusIcon,
  },
  { label: "Caminhoes", href: "/caminhoes", icon: TruckIcon },
  { label: "Empresas", href: "/empresas", icon: BuildingsIcon },
];

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [associadosExpanded, setAssociadosExpanded] = useState(
    isAssociatesSubmenuPath(pathname),
  );
  const [taxistasExpanded, setTaxistasExpanded] = useState(
    pathname.startsWith("/taxistas/cadastro"),
  );

  return (
    <aside className="flex h-full flex-col bg-[linear-gradient(180deg,#1B3555_0%,#243F62_100%)] text-white md:sticky md:top-0 md:min-h-screen">
      <div className="border-b border-white/10 px-4 py-5 xl:px-5 xl:py-6">
        <div className="flex items-center justify-center gap-3 xl:justify-start">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F59E0B] text-white shadow-[0_12px_24px_rgba(245,158,11,0.28)]">
            <DocFleetMark />
          </div>
          <div className="hidden xl:block">
            <p className="text-base font-semibold tracking-tight">TransDocs</p>
            <p className="text-sm text-white/65">Gestao de Documentos</p>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 px-4 py-5 xl:px-5">
        <div className="flex items-center justify-center gap-3 xl:justify-start">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-white">
            {getUserInitials(user.name)}
          </span>
          <div className="hidden min-w-0 xl:block">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-sm text-white/65">{user.role}</p>
          </div>
        </div>
      </div>

      <nav aria-label="Navegacao principal" className="flex-1 px-3 py-6">
        <div className="space-y-2">
          {navigationItems.map((item) =>
            item.href === "/associados" ? (
              <ExpandableNavigationGroup
                key={item.href}
                item={item}
                pathname={pathname}
                expanded={associadosExpanded}
                onToggle={() => setAssociadosExpanded((current) => !current)}
                expandLabel="associados"
                childrenItems={[
                  {
                    href: "/associados/mensalidades",
                    label: "Mensalidades",
                    active: isAssociatesSubmenuPath(pathname),
                  },
                ]}
              />
            ) : item.href === "/taxistas" ? (
              <ExpandableNavigationGroup
                key={item.href}
                item={item}
                pathname={pathname}
                expanded={taxistasExpanded}
                onToggle={() => setTaxistasExpanded((current) => !current)}
                expandLabel="taxistas"
                childrenItems={[
                  {
                    href: "/taxistas/cadastro",
                    label: "Cadastro",
                    active: pathname === "/taxistas/cadastro",
                  },
                ]}
              />
            ) : (
              <NavigationItem
                key={item.href}
                href={item.href}
                active={isActivePath(pathname, item.href)}
                icon={item.icon}
                title={item.label}
              >
                {item.label}
              </NavigationItem>
            ),
          )}
        </div>
      </nav>

      <div className="px-3 pb-4 xl:px-4">
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/12 bg-white/8 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#243F62]"
            title="Sair do painel"
          >
            <span className="xl:hidden">
              <LogoutIcon />
            </span>
            <span className="hidden xl:inline">Sair do painel</span>
          </button>
        </form>
      </div>

      <div className="hidden px-5 pb-5 pt-1 text-xs text-white/45 xl:block">
        v1.0.0 · 2026
      </div>
    </aside>
  );
}

function ExpandableNavigationGroup({
  item,
  pathname,
  expanded,
  onToggle,
  expandLabel,
  childrenItems,
}: {
  item: (typeof navigationItems)[number];
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
  expandLabel: string;
  childrenItems: Array<{
    href: string;
    label: string;
    active: boolean;
  }>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <NavigationItem
          href={item.href}
          active={isActivePath(pathname, item.href)}
          icon={item.icon}
          title={item.label}
          className="flex-1"
        >
          {item.label}
        </NavigationItem>
        <button
          type="button"
          aria-label={
            expanded
              ? `Recolher submenu de ${expandLabel}`
              : `Expandir submenu de ${expandLabel}`
          }
          aria-expanded={expanded}
          onClick={onToggle}
          className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-[#F39C12] transition-all duration-200 hover:bg-white/10 hover:text-[#FFB238] xl:inline-flex"
        >
          <ChevronIcon expanded={expanded} />
        </button>
      </div>

      {expanded ? (
        <div className="hidden pl-4 pr-2 xl:block">
          {childrenItems.map((childItem) => (
            <SubmenuLink
              key={childItem.href}
              href={childItem.href}
              active={childItem.active}
            >
              {childItem.label}
            </SubmenuLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NavigationItem({
  href,
  active,
  icon: Icon,
  children,
  title,
  onClick,
  className,
}: {
  href: string;
  active: boolean;
  icon: (props: { active: boolean }) => JSX.Element;
  children: string;
  title: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={title}
      onClick={onClick}
      className={`group flex items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors xl:justify-start ${
        active
          ? "bg-[#F59E0B] text-white shadow-[0_14px_28px_rgba(245,158,11,0.24)]"
          : "text-white/74 hover:bg-white/8 hover:text-white"
      } ${className ?? ""}`}
    >
      <Icon active={active} />
      <span className="hidden xl:inline">{children}</span>
    </Link>
  );
}

function SubmenuLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-white/62 hover:bg-white/8 hover:text-white"
      }`}
    >
      <span className="inline-flex h-2 w-2 rounded-full bg-[#F59E0B]" />
      <span>{children}</span>
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isAssociatesSubmenuPath(pathname: string) {
  return pathname === "/associados/mensalidades" || pathname.includes("/mensalidades");
}

function getUserInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "DF";
}

function DocFleetMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2v-13a2.5 2.5 0 0 1 2-2.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function SidebarIconFrame({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center ${
        active ? "text-white" : "text-white/72"
      }`}
    >
      {children}
    </span>
  );
}

function DashboardGridIcon({ active }: { active: boolean }) {
  return (
    <SidebarIconFrame active={active}>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="4" y="4" width="6" height="6" rx="1.4" />
        <rect x="14" y="4" width="6" height="6" rx="1.4" />
        <rect x="4" y="14" width="6" height="6" rx="1.4" />
        <rect x="14" y="14" width="6" height="6" rx="1.4" />
      </svg>
    </SidebarIconFrame>
  );
}

function DocumentsIcon({ active }: { active: boolean }) {
  return (
    <SidebarIconFrame active={active}>
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
        <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2v-13a2.5 2.5 0 0 1 2-2.5Z" />
        <path d="M14 3.5V8h4" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    </SidebarIconFrame>
  );
}

function AssociatesIcon({ active }: { active: boolean }) {
  return (
    <SidebarIconFrame active={active}>
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
        <path d="M16 19a4 4 0 0 0-8 0" />
        <circle cx="12" cy="9" r="3.2" />
        <path d="M20 18a3.2 3.2 0 0 0-2.3-3.1" />
        <path d="M6.3 14.9A3.2 3.2 0 0 0 4 18" />
      </svg>
    </SidebarIconFrame>
  );
}

function TaxiIcon({ active }: { active: boolean }) {
  return (
    <SidebarIconFrame active={active}>
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
        <path d="M5 14.5 7 9h10l2 5.5" />
        <path d="M4.5 14.5h15a1.5 1.5 0 0 1 1.5 1.5v2h-2.5" />
        <path d="M3 18v-2a1.5 1.5 0 0 1 1.5-1.5" />
        <path d="M6.5 18h11" />
        <circle cx="7.5" cy="18" r="1.5" />
        <circle cx="16.5" cy="18" r="1.5" />
      </svg>
    </SidebarIconFrame>
  );
}

function SchoolBusIcon({ active }: { active: boolean }) {
  return (
    <SidebarIconFrame active={active}>
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
        <path d="M5 6h10a3 3 0 0 1 3 3v6H4V7a1 1 0 0 1 1-1Z" />
        <path d="M18 10h1.8a1.2 1.2 0 0 1 1.2 1.2V15h-3" />
        <path d="M6.5 18h7" />
        <circle cx="7.5" cy="18" r="1.5" />
        <circle cx="15.5" cy="18" r="1.5" />
      </svg>
    </SidebarIconFrame>
  );
}

function TruckIcon({ active }: { active: boolean }) {
  return (
    <SidebarIconFrame active={active}>
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
        <path d="M3 7h11v8H3z" />
        <path d="M14 10h3l3 3v2h-6" />
        <circle cx="7.5" cy="18" r="1.5" />
        <circle cx="17.5" cy="18" r="1.5" />
      </svg>
    </SidebarIconFrame>
  );
}

function BuildingsIcon({ active }: { active: boolean }) {
  return (
    <SidebarIconFrame active={active}>
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
        <path d="M4 20V6a1 1 0 0 1 1-1h6v15" />
        <path d="M11 20V9a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v11" />
        <path d="M8 9h.01M8 12h.01M8 15h.01M15 12h.01M15 15h.01" />
      </svg>
    </SidebarIconFrame>
  );
}

function LogoutIcon() {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
