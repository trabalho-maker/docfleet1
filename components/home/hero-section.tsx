import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_48%,#1d4ed8_100%)] px-6 py-8 text-white shadow-[0_40px_100px_rgba(15,23,42,0.18)] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_24%),radial-gradient(circle_at_78%_18%,rgba(125,211,252,0.14),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_24%)]" />

      <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-7">
          <div className="flex flex-col items-start gap-4">
            <Image
              src="/logo-docfleet.svg"
              alt="DocFleet"
              width={520}
              height={260}
              priority
              className="h-auto w-[220px] sm:w-[280px] lg:w-[360px]"
            />
            <p className="inline-flex rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-blue-50/88 backdrop-blur-sm">
              Plataforma administrativa para documentos, alertas e governança operacional
            </p>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.6rem] lg:leading-[1.02]">
              Centralize a operação documental da sua frota em um único painel.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-blue-50/76">
              O DocFleet reúne vencimentos, compliance, associados e fluxos operacionais em
              uma base preparada para crescer com previsibilidade e clareza.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="df-button-primary px-6">
              Entrar no sistema
            </Link>
            <Link href="/dashboard" className="df-button-secondary px-6 text-white/92 border-white/14 bg-white/8 hover:bg-white/12 hover:text-white hover:border-white/18">
              Ver área operacional
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.24)] backdrop-blur-md">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100/62">
                  Base operacional
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  Fundamentos prontos para escalar com segurança.
                </p>
              </div>
              <div className="hidden rounded-[24px] border border-white/10 bg-slate-950/20 px-4 py-3 text-right sm:block">
                <p className="text-[0.7rem] uppercase tracking-[0.22em] text-blue-100/56">
                  Prontidão
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">96%</p>
              </div>
            </div>

            <div className="grid gap-3">
              {siteConfig.foundationItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-white/8 bg-slate-950/18 p-4 transition-colors duration-200 hover:bg-white/8"
                >
                  <p className="text-base font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-blue-100/62">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
