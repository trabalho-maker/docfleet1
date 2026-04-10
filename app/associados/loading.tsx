export default function AssociatesLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <div className="flex w-full animate-pulse flex-col gap-6">
        <section className="rounded-[32px] border border-[#E5E7EB] bg-white px-6 py-6 shadow-[0_20px_45px_rgba(15,23,42,0.05)] lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="h-4 w-40 rounded-full bg-slate-200" />
              <div className="h-12 w-72 rounded-2xl bg-slate-200" />
              <div className="h-5 w-full max-w-3xl rounded-full bg-slate-200" />
              <div className="h-5 w-2/3 rounded-full bg-slate-200" />
            </div>
            <div className="rounded-[28px] border border-[#E5E7EB] bg-[#F8FAFC] p-4 sm:min-w-[280px]">
              <div className="h-5 w-28 rounded-full bg-slate-200" />
              <div className="mt-3 h-4 w-40 rounded-full bg-slate-200" />
              <div className="mt-4 h-10 w-36 rounded-full bg-slate-200" />
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <article
              key={index}
              className="rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]"
            >
              <div className="h-4 w-24 rounded-full bg-slate-200" />
              <div className="mt-4 h-10 w-20 rounded-2xl bg-slate-200" />
              <div className="mt-4 h-4 w-40 rounded-full bg-slate-200" />
            </article>
          ))}
        </section>

        <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] lg:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="h-4 w-28 rounded-full bg-slate-200" />
              <div className="mt-3 h-8 w-56 rounded-2xl bg-slate-200" />
              <div className="mt-3 h-4 w-80 rounded-full bg-slate-200" />
            </div>
            <div className="h-10 w-32 rounded-full bg-slate-200" />
          </div>
          <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto]">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 rounded-2xl bg-slate-200" />
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] lg:p-7">
          <div className="space-y-4">
            <div className="h-4 w-24 rounded-full bg-slate-200" />
            <div className="h-9 w-64 rounded-2xl bg-slate-200" />
            <div className="h-4 w-80 rounded-full bg-slate-200" />
            <div className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white">
              <div className="grid grid-cols-7 gap-4 border-b border-[#E5E7EB] px-5 py-4">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="h-4 rounded-full bg-slate-200" />
                ))}
              </div>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-7 gap-4 border-b border-[#E5E7EB] px-5 py-5 last:border-b-0"
                >
                  {Array.from({ length: 7 }).map((_, columnIndex) => (
                    <div
                      key={columnIndex}
                      className="h-4 rounded-full bg-slate-200"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
