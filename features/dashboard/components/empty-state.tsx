type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-5 py-6">
      <p className="text-base font-semibold text-[#0F172A]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
    </div>
  );
}
