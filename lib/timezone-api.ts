import "server-only";

import { cookies, headers } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { getSessionCache, setSessionCache } from "@/lib/session-cache";

type JsonObject = Record<string, unknown>;

export type ZoneDetail = {
  /** IANA name, e.g. "Europe/London". */
  name: string;
  offset: number;
  offsetWithDst: number;
  isDst: boolean;
  dstExists: boolean;
  dstSavings: number;
  currentAbbreviation: string;
  currentFullName: string;
  standardAbbreviation: string;
  dstStartUtc: string;
  dstEndUtc: string;
  /** Populated when the zone came from a place search or an IP. */
  city: string;
  stateProv: string;
  countryName: string;
};

export type ZoneResult =
  | { ok: true; cached: boolean; data: ZoneDetail }
  | { ok: false; error: { title: string; message: string } };

export type ConversionResult =
  | {
      ok: true;
      data: {
        originalTime: string;
        convertedTime: string;
        diffHour: number;
        diffMin: number;
      };
    }
  | { ok: false; error: { title: string; message: string } };

const TZ_ENDPOINTS = [
  "https://api.ipgeolocation.io/v3/timezone",
  "https://api.ipgeolocation.io/v2/timezone",
];

const CONVERT_ENDPOINTS = [
  "https://api.ipgeolocation.io/v3/timezone/convert",
  "https://api.ipgeolocation.io/v2/timezone/convert",
];

/** Authoritative detail for one zone: DST dates, official abbreviations. */
export async function getZoneByName(timeZone: string): Promise<ZoneResult> {
  return fetchZone({ cacheKey: `tz:${timeZone}`, params: { tz: timeZone } });
}

/** Resolves a free-text place ("Lisbon", "Berlin, Germany") to a zone. */
export async function getZoneByPlace(place: string): Promise<ZoneResult> {
  return fetchZone({ cacheKey: `place:${place.toLowerCase()}`, params: { location: place } });
}

/** The visitor's own zone, from their IP. */
export async function getVisitorZone(): Promise<ZoneResult> {
  const headerStore = await headers();
  const clientIp = getPublicClientIp(headerStore);
  const params: Record<string, string> = {};

  if (clientIp) {
    params.ip = clientIp;
  }

  return fetchZone({ cacheKey: `visitor:${clientIp ?? "self"}`, params });
}

export async function convertTime({
  from,
  to,
  time,
}: {
  from: string;
  to: string;
  time: string;
}): Promise<ConversionResult> {
  const apiKey = process.env.IPGEOLOCATION_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      error: {
        title: "Missing API key",
        message: "Set IPGEOLOCATION_API_KEY in your .env file to convert times.",
      },
    };
  }

  let lastError: ConversionResult | null = null;

  for (const endpoint of CONVERT_ENDPOINTS) {
    const params = new URLSearchParams({
      apiKey,
      tz_from: from,
      tz_to: to,
      // The API wants "YYYY-MM-DD HH:MM"; datetime-local inputs use a "T".
      time: time.replace("T", " "),
    });

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const body = (await safeReadJson(response)) as JsonObject | null;
        lastError = {
          ok: false,
          error: {
            title: "Conversion failed",
            message:
              readString(body?.message) ??
              `The conversion failed with status ${response.status}.`,
          },
        };

        if (isFallbackStatus(response.status) && endpoint.includes("/v3/")) {
          continue;
        }

        return lastError;
      }

      const payload = (await safeReadJson(response)) as JsonObject | null;
      const convertedTime = readString(payload?.converted_time);

      if (!payload || !convertedTime) {
        lastError = {
          ok: false,
          error: {
            title: "Conversion failed",
            message: "The API response did not include a converted time.",
          },
        };
        continue;
      }

      return {
        ok: true,
        data: {
          originalTime: readString(payload.original_time) ?? time,
          convertedTime,
          diffHour: readNumber(payload.diff_hour),
          diffMin: readNumber(payload.diff_min),
        },
      };
    } catch (error) {
      lastError = {
        ok: false,
        error: {
          title: "Network error",
          message:
            error instanceof Error
              ? error.message
              : "The conversion request could not be completed.",
        },
      };
    }
  }

  return (
    lastError ?? {
      ok: false,
      error: {
        title: "Conversion failed",
        message: "The conversion could not be completed.",
      },
    }
  );
}

async function fetchZone({
  cacheKey,
  params: queryParams,
}: {
  cacheKey: string;
  params: Record<string, string>;
}): Promise<ZoneResult> {
  const cookieStore = await cookies();
  const sessionId =
    cookieStore.get(SESSION_COOKIE_NAME)?.value ?? "anonymous-session";
  const sessionCacheKey = `${sessionId}:${cacheKey}`;
  const cached = getSessionCache<ZoneDetail>(sessionCacheKey);

  if (cached) {
    return { ok: true, cached: true, data: cached };
  }

  const apiKey = process.env.IPGEOLOCATION_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      error: {
        title: "Missing API key",
        message: "Set IPGEOLOCATION_API_KEY in your .env file before starting the app.",
      },
    };
  }

  let lastError: ZoneResult | null = null;

  for (const endpoint of TZ_ENDPOINTS) {
    const params = new URLSearchParams({ apiKey, ...queryParams });

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const body = (await safeReadJson(response)) as JsonObject | null;
        lastError = {
          ok: false,
          error: {
            title: response.status === 404 ? "Place not found" : "Lookup failed",
            message:
              readString(body?.message) ??
              `The time zone lookup failed with status ${response.status}.`,
          },
        };

        if (isFallbackStatus(response.status) && endpoint.includes("/v3/")) {
          continue;
        }

        return lastError;
      }

      const payload = (await safeReadJson(response)) as JsonObject | null;
      const zone = asObject(payload?.time_zone);
      const name = readString(zone?.name);

      if (!zone || !name) {
        lastError = {
          ok: false,
          error: {
            title: "Lookup failed",
            message: "The API response did not include a time zone.",
          },
        };
        continue;
      }

      const location = asObject(payload?.location);
      const dstStart = asObject(zone.dst_start);
      const dstEnd = asObject(zone.dst_end);

      const data: ZoneDetail = {
        name,
        offset: readNumber(zone.offset),
        offsetWithDst: readNumber(zone.offset_with_dst),
        isDst: zone.is_dst === true,
        dstExists: zone.dst_exists === true,
        dstSavings: readNumber(zone.dst_savings),
        currentAbbreviation: readString(zone.current_tz_abbreviation) ?? "",
        currentFullName: readString(zone.current_tz_full_name) ?? "",
        standardAbbreviation: readString(zone.standard_tz_abbreviation) ?? "",
        dstStartUtc: cleanTransition(readString(dstStart?.utc_time)),
        dstEndUtc: cleanTransition(readString(dstEnd?.utc_time)),
        city: readString(location?.city) ?? "",
        stateProv: readString(location?.state_prov) ?? "",
        countryName: readString(location?.country_name) ?? "",
      };

      setSessionCache(sessionCacheKey, data);

      return { ok: true, cached: false, data };
    } catch (error) {
      lastError = {
        ok: false,
        error: {
          title: "Network error",
          message:
            error instanceof Error
              ? error.message
              : "The lookup request could not be completed.",
        },
      };
    }
  }

  return (
    lastError ?? {
      ok: false,
      error: {
        title: "Lookup failed",
        message: "The time zone lookup could not be completed.",
      },
    }
  );
}

/** The API returns "2026-03-29 TIME 01:00"; drop the placeholder token. */
function cleanTransition(value: string | null) {
  return value ? value.replace(/\s*TIME\s*/, " ").trim() : "";
}

function isFallbackStatus(status: number) {
  return [400, 404, 405].includes(status);
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

async function safeReadJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getPublicClientIp(headerStore: Headers) {
  const candidates = [
    headerStore.get("x-forwarded-for"),
    headerStore.get("x-real-ip"),
    headerStore.get("cf-connecting-ip"),
    headerStore.get("x-vercel-forwarded-for"),
  ];

  for (const value of candidates) {
    const candidate = value
      ?.split(",")
      .map((item) => item.trim())
      .find(Boolean)
      ?.replace(/^\[|\]$/g, "");

    if (candidate && isPublicIp(candidate)) {
      return candidate;
    }
  }

  return null;
}

function isPublicIp(ip: string) {
  if (ip === "::1" || ip === "127.0.0.1") {
    return false;
  }

  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();
    return !(
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80")
    );
  }

  const octets = ip.split(".").map(Number);

  if (octets.length !== 4 || octets.some(Number.isNaN)) {
    return false;
  }

  return !(
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127)
  );
}
