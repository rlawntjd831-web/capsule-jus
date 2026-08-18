"use client";

import { useEffect, useState } from "react";
import {
  formatWeather,
  type Capsule,
} from "@/lib/capsules";

export function CapsuleWeather({
  capsule,
  className,
}: {
  capsule: Pick<
    Capsule,
    "weather_sky" | "weather_temp" | "weather_humidity" | "created_at"
  >;
  className?: string;
}) {
  const stored = formatWeather(capsule);
  const [text, setText] = useState(stored);

  useEffect(() => {
    if (stored) {
      setText(stored);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/weather?at=${encodeURIComponent(capsule.created_at)}`,
          { signal: AbortSignal.timeout(8000) },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          sky: string | null;
          temperature: number | null;
          humidity: number | null;
        };
        const next = formatWeather({
          weather_sky: data.sky,
          weather_temp: data.temperature,
          weather_humidity: data.humidity,
        });
        if (!cancelled && next) setText(next);
      } catch {
        // keep empty
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [capsule.created_at, stored]);

  if (!text) return null;

  return <p className={className}>묻은 날 {text}</p>;
}
