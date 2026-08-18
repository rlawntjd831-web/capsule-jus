import { fetchOpenMeteoSnapshot } from "@/lib/openMeteo";

const SEOUL = { lat: 37.5665, lng: 126.978 };

export type WeatherSnapshot = {
  sky: string | null;
  temperature: number | null;
  humidity: number | null;
};

export function latLngToGrid(lat: number, lng: number) {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  const ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  const ra2 = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra2 * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra2 * Math.cos(theta) + YO + 0.5),
  };
}

export function kstParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function ncstBase() {
  const now = kstParts();
  const shifted = new Date(
    Date.UTC(now.year, now.month - 1, now.day, now.hour, now.minute),
  );
  if (now.minute < 10) {
    shifted.setUTCHours(shifted.getUTCHours() - 1);
  }
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  const h = shifted.getUTCHours();
  return {
    base_date: `${y}${pad2(m)}${pad2(d)}`,
    base_time: `${pad2(h)}00`,
  };
}

export function fcstBase() {
  const now = kstParts();
  const shifted = new Date(
    Date.UTC(now.year, now.month - 1, now.day, now.hour, now.minute),
  );
  if (now.minute < 45) {
    shifted.setUTCHours(shifted.getUTCHours() - 1);
  }
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  const h = shifted.getUTCHours();
  return {
    base_date: `${y}${pad2(m)}${pad2(d)}`,
    base_time: `${pad2(h)}30`,
  };
}

type KmaItem = {
  category?: string;
  obsrValue?: string;
  fcstValue?: string;
  fcstTime?: string;
};

function parseItems(payload: unknown): KmaItem[] {
  if (!payload || typeof payload !== "object") return [];
  const response = (payload as { response?: { body?: { items?: { item?: KmaItem | KmaItem[] } } } })
    .response;
  const item = response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function skyFromCodes(pty: string | undefined, sky: string | undefined) {
  switch (pty) {
    case "1":
    case "5":
      return "비";
    case "2":
    case "6":
      return "비/눈";
    case "3":
    case "7":
      return "눈";
    case "4":
      return "소나기";
    default:
      break;
  }
  switch (sky) {
    case "1":
      return "맑음";
    case "3":
      return "구름많음";
    case "4":
      return "흐림";
    default:
      return null;
  }
}

function encodeServiceKey(key: string) {
  return /%[0-9A-Fa-f]{2}/.test(key) ? key : encodeURIComponent(key);
}

function hasWeather(snapshot: WeatherSnapshot) {
  return snapshot.sky != null || snapshot.temperature != null || snapshot.humidity != null;
}

function kmaResultCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const header = (payload as { response?: { header?: { resultCode?: string } } })
    .response?.header;
  return header?.resultCode ?? "";
}

async function fetchKma(path: string, params: Record<string, string>) {
  const serviceKey = process.env.KMA_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error("KMA_SERVICE_KEY is missing");
  }

  const search = new URLSearchParams({
    pageNo: "1",
    numOfRows: "100",
    dataType: "JSON",
    ...params,
  });
  const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/${path}?serviceKey=${encodeServiceKey(serviceKey)}&${search.toString()}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(text.slice(0, 200));
  }
}

async function fetchKmaSnapshot(lat: number, lng: number): Promise<WeatherSnapshot> {
  const { nx, ny } = latLngToGrid(lat, lng);
  const ncst = ncstBase();
  const fcst = fcstBase();

  const [ncstJson, fcstJson] = await Promise.all([
    fetchKma("getUltraSrtNcst", {
      base_date: ncst.base_date,
      base_time: ncst.base_time,
      nx: String(nx),
      ny: String(ny),
    }),
    fetchKma("getUltraSrtFcst", {
      base_date: fcst.base_date,
      base_time: fcst.base_time,
      nx: String(nx),
      ny: String(ny),
    }),
  ]);

  if (kmaResultCode(ncstJson) && kmaResultCode(ncstJson) !== "00") {
    throw new Error(`KMA ncst ${kmaResultCode(ncstJson)}`);
  }

  const observed = Object.fromEntries(
    parseItems(ncstJson).map((item) => [item.category, item.obsrValue]),
  );
  const forecastItems = parseItems(fcstJson);
  const firstSky = forecastItems.find((item) => item.category === "SKY")?.fcstValue;

  const temperature = observed.T1H != null ? Number(observed.T1H) : null;
  const humidity = observed.REH != null ? Number(observed.REH) : null;

  return {
    sky: skyFromCodes(observed.PTY, firstSky),
    temperature: Number.isFinite(temperature) ? temperature : null,
    humidity: Number.isFinite(humidity) ? humidity : null,
  };
}

export async function fetchWeatherSnapshot(
  lat = SEOUL.lat,
  lng = SEOUL.lng,
): Promise<WeatherSnapshot> {
  const empty: WeatherSnapshot = { sky: null, temperature: null, humidity: null };

  const [kmaResult, meteoResult] = await Promise.allSettled([
    fetchKmaSnapshot(lat, lng),
    fetchOpenMeteoSnapshot(lat, lng),
  ]);

  const kma = kmaResult.status === "fulfilled" ? kmaResult.value : empty;
  if (hasWeather(kma)) return kma;

  if (kmaResult.status === "rejected") {
    console.error(kmaResult.reason);
  }

  if (meteoResult.status === "fulfilled" && hasWeather(meteoResult.value)) {
    return meteoResult.value;
  }

  if (meteoResult.status === "rejected") {
    console.error(meteoResult.reason);
  }

  return empty;
}

export { SEOUL };
