import type { Metadata } from "next";
import { ArrowRight, CalendarClock, TriangleAlert } from "lucide-react";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/page-skeleton";
import { SiteHeader } from "@/components/site-header";
import { CITIES, cityForZone } from "@/lib/cities";
import { convertTime, getZoneByName } from "@/lib/timezone-api";
import {
  formatOffset,
  getZoneParts,
  instantFromLocalInput,
  isValidZone,
  zoneCityLabel,
} from "@/lib/zone-math";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Time Zone Converter — Convert Any Time Between Time Zones",
  description:
    "Convert a date and time between any two time zones, with UTC offsets, DST status, and the exact hour difference. Free tool powered by ipgeolocation.io.",
  alternates: {
    canonical: "/convert",
  },
};

type PageProps = {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    time?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default function ConvertPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ConvertContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ConvertContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const from = firstValue(params.from) || "America/New_York";
  const to = firstValue(params.to) || "Asia/Tokyo";
  const now = new Date();
  const timeInput =
    firstValue(params.time) || defaultTimeFor(from, now);

  const zonesValid = isValidZone(from) && isValidZone(to);
  const instant = zonesValid ? instantFromLocalInput(timeInput, from) : null;

  // The API is the authority for the conversion itself and the DST context.
  const [conversion, fromZone, toZone] = zonesValid && instant
    ? await Promise.all([
        convertTime({ from, to, time: timeInput }),
        getZoneByName(from),
        getZoneByName(to),
      ])
    : [null, null, null];

  return (
    <>
      <SiteHeader active="convert" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
          <form action="/convert" method="get" className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <Field label="Date and time">
              <input
                name="time"
                type="datetime-local"
                defaultValue={timeInput}
                className="w-full rounded-xl border border-white/15 bg-indigo-950/50 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/70 [color-scheme:dark]"
              />
            </Field>
            <Field label="From zone">
              <ZoneSelect name="from" value={from} />
            </Field>
            <Field label="To zone">
              <ZoneSelect name="to" value={to} />
            </Field>
            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-6 py-2.5 text-sm font-semibold text-indigo-950 transition hover:bg-amber-200 lg:w-auto"
              >
                <CalendarClock className="h-4 w-4" />
                Convert
              </button>
            </div>
          </form>
        </section>

        {!zonesValid ? (
          <Notice message="Pick two valid time zones to convert between." />
        ) : !instant ? (
          <Notice message="That date and time could not be read. Use the format 2026-09-07T14:30." />
        ) : conversion && !conversion.ok ? (
          <Notice message={`${conversion.error.title}: ${conversion.error.message}`} />
        ) : conversion?.ok && instant ? (
          <>
            <section className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
              <ResultCard
                heading="From"
                zone={from}
                wallClock={conversion.data.originalTime}
                offsetMinutes={getZoneParts(from, instant).offsetMinutes}
                abbreviation={fromZone?.ok ? fromZone.data.currentAbbreviation : ""}
                fullName={fromZone?.ok ? fromZone.data.currentFullName : ""}
                isDst={fromZone?.ok ? fromZone.data.isDst : false}
              />
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-1 rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-3">
                  <ArrowRight className="h-5 w-5 text-amber-300" />
                  <span className="whitespace-nowrap font-mono text-sm font-semibold text-amber-200">
                    {formatDiff(conversion.data.diffHour, conversion.data.diffMin)}
                  </span>
                </div>
              </div>
              <ResultCard
                heading="To"
                zone={to}
                wallClock={conversion.data.convertedTime}
                offsetMinutes={getZoneParts(to, instant).offsetMinutes}
                abbreviation={toZone?.ok ? toZone.data.currentAbbreviation : ""}
                fullName={toZone?.ok ? toZone.data.currentFullName : ""}
                isDst={toZone?.ok ? toZone.data.isDst : false}
                highlight
              />
            </section>

            <p className="text-xs text-white/40">
              Conversion performed by the ipgeolocation.io Timezone API. UTC offsets and
              daylight saving status reflect the selected date, not today.
            </p>
          </>
        ) : null}
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function ZoneSelect({ name, value }: { name: string; value: string }) {
  const known = CITIES.some((city) => city.zone === value);

  return (
    <select
      name={name}
      defaultValue={value}
      className="w-full rounded-xl border border-white/15 bg-indigo-950/50 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/70"
    >
      {!known ? <option value={value}>{zoneCityLabel(value)}</option> : null}
      {CITIES.map((city) => (
        <option key={city.zone} value={city.zone}>
          {city.label} — {city.zone}
        </option>
      ))}
    </select>
  );
}

function ResultCard({
  heading,
  zone,
  wallClock,
  offsetMinutes,
  abbreviation,
  fullName,
  isDst,
  highlight = false,
}: {
  heading: string;
  zone: string;
  wallClock: string;
  offsetMinutes: number;
  abbreviation: string;
  fullName: string;
  isDst: boolean;
  highlight?: boolean;
}) {
  const city = cityForZone(zone);
  const [datePart, timePart] = splitWallClock(wallClock);

  return (
    <div
      className={[
        "rounded-2xl border p-5 backdrop-blur",
        highlight
          ? "border-amber-300/40 bg-amber-300/[0.08]"
          : "border-white/10 bg-white/[0.04]",
      ].join(" ")}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-white/45">
        {heading}
      </p>
      <p className="mt-1 text-base font-semibold text-white">
        {city?.label ?? zoneCityLabel(zone)}
      </p>
      <p className="text-xs text-white/45">{zone}</p>

      <p className="mt-4 font-mono text-4xl font-semibold leading-none text-white tabular-nums">
        {timePart}
      </p>
      <p className="mt-2 text-sm text-white/60">{datePart}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Chip>{formatOffset(offsetMinutes)}</Chip>
        {abbreviation ? <Chip>{abbreviation}</Chip> : null}
        {isDst ? <Chip accent>DST active</Chip> : null}
      </div>
      {fullName ? (
        <p className="mt-2 text-xs text-white/40">{fullName}</p>
      ) : null}
    </div>
  );
}

function Chip({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        accent
          ? "border-amber-300/40 bg-amber-300/15 text-amber-200"
          : "border-white/15 bg-white/5 text-white/70",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function Notice({ message }: { message: string }) {
  return (
    <div className="flex max-w-2xl gap-3 rounded-2xl border border-orange-400/40 bg-orange-400/10 px-5 py-4">
      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
      <p className="text-sm leading-6 text-white/80">{message}</p>
    </div>
  );
}

/** "2026-09-08 03:30:00" -> ["Tuesday, 8 September 2026", "03:30"] */
function splitWallClock(value: string): [string, string] {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);

  if (!match) {
    return ["", value];
  }

  const [, year, month, day, hour, minute] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const label = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  return [label, `${hour}:${minute}`];
}

function formatDiff(diffHour: number, diffMin: number) {
  const totalMinutes = Number.isFinite(diffMin) && diffMin !== 0
    ? diffMin
    : diffHour * 60;

  if (totalMinutes === 0) {
    return "Same time";
  }

  const sign = totalMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(totalMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;

  return minutes === 0
    ? `${sign}${hours}h`
    : `${sign}${hours}h ${minutes}m`;
}

/** Pre-fills the form with the next round half-hour in the source zone. */
function defaultTimeFor(zone: string, now: Date) {
  const parts = getZoneParts(zone, now);
  const minute = parts.minute < 30 ? 30 : 0;
  const hour = parts.minute < 30 ? parts.hour : (parts.hour + 1) % 24;

  return `${parts.isoDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
