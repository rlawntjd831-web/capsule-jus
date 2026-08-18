type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  province?: string;
  borough?: string;
  city_district?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
};

function shortenRegion(name: string) {
  return name
    .replace(/특별자치시도?$/, "")
    .replace(/특별자치시$/, "")
    .replace(/특별자치도$/, "")
    .replace(/광역시$/, "")
    .replace(/특별시$/, "")
    .replace(/자치시$/, "")
    .replace(/도$/, "");
}

export function formatPlaceName(address: NominatimAddress): string | null {
  const regionRaw = address.state || address.province || "";
  const region = regionRaw ? shortenRegion(regionRaw) : "";
  const city = address.city ? shortenRegion(address.city) : "";
  const district =
    address.borough ||
    address.city_district ||
    address.town ||
    address.county ||
    address.municipality ||
    address.village ||
    "";

  const parts = [region || city, district || (!region ? city : "")]
    .map((part) => part.trim())
    .filter(Boolean);

  const unique = parts.filter((part, index) => parts.indexOf(part) === index);
  return unique.length > 0 ? unique.join(" ") : null;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("accept-language", "ko");
  url.searchParams.set("zoom", "14");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "capsule-me/1.0 (weather snapshot)",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(2500),
  });

  if (!res.ok) return null;

  const payload = (await res.json()) as { address?: NominatimAddress };
  return payload.address ? formatPlaceName(payload.address) : null;
}
