"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";

import { getZoneParts, overlappingHours } from "@/lib/zone-math";

type OverlapStripProps = {
  zones: Array<{ zone: string; label: string }>;
  initialIso: string;
  /** Baseline zone the hours are expressed in. */
  baseZone: string;
};

const WORK_START = 9;
const WORK_END = 18;

/** Working-hour overlap across every zone on the board. */
export function OverlapStrip({ zones, initialIso, baseZone }: OverlapStripProps) {
  const [now, setNow] = useState(() => new Date(initialIso));

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  if (zones.length < 2) {
    return null;
  }

  const offsets = zones.map((zone) => ({
    ...zone,
    offsetMinutes: getZoneParts(zone.zone, now).offsetMinutes,
  }));

  const baseOffset =
    offsets.find((zone) => zone.zone === baseZone)?.offsetMinutes ??
    offsets[0].offsetMinutes;

  const ordered = [
    ...offsets.filter((zone) => zone.zone === baseZone),
    ...offsets.filter((zone) => zone.zone !== baseZone),
  ];

  const hours = overlappingHours(ordered, WORK_START, WORK_END);
  const baseLabel = ordered[0]?.label ?? "";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-white/70">
            Meeting overlap
          </h2>
        </div>
        <p className="text-xs text-white/45">
          Hours between {WORK_START}:00 and {WORK_END}:00 everywhere · shown in {baseLabel}
        </p>
      </div>

      <div className="mt-4 flex gap-0.5">
        {Array.from({ length: 24 }, (_, hour) => {
          const works = hours.includes(hour);
          return (
            <div key={hour} className="flex-1">
              <div
                className={[
                  "h-8 rounded-sm",
                  works ? "bg-emerald-400/80" : "bg-white/[0.07]",
                ].join(" ")}
                title={`${String(hour).padStart(2, "0")}:00 ${baseLabel}${works ? " — works for everyone" : ""}`}
              />
              <p className="mt-1 text-center font-mono text-[9px] text-white/30">
                {String(hour).padStart(2, "0")}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-white/70">
        {hours.length === 0 ? (
          <>
            No hour works for everyone inside {WORK_START}:00–{WORK_END}:00. Someone will
            need to take it early or late.
          </>
        ) : (
          <>
            <span className="font-semibold text-emerald-300">
              {hours.length} hour{hours.length === 1 ? "" : "s"}
            </span>{" "}
            work for all {zones.length} zones — {formatRanges(hours)} in {baseLabel}.
          </>
        )}
      </p>
    </section>
  );
}

/** Collapses [9,10,11,14] into "09:00–12:00, 14:00–15:00". */
function formatRanges(hours: number[]): string {
  if (hours.length === 0) {
    return "";
  }

  const ranges: Array<[number, number]> = [];
  let start = hours[0];
  let previous = hours[0];

  for (const hour of hours.slice(1)) {
    if (hour === previous + 1) {
      previous = hour;
      continue;
    }

    ranges.push([start, previous]);
    start = hour;
    previous = hour;
  }

  ranges.push([start, previous]);

  return ranges
    .map(([from, to]) => `${pad(from)}:00–${pad(to + 1)}:00`)
    .join(", ");
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
