export function PageSkeleton() {
  return (
    <>
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="h-9 w-48 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
      <main className="mx-auto max-w-6xl space-y-3 px-4 py-8 sm:px-6 lg:px-8">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
          />
        ))}
      </main>
    </>
  );
}
