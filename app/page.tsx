import { Suspense } from "react";

import { AddZoneForm } from "@/components/add-zone-form";
import { OverlapStrip } from "@/components/overlap-strip";
import { PageSkeleton } from "@/components/page-skeleton";
import { SiteHeader } from "@/components/site-header";
import { ZoneBoard, type BoardZone } from "@/components/zone-board";
import { cityForZone } from "@/lib/cities";
import { DEFAULT_ZONES, MAX_ZONES } from "@/lib/constants";
import { getVisitorZone, getZoneByPlace } from "@/lib/timezone-api";
import { isValidZone, zoneCityLabel, zoneRegionLabel } from "@/lib/zone-math";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    zones?: string | string[];
    add?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default function HomePage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BoardContent searchParams={searchParams} />
    </Suspense>
  );
}

async function BoardContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const zonesParam = firstValue(params.zones);
  const addParam = firstValue(params.add);

  const requested = zonesParam
    .split(",")
    .map((zone) => zone.trim())
    .filter((zone) => zone !== "" && isValidZone(zone));

  let addError: string | null = null;
  const additions: string[] = [];

  if (addParam) {
    if (isValidZone(addParam)) {
      // Already a valid IANA name — no lookup needed.
      additions.push(addParam);
    } else {
      const matchedCity = cityForZone(addParam);

      if (matchedCity) {
        additions.push(matchedCity.zone);
      } else {
        // Free text: let the API geocode the place to a zone.
        const resolved = await getZoneByPlace(addParam);

        if (resolved.ok && isValidZone(resolved.data.name)) {
          additions.push(resolved.data.name);
        } else {
          addError = resolved.ok
            ? `Could not resolve "${addParam}" to a time zone.`
            : `${resolved.error.title}: ${resolved.error.message}`;
        }
      }
    }
  }

  // The visitor's own zone comes from their IP and anchors the comparisons.
  const visitor = await getVisitorZone();
  const homeZone =
    visitor.ok && isValidZone(visitor.data.name) ? visitor.data.name : null;

  const chosen = requested.length > 0 ? requested : DEFAULT_ZONES;
  const combined = [...chosen, ...additions];
  const ordered = homeZone ? [homeZone, ...combined] : combined;
  const unique = Array.from(new Set(ordered)).slice(0, MAX_ZONES);

  const removableZones = unique.filter((zone) => zone !== homeZone);

  const boardZones: BoardZone[] = unique.map((zone) => {
    const city = cityForZone(zone);
    const isHome = zone === homeZone;
    const sublabelParts = isHome && visitor.ok
      ? [visitor.data.city, visitor.data.countryName].filter(Boolean)
      : [city?.country ?? zoneRegionLabel(zone)];

    return {
      zone,
      label: isHome && visitor.ok && visitor.data.city
        ? visitor.data.city
        : city?.label ?? zoneCityLabel(zone),
      sublabel: sublabelParts.join(" · ") || zone,
      isHome,
      dstNote:
        isHome && visitor.ok ? buildDstNote(visitor.data) : undefined,
      removeHref: isHome ? null : buildRemoveHref(removableZones, zone),
      abbreviation:
        isHome && visitor.ok ? visitor.data.currentAbbreviation : undefined,
    };
  });

  const initialIso = new Date().toISOString();

  return (
    <>
      <SiteHeader active="clock" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <ZoneBoard zones={boardZones} initialIso={initialIso} />

        <OverlapStrip
          zones={boardZones.map(({ zone, label }) => ({ zone, label }))}
          initialIso={initialIso}
          baseZone={homeZone ?? unique[0]}
        />

        <AddZoneForm current={removableZones} error={addError} />

        {!visitor.ok ? (
          <p className="text-xs text-white/40">
            Your own time zone could not be detected ({visitor.error.message}) — the first
            zone below is used as the comparison baseline.
          </p>
        ) : null}
      </main>
    </>
  );
}

/** Link back to the board without `zone`. */
function buildRemoveHref(removable: string[], zone: string) {
  const remaining = removable.filter((item) => item !== zone);
  return remaining.length > 0
    ? `/?zones=${encodeURIComponent(remaining.join(","))}`
    : "/?zones=";
}

function buildDstNote(zone: {
  isDst: boolean;
  dstExists: boolean;
  currentFullName: string;
  dstEndUtc: string;
  dstStartUtc: string;
}) {
  if (!zone.dstExists) {
    return "No daylight saving time observed";
  }

  if (zone.isDst) {
    return zone.dstEndUtc
      ? `${zone.currentFullName} — DST ends ${zone.dstEndUtc} UTC`
      : zone.currentFullName;
  }

  return zone.dstStartUtc
    ? `Standard time — DST starts ${zone.dstStartUtc} UTC`
    : "Standard time";
}
