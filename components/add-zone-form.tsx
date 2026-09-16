import Link from "next/link";
import { MapPin, Plus } from "lucide-react";

import { CITIES } from "@/lib/cities";

type AddZoneFormProps = {
  /** Zones already on the board, so we can suggest the rest. */
  current: string[];
  error?: string | null;
};

const QUICK_PICKS = [
  "Europe/Berlin",
  "Asia/Singapore",
  "Australia/Sydney",
  "America/Sao_Paulo",
  "Asia/Kolkata",
  "UTC",
];

export function AddZoneForm({ current, error }: AddZoneFormProps) {
  const zonesParam = current.join(",");
  const quick = QUICK_PICKS.filter((zone) => !current.includes(zone)).slice(0, 4);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
      <form action="/" method="get" className="flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="zones" value={zonesParam} />
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/15 bg-indigo-950/50 px-3.5 transition focus-within:border-amber-300/70">
          <MapPin className="h-4 w-4 shrink-0 text-amber-300/80" />
          <input
            name="add"
            type="text"
            list="city-list"
            placeholder="Add a city or time zone — Lisbon, Asia/Seoul, Denver…"
            className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/35"
          />
          <datalist id="city-list">
            {CITIES.map((city) => (
              <option key={city.zone} value={city.label}>
                {city.zone}
              </option>
            ))}
          </datalist>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-semibold text-indigo-950 transition hover:bg-amber-200"
        >
          <Plus className="h-4 w-4" />
          Add zone
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-orange-300">{error}</p>
      ) : null}

      {quick.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-white/35">Quick add</span>
          {quick.map((zone) => (
            <Link
              key={zone}
              href={`/?zones=${encodeURIComponent([...current, zone].join(","))}`}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-amber-300/50 hover:text-amber-200"
            >
              {zone.split("/").pop()?.replace(/_/g, " ")}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
