type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#D7DEE7] bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)] px-5 py-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
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
            <path d="M12 8v4m0 4h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-[#0F172A]">{title}</p>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
        </div>
      </div>
    </div>
  );
}
