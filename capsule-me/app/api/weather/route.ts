import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geo";
import { fetchWeatherSnapshot, SEOUL } from "@/lib/kma";
import { fetchOpenMeteoAt } from "@/lib/openMeteo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat") ?? SEOUL.lat);
  const lng = Number(request.nextUrl.searchParams.get("lng") ?? SEOUL.lng);
  const safeLat = Number.isFinite(lat) ? lat : SEOUL.lat;
  const safeLng = Number.isFinite(lng) ? lng : SEOUL.lng;
  const atRaw = request.nextUrl.searchParams.get("at");
  const at = atRaw ? new Date(atRaw) : null;

  if (at && !Number.isNaN(at.getTime())) {
    try {
      const weather = await fetchOpenMeteoAt(safeLat, safeLng, at);
      return NextResponse.json({
        ...weather,
        location: null,
        lat: safeLat,
        lng: safeLng,
      });
    } catch (error) {
      console.error(error);
      return NextResponse.json({
        sky: null,
        temperature: null,
        humidity: null,
        location: null,
        lat: safeLat,
        lng: safeLng,
      });
    }
  }

  const [weatherResult, locationResult] = await Promise.allSettled([
    fetchWeatherSnapshot(safeLat, safeLng),
    reverseGeocode(safeLat, safeLng),
  ]);

  const weather =
    weatherResult.status === "fulfilled"
      ? weatherResult.value
      : { sky: null, temperature: null, humidity: null };
  const location =
    locationResult.status === "fulfilled" ? locationResult.value : null;

  if (weatherResult.status === "rejected") {
    console.error(weatherResult.reason);
  }
  if (locationResult.status === "rejected") {
    console.error(locationResult.reason);
  }

  return NextResponse.json({
    ...weather,
    location,
    lat: safeLat,
    lng: safeLng,
  });
}
