export type City = {
  label: string;
  zone: string;
  country: string;
};

/** Curated list used for the picker and quick-add chips. */
export const CITIES: City[] = [
  { label: "UTC", zone: "UTC", country: "Coordinated Universal Time" },
  { label: "Honolulu", zone: "Pacific/Honolulu", country: "United States" },
  { label: "Anchorage", zone: "America/Anchorage", country: "United States" },
  { label: "Los Angeles", zone: "America/Los_Angeles", country: "United States" },
  { label: "Vancouver", zone: "America/Vancouver", country: "Canada" },
  { label: "Denver", zone: "America/Denver", country: "United States" },
  { label: "Mexico City", zone: "America/Mexico_City", country: "Mexico" },
  { label: "Chicago", zone: "America/Chicago", country: "United States" },
  { label: "New York", zone: "America/New_York", country: "United States" },
  { label: "Toronto", zone: "America/Toronto", country: "Canada" },
  { label: "Bogotá", zone: "America/Bogota", country: "Colombia" },
  { label: "São Paulo", zone: "America/Sao_Paulo", country: "Brazil" },
  { label: "Buenos Aires", zone: "America/Argentina/Buenos_Aires", country: "Argentina" },
  { label: "Reykjavík", zone: "Atlantic/Reykjavik", country: "Iceland" },
  { label: "London", zone: "Europe/London", country: "United Kingdom" },
  { label: "Dublin", zone: "Europe/Dublin", country: "Ireland" },
  { label: "Lisbon", zone: "Europe/Lisbon", country: "Portugal" },
  { label: "Madrid", zone: "Europe/Madrid", country: "Spain" },
  { label: "Paris", zone: "Europe/Paris", country: "France" },
  { label: "Amsterdam", zone: "Europe/Amsterdam", country: "Netherlands" },
  { label: "Berlin", zone: "Europe/Berlin", country: "Germany" },
  { label: "Zurich", zone: "Europe/Zurich", country: "Switzerland" },
  { label: "Rome", zone: "Europe/Rome", country: "Italy" },
  { label: "Stockholm", zone: "Europe/Stockholm", country: "Sweden" },
  { label: "Warsaw", zone: "Europe/Warsaw", country: "Poland" },
  { label: "Athens", zone: "Europe/Athens", country: "Greece" },
  { label: "Helsinki", zone: "Europe/Helsinki", country: "Finland" },
  { label: "Kyiv", zone: "Europe/Kyiv", country: "Ukraine" },
  { label: "Istanbul", zone: "Europe/Istanbul", country: "Türkiye" },
  { label: "Moscow", zone: "Europe/Moscow", country: "Russia" },
  { label: "Cairo", zone: "Africa/Cairo", country: "Egypt" },
  { label: "Lagos", zone: "Africa/Lagos", country: "Nigeria" },
  { label: "Nairobi", zone: "Africa/Nairobi", country: "Kenya" },
  { label: "Johannesburg", zone: "Africa/Johannesburg", country: "South Africa" },
  { label: "Tel Aviv", zone: "Asia/Jerusalem", country: "Israel" },
  { label: "Riyadh", zone: "Asia/Riyadh", country: "Saudi Arabia" },
  { label: "Dubai", zone: "Asia/Dubai", country: "United Arab Emirates" },
  { label: "Karachi", zone: "Asia/Karachi", country: "Pakistan" },
  { label: "Mumbai", zone: "Asia/Kolkata", country: "India" },
  { label: "Kathmandu", zone: "Asia/Kathmandu", country: "Nepal" },
  { label: "Dhaka", zone: "Asia/Dhaka", country: "Bangladesh" },
  { label: "Bangkok", zone: "Asia/Bangkok", country: "Thailand" },
  { label: "Jakarta", zone: "Asia/Jakarta", country: "Indonesia" },
  { label: "Singapore", zone: "Asia/Singapore", country: "Singapore" },
  { label: "Hong Kong", zone: "Asia/Hong_Kong", country: "Hong Kong" },
  { label: "Shanghai", zone: "Asia/Shanghai", country: "China" },
  { label: "Seoul", zone: "Asia/Seoul", country: "South Korea" },
  { label: "Tokyo", zone: "Asia/Tokyo", country: "Japan" },
  { label: "Perth", zone: "Australia/Perth", country: "Australia" },
  { label: "Adelaide", zone: "Australia/Adelaide", country: "Australia" },
  { label: "Brisbane", zone: "Australia/Brisbane", country: "Australia" },
  { label: "Sydney", zone: "Australia/Sydney", country: "Australia" },
  { label: "Auckland", zone: "Pacific/Auckland", country: "New Zealand" },
];

const BY_ZONE = new Map(CITIES.map((city) => [city.zone, city]));

export function cityForZone(zone: string): City | undefined {
  return BY_ZONE.get(zone);
}
