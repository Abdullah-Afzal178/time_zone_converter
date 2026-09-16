# World Clock & Time Zone Converter

An open-source world clock and time zone converter: see the current time in cities around the world on a live day/night timeline, convert any date and time between zones, and find the hours that work for everyone — powered by the [ipgeolocation.io Timezone API](https://ipgeolocation.io/documentation/timezone-api.html).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-000?logo=nextdotjs)](https://nextjs.org/)
[![Powered by ipgeolocation.io](https://img.shields.io/badge/Powered%20by-ipgeolocation.io-1a73e8)](https://ipgeolocation.io)

<!-- Add a screenshot of the tool running locally at ./public/tool.png and reference it here -->

---

## What It Does

**World clock** (`/`)

- Live ticking time for every zone on the board, updated every second
- Your own zone detected from your IP and pinned to the top as the comparison baseline
- A 24-hour **day/night band** per zone — night, dawn, day and dusk shaded, with the current hour marked
- UTC offset and the signed difference from your zone (`-12h`, `+5h 30m`, …)
- Daylight saving status with the exact transition date, straight from the API
- **Meeting overlap** strip: the hours that fall inside 09:00–18:00 in *every* zone at once
- Add any city by name or IANA zone; remove zones; the board is a shareable URL

**Converter** (`/convert`)

- Convert a date and time between any two zones
- Both sides shown with UTC offset, official abbreviation (EDT, JST, IST…), full zone name and a DST badge
- The exact difference, including half-hour and 45-minute zones

---

## Why ipgeolocation.io

A clock can tick locally, but the interesting parts cannot:

- **Place search** — resolve free text like "Lisbon" or "Berlin, Germany" to an IANA zone. There is no local way to geocode a name.
- **Visitor's zone from IP** — pin the board to wherever the reader actually is.
- **Authoritative DST data** — `is_dst`, `dst_exists`, and the exact UTC instant of the next transition (`dst_start` / `dst_end`), plus official abbreviations and full names.
- **Conversion** — the API performs the conversion, so the result does not depend on the browser's tz database version.
- **Free tier** — every endpoint this tool uses works on the free plan.

> **How the work is split.** The ticking clocks, day/night bands, offset differences and meeting-overlap maths all run locally via `Intl` (see [`lib/zone-math.ts`](lib/zone-math.ts)) — a world clock cannot call an API every second. The API is used where it genuinely adds something: geocoding, IP detection, DST transition dates, official abbreviations, and the conversion itself. A page load of the board costs **one** API call.

> ipgeolocation.io also offers dedicated APIs for [IP Geolocation](https://ipgeolocation.io/documentation/ip-location-api.html), [ASN](https://ipgeolocation.io/documentation/asn-api.html), [Security](https://ipgeolocation.io/documentation/ip-security-api.html) (VPN, proxy, Tor detection), [Astronomy](https://ipgeolocation.io/documentation/astronomy-api.html), [User-Agent parsing](https://ipgeolocation.io/documentation/user-agent-api.html), and [Abuse Contact](https://ipgeolocation.io/documentation/ip-abuse-contact-api.html) lookups.

**[Get your free API key →](https://ipgeolocation.io/signup)**

---

## Features

- **Live clocks** — every zone ticks, no API polling
- **Day/night timeline** per zone, with the current hour highlighted
- **Meeting overlap** across up to 8 zones
- **Half-hour and 45-minute zones** handled correctly (Kolkata +5:30, Kathmandu +5:45, Chatham +13:45)
- **DST-aware** — offsets reflect the selected date, not just today
- **City or zone input** — "Denver", "Asia/Seoul", "Lisbon" all work
- **Shareable URLs** — `/?zones=Asia/Tokyo,Europe/London`, `/convert?from=…&to=…&time=…`
- **Server-side API calls only** — your API key is never exposed to the browser
- **Session-scoped caching** — refreshing doesn't burn another API call
- **SEO-ready** — Open Graph tags, meta description, `robots.txt`, `sitemap.xml`, and favicon

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Language | TypeScript |
| Icons | [lucide-react](https://lucide.dev/) |
| Time zone data | [ipgeolocation.io](https://ipgeolocation.io) + `Intl` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [ipgeolocation.io](https://ipgeolocation.io/signup) API key (free tier is enough)

### Run It Locally

1. Clone the repo:

```bash
git clone https://github.com/Abdullah-Afzal178/time_zone_converter.git
cd time_zone_converter
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```env
IPGEOLOCATION_API_KEY=your_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `IPGEOLOCATION_API_KEY` | Yes | Your [ipgeolocation.io](https://ipgeolocation.io/signup) API key |
| `NEXT_PUBLIC_SITE_URL` | No | Your production URL if you choose to deploy (used for sitemap and OG metadata) |

---

## How It Works

1. On the board, the server reads your IP from request headers and asks the [Timezone API](https://ipgeolocation.io/documentation/timezone-api.html) for your zone — including DST status and the next transition. That is the one API call per page load.
2. The zone list comes from `?zones=` (or a sensible default set) and is rendered client-side: `Intl` gives each zone's current time, offset and abbreviation, and the clocks tick every second with no further requests.
3. Adding a city by free text calls the API with `location=` so it can geocode the name to an IANA zone.
4. On `/convert`, the server calls `timezone/convert` for the conversion plus one lookup per zone for official DST detail.
5. All API results are cached in-memory for the session.

---

## Project Structure

```
time_zone_converter/
├── app/
│   ├── convert/          # Time zone converter page
│   ├── layout.tsx        # Root layout with metadata
│   ├── page.tsx          # World clock board
│   ├── opengraph-image.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── zone-board.tsx    # Live ticking rows + day/night bands (client)
│   ├── overlap-strip.tsx # Meeting overlap (client)
│   ├── add-zone-form.tsx
│   └── site-header.tsx
├── lib/
│   ├── zone-math.ts      # Local Intl-based time maths (no API)
│   ├── timezone-api.ts   # Calls ipgeolocation.io (key stays server-side)
│   ├── cities.ts         # Curated city → zone list
│   └── session-cache.ts
├── .env                  # API key (not committed)
└── README.md
```

---

## Want to Deploy It?

Works out of the box on any platform that supports Next.js:

- **Vercel** — import the repo, add `IPGEOLOCATION_API_KEY`, deploy.
- **Netlify**, **Cloudflare Pages**, **Railway** — similar process.
- **Self-hosted** — `npm run build && npm start`.

---

## License

MIT — see [LICENSE](LICENSE) for details.
