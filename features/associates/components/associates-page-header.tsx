import type { ReactNode } from "react";

type AssociatesPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  action?: ReactNode;
  supportingBadge?: ReactNode;
};

export function AssociatesPageHeader({
  eyebrow,
  title,
  description,
  userName,
  userEmail,
  action,
  supportingBadge,
}: AssociatesPageHeaderProps) {
  return (
    <section className="rounded-[32px] border border-[#E5E7EB] bg-white px-6 py-6 shadow-[0_20px_45px_rgba(15,23,42,0.05)] lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#64748B]">
            {eyebrow}
          </p>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A] lg:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#64748B] lg:text-base">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm text-[#64748B] sm:min-w-[280px]">
          <div>
            <p className="font-semibold text-[#0F172A]">{userName}</p>
            <p className="mt-1">{userEmail}</p>
          </div>
          {supportingBadge}
          {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}
