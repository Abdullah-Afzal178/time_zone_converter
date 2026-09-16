/**
 * Local time-zone maths built on Intl, with no API calls. The API is the
 * authority for geocoding, DST transition dates and official abbreviations;
 * everything here is what a ticking clock needs every second.
 */

export type ZoneParts = {
  /** 0-23 in the zone. */
  hour: number;
  minute: number;
  second: number;
  /** e.g. "Mon" */
  weekday: string;
  /** e.g. "7 Sep" */
  dateLabel: string;
  /** e.g. "2026-09-07" */
  isoDate: string;
  time24: string;
  time12: string;
  /** Intl's short name, e.g. "EDT" or "GMT+9". */
  abbreviation: string;
  /** Minutes east of UTC. */
  offsetMinutes: number;
};

export type BandCell = {
  /** Local hour 0-23 this cell represents. */
  hour: number;
  phase: "night" | "dawn" | "day" | "dusk";
  isCurrent: boolean;
};

const PART_FORMATTERS = new Map<string, Intl.DateTimeFormat>();
const ABBR_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function partFormatter(timeZone: string) {
  let formatter = PART_FORMATTERS.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    PART_FORMATTERS.set(timeZone, formatter);
  }

  return formatter;
}

function abbrFormatter(timeZone: string) {
  let formatter = ABBR_FORMATTERS.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    });
    ABBR_FORMATTERS.set(timeZone, formatter);
  }

  return formatter;
}

export function isValidZone(timeZone: string): boolean {
  if (!timeZone.trim()) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function getZoneParts(timeZone: string, at: Date): ZoneParts {
  const parts = partFormatter(timeZone).formatToParts(at);
  const map: Record<string, string> = {};

  for (const part of parts) {
    map[part.type] = part.value;
  }

  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  // h23 still emits "24" for midnight in some engines.
  const hour = Number(map.hour) % 24;
  const minute = Number(map.minute);
  const second = Number(map.second);

  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMinutes = Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);

  const abbrParts = abbrFormatter(timeZone).formatToParts(at);
  const abbreviation =
    abbrParts.find((part) => part.type === "timeZoneName")?.value ?? "";

  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const meridiem = hour < 12 ? "AM" : "PM";

  return {
    hour,
    minute,
    second,
    weekday: map.weekday ?? "",
    dateLabel: `${day} ${MONTHS[month - 1]}`,
    isoDate: `${map.year}-${map.month}-${map.day}`,
    time24: `${pad(hour)}:${pad(minute)}`,
    time12: `${hour12}:${pad(minute)} ${meridiem}`,
    abbreviation,
    offsetMinutes,
  };
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function phaseForHour(hour: number): BandCell["phase"] {
  if (hour >= 6 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 18) return "day";
  if (hour >= 18 && hour < 20) return "dusk";
  return "night";
}

/** 24 cells starting at the zone's local midnight, marking the current hour. */
export function buildBand(parts: ZoneParts): BandCell[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    phase: phaseForHour(hour),
    isCurrent: hour === parts.hour,
  }));
}

export function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(offsetMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;

  return minutes === 0
    ? `UTC${sign}${hours}`
    : `UTC${sign}${hours}:${pad(minutes)}`;
}

/** Signed difference between two zones, e.g. "+13h" or "-4h 30m". */
export function formatZoneDifference(fromMinutes: number, toMinutes: number): string {
  const delta = toMinutes - fromMinutes;

  if (delta === 0) {
    return "Same time";
  }

  const sign = delta < 0 ? "-" : "+";
  const absolute = Math.abs(delta);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;

  if (hours === 0) {
    return `${sign}${minutes}m`;
  }

  return minutes === 0 ? `${sign}${hours}h` : `${sign}${hours}h ${minutes}m`;
}

/**
 * Hours (in the first zone's local clock) where every zone sits inside the
 * given working window — the meeting-overlap calculation.
 */
export function overlappingHours(
  zones: Array<{ offsetMinutes: number }>,
  workStart = 9,
  workEnd = 18,
): number[] {
  if (zones.length === 0) {
    return [];
  }

  const base = zones[0].offsetMinutes;
  const hours: number[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    const worksEverywhere = zones.every((zone) => {
      const shifted = hour + (zone.offsetMinutes - base) / 60;
      const local = ((shifted % 24) + 24) % 24;
      return local >= workStart && local < workEnd;
    });

    if (worksEverywhere) {
      hours.push(hour);
    }
  }

  return hours;
}

/** Reads "2026-09-07T14:30" (a wall-clock time in `timeZone`) into an instant. */
export function instantFromLocalInput(value: string, timeZone: string): Date | null {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  const naiveUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second ?? "0"),
  );

  // Solve for the instant whose local time in `timeZone` equals the input.
  let guess = new Date(naiveUtc);

  for (let pass = 0; pass < 3; pass += 1) {
    const parts = getZoneParts(timeZone, guess);
    const corrected = naiveUtc - parts.offsetMinutes * 60000;

    if (corrected === guess.getTime()) {
      break;
    }

    guess = new Date(corrected);
  }

  return Number.isFinite(guess.getTime()) ? guess : null;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

/** "America/New_York" -> "New York" */
export function zoneCityLabel(timeZone: string): string {
  const segment = timeZone.split("/").pop() ?? timeZone;
  return segment.replace(/_/g, " ");
}

export function zoneRegionLabel(timeZone: string): string {
  const [region] = timeZone.split("/");
  return region.replace(/_/g, " ");
}
