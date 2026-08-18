import type { WeatherSnapshot } from "@/lib/kma";

type OpenMeteoCurrent = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    precipitation?: number;
  };
};

type OpenMeteoHourly = {
  hourly?: {
    time?: Array<string | number>;
    temperature_2m?: Array<number | null>;
    relative_humidity_2m?: Array<number | null>;
    weather_code?: Array<number | null>;
  };
};

export function skyFromWmo(code: number | undefined, precipitation?: number) {
  if (precipitation != null && precipitation > 0) {
    if (code != null && code >= 71 && code <= 86) return "눈";
    if (code === 80 || code === 81 || code === 82) return "소나기";
    return "비";
  }

  switch (code) {
    case 0:
    case 1:
      return "맑음";
    case 2:
      return "구름많음";
    case 3:
    case 45:
    case 48:
      return "흐림";
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return "비";
    case 80:
    case 81:
    case 82:
      return "소나기";
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return "눈";
    case 95:
    case 96:
    case 99:
      return "소나기";
    default:
      return null;
  }
}

function roundOrNull(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function snapshotFromHour(
  hourly: OpenMeteoHourly["hourly"],
  at: Date,
): WeatherSnapshot {
  const times = hourly?.time ?? [];
  if (times.length === 0) {
    return { sky: null, temperature: null, humidity: null };
  }

  const target = at.getTime();
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i += 1) {
    const stamp =
      typeof times[i] === "number"
        ? times[i] * 1000
        : new Date(times[i]).getTime();
    const diff = Math.abs(stamp - target);
    if (diff < bestDiff) {
      best = i;
      bestDiff = diff;
    }
  }

  return {
    sky: skyFromWmo(hourly?.weather_code?.[best] ?? undefined),
    temperature: roundOrNull(hourly?.temperature_2m?.[best]),
    humidity: roundOrNull(hourly?.relative_humidity_2m?.[best]),
  };
}

async function fetchHourly(base: string, lat: number, lng: number, day: string) {
  const url = new URL(base);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("hourly", "temperature_2m,relative_humidity_2m,weather_code");
  url.searchParams.set("start_date", day);
  url.searchParams.set("end_date", day);
  url.searchParams.set("timezone", "Asia/Seoul");
  url.searchParams.set("timeformat", "unixtime");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  return (await res.json()) as OpenMeteoHourly;
}

export async function fetchOpenMeteoSnapshot(
  lat: number,
  lng: number,
): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code,precipitation",
  );
  url.searchParams.set("timezone", "Asia/Seoul");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo ${res.status}`);
  }

  const payload = (await res.json()) as OpenMeteoCurrent;
  const current = payload.current;

  return {
    sky: skyFromWmo(current?.weather_code, current?.precipitation),
    temperature: roundOrNull(current?.temperature_2m),
    humidity: roundOrNull(current?.relative_humidity_2m),
  };
}

export async function fetchOpenMeteoAt(
  lat: number,
  lng: number,
  at: Date,
): Promise<WeatherSnapshot> {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);

  const forecast = await fetchHourly(
    "https://api.open-meteo.com/v1/forecast",
    lat,
    lng,
    day,
  );
  const fromForecast = snapshotFromHour(forecast?.hourly, at);
  if (fromForecast.sky != null || fromForecast.temperature != null) {
    return fromForecast;
  }

  const archive = await fetchHourly(
    "https://archive-api.open-meteo.com/v1/archive",
    lat,
    lng,
    day,
  );
  return snapshotFromHour(archive?.hourly, at);
}
