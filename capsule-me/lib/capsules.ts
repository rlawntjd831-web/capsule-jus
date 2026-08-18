import { normalizeMood, type CapsuleMood, type CapsuleShape } from "@/lib/capsuleStyle";
import { supabase } from "@/lib/supabase";

export type CapsulePhoto = {
  id: number;
  public_url: string;
  storage_path: string;
  sort_order: number;
};

export type Capsule = {
  id: number;
  recipient: string;
  letter: string;
  open_at: string | null;
  created_at: string;
  firebase_uid: string;
  weather_sky: string | null;
  weather_temp: number | null;
  weather_humidity: number | null;
  mood_line: string | null;
  keywords: string[] | null;
  capsule_shape: string | null;
  capsule_color: string | null;
  capsule_photos: CapsulePhoto[];
};

export const CAPSULE_SELECT =
  "id, recipient, letter, open_at, created_at, firebase_uid, weather_sky, weather_temp, weather_humidity, mood_line, keywords, capsule_shape, capsule_color, capsule_photos(id, public_url, storage_path, sort_order)";

export async function fetchCapsuleCount() {
  const { count, error } = await supabase
    .from("capsules")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export function moodFromCapsule(capsule: Capsule): CapsuleMood {
  return normalizeMood(
    {
      line: capsule.mood_line ?? undefined,
      keywords: capsule.keywords ?? undefined,
      shape: capsule.capsule_shape as CapsuleShape,
      color: capsule.capsule_color ?? undefined,
    },
    capsule.weather_sky,
    capsule.weather_temp == null ? null : Number(capsule.weather_temp),
  );
}

export function formatWeather(capsule: Pick<Capsule, "weather_sky" | "weather_temp" | "weather_humidity">) {
  const parts: string[] = [];
  if (capsule.weather_sky) parts.push(capsule.weather_sky);
  if (capsule.weather_temp != null) parts.push(`${capsule.weather_temp}℃`);
  if (capsule.weather_humidity != null) parts.push(`습도 ${capsule.weather_humidity}%`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function isCapsuleOpen(openAt: string | null) {
  if (!openAt) return true;
  return Date.now() >= new Date(openAt).getTime();
}

export function formatCountdown(openAt: string | null) {
  if (!openAt || isCapsuleOpen(openAt)) {
    return "열람 가능";
  }

  const totalSeconds = Math.max(
    0,
    Math.floor((new Date(openAt).getTime() - Date.now()) / 1000),
  );
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}일 ${hours}시간 ${minutes}분`;
  }
  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`;
  }
  return `${minutes}분 ${seconds}초`;
}

export function formatOpenAt(openAt: string | null) {
  if (!openAt) return "열람일 없음";
  return new Date(openAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
