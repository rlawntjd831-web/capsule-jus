import { SEOUL, type WeatherSnapshot } from "@/lib/kma";

export type LiveWeather = WeatherSnapshot & {
  location: string | null;
  lat: number;
  lng: number;
};

export type LiveWeatherState = {
  status: "loading" | "ready" | "error";
  weather: LiveWeather | null;
  usingFallback: boolean;
  updatedAt: number | null;
};

export function getCurrentCoords() {
  return new Promise<{ lat: number; lng: number; fallback: boolean }>(
    (resolve) => {
      if (!navigator.geolocation) {
        resolve({ ...SEOUL, fallback: true });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            fallback: false,
          }),
        () => resolve({ ...SEOUL, fallback: true }),
        { timeout: 4000, maximumAge: 60_000 },
      );
    },
  );
}

export async function fetchLiveWeather(
  lat: number,
  lng: number,
): Promise<LiveWeather> {
  const empty: LiveWeather = {
    sky: null,
    temperature: null,
    humidity: null,
    location: null,
    lat,
    lng,
  };

  try {
    const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return empty;

    const data = (await res.json()) as Partial<LiveWeather>;
    return {
      sky: data.sky ?? null,
      temperature: data.temperature ?? null,
      humidity: data.humidity ?? null,
      location: data.location ?? null,
      lat: typeof data.lat === "number" && Number.isFinite(data.lat) ? data.lat : lat,
      lng: typeof data.lng === "number" && Number.isFinite(data.lng) ? data.lng : lng,
    };
  } catch {
    return empty;
  }
}
