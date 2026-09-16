"use client";

import { Moon, Sun, Sunrise, Sunset, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  buildBand,
  formatOffset,
  formatZoneDifference,
  getZoneParts,
  type BandCell,
} from "@/lib/zone-math";

export type BoardZone = {
  zone: string;
  label: string;
  sublabel: string;
  /** Marks the visitor's own zone, used as the comparison baseline. */
  isHome?: boolean;
  /** Present when the API supplied authoritative DST detail. */
  dstNote?: string;
  /** Link that removes this zone from the board; omitted when not removable. */
  removeHref?: string | null;
  /** Official abbreviation from the API; falls back to the Intl short name. */
  abbreviation?: string;
};

type ZoneBoardProps = {
  zones: BoardZone[];
  /** Server render time, so first paint matches the client. */
  initialIso: string;
};

const PHASE_STYLES: Record<BandCell["phase"], string> = {
  night: "bg-indigo-950",
  dawn: "bg-orange-400/50",
  day: "bg-amber-300/80",
  dusk: "bg-violet-500/50",
};

export function ZoneBoard({ zones, initialIso }: ZoneBoardProps) {
  const [now, setNow] = useState(() => new Date(initialIso));

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const home = zones.find((zone) => zone.isHome) ?? zones[0];
  const homeOffset = home ? getZoneParts(home.zone, now).offsetMinutes : 0;

  return (
    <div className="space-y-3">
      {zones.map((zone) => {
        const parts = getZoneParts(zone.zone, now);
        const band = buildBand(parts);
        const difference = formatZoneDifference(homeOffset, parts.offsetMinutes);
        const PhaseIcon = phaseIcon(parts.hour);
        const removeHref = zone.removeHref ?? null;

        return (
          <article
            key={zone.zone}
            className={[
              "grid items-center gap-4 rounded-2xl border px-5 py-4 backdrop-blur lg:grid-cols-[15rem_minmax(0,1fr)_8rem]",
              zone.isHome
                ? "border-amber-400/40 bg-white/[0.07]"
                : "border-white/10 bg-white/[0.04]",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <PhaseIcon className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-white">
                    {zone.label}
                  </h3>
                  {zone.isHome ? (
                    <span className="shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                      You
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-white/50">{zone.sublabel}</p>
                <p className="mt-1 font-mono text-3xl font-semibold leading-none text-white tabular-nums">
                  {parts.time24}
                  <span className="ml-1 text-base text-white/40">
                    :{String(parts.second).padStart(2, "0")}
                  </span>
                </p>
                <p className="mt-1 text-xs text-white/50">
                  {parts.weekday} {parts.dateLabel} ·{" "}
                  {zone.abbreviation || parts.abbreviation || formatOffset(parts.offsetMinutes)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex h-7 overflow-hidden rounded-md" aria-hidden="true">
                {band.map((cell) => (
                  <div
                    key={cell.hour}
                    className={[
                      "relative flex-1 border-r border-black/20 last:border-r-0",
                      PHASE_STYLES[cell.phase],
                    ].join(" ")}
                  >
                    {cell.isCurrent ? (
                      <span className="absolute inset-0 ring-2 ring-inset ring-white" />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-white/35">
                <span>00</span>
                <span>06</span>
                <span>12</span>
                <span>18</span>
                <span>24</span>
              </div>
              {zone.dstNote ? (
                <p className="mt-1.5 text-[11px] text-white/45">{zone.dstNote}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2 lg:flex-col lg:items-end lg:gap-1">
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-amber-200">
                  {formatOffset(parts.offsetMinutes)}
                </p>
                {home && zone.zone !== home.zone ? (
                  <p className="text-xs text-white/50">{difference}</p>
                ) : null}
              </div>
              {removeHref ? (
                <Link
                  href={removeHref}
                  aria-label={`Remove ${zone.label}`}
                  className="rounded-md p-1.5 text-white/30 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function phaseIcon(hour: number) {
  if (hour >= 6 && hour < 8) return Sunrise;
  if (hour >= 8 && hour < 18) return Sun;
  if (hour >= 18 && hour < 20) return Sunset;
  return Moon;
}
