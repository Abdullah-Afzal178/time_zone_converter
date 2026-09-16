"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-white/45">
          Unexpected error
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          The page could not be rendered.
        </h1>
        <p className="mt-4 text-base text-white/60">
          Try again. If the problem continues, verify the API key and the response from
          ipgeolocation.io.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 inline-flex items-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-indigo-950 transition hover:bg-amber-200"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
