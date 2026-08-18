"use client";

import { useEffect, useState } from "react";
import { WeatherBackdrop } from "@/components/WeatherBackdrop";
import { weatherTheme } from "@/lib/capsuleStyle";
import {
  fetchLiveWeather,
  getCurrentCoords,
  type LiveWeatherState,
} from "@/lib/liveWeather";

const REFRESH_MS = 10 * 60 * 1000;

export function NowWeather({
  compact = false,
  hint,
}: {
  compact?: boolean;
  hint?: string;
}) {
  const { status, weather, usingFallback, updatedAt } = useLiveWeather();
  const theme = weatherTheme(weather?.sky ?? null, weather?.temperature);
  const locationLabel = weather?.location
    ?? (usingFallback ? "서울" : "현재 위치");
  const caption =
    hint ??
    (compact
      ? "묻는 순간에 이 날씨가 함께 저장돼요"
      : "현재 위치 기준 · 10분마다 새로고침");

  return (
    <section
      className={`relative overflow-hidden rounded-[1.75rem] border border-white/50 shadow-lg shadow-rose-100/40 ${
        compact ? "px-5 py-4" : "px-5 py-5 sm:px-6"
      }`}
    >
      <WeatherBackdrop shape={theme.shape} soft />
      {status === "loading" ? (
        <WeatherSkeleton />
      ) : status === "error" || !weather ? (
        <p className="relative z-10 text-sm text-stone-400">지금 날씨를 불러오지 못했어요</p>
      ) : (
        <div className="relative z-10 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-stone-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                지금 여기
              </span>
              {usingFallback ? (
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-stone-400">
                  서울 기준
                </span>
              ) : null}
            </div>
            <p className={`flex min-w-0 items-center gap-1.5 font-semibold tracking-tight text-stone-800 ${compact ? "mt-1 text-lg" : "mt-1.5 text-2xl"}`}>
              <LocationPin className={compact ? "h-4 w-4" : "h-5 w-5"} />
              <span className="truncate">{locationLabel}</span>
            </p>
            <div className={`mt-2 flex flex-wrap items-end gap-x-4 gap-y-1 text-stone-600 ${compact ? "text-sm" : "text-base"}`}>
              <WeatherStat label="하늘" value={weather.sky ?? "—"} />
              <WeatherStat
                label="기온"
                value={formatTemp(weather.temperature)}
                emphasize
              />
              <WeatherStat
                label="습도"
                value={
                  weather.humidity != null ? `${weather.humidity}%` : "—"
                }
              />
            </div>
            {updatedAt ? (
              <p className="mt-2 text-[11px] text-stone-400">
                {formatUpdatedAt(updatedAt)} 기준 · {caption}
              </p>
            ) : null}
        </div>
      )}
    </section>
  );
}

function WeatherStat({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] tracking-wide text-stone-400">{label}</p>
      <p className={emphasize ? "text-xl font-semibold text-stone-800" : "font-medium"}>
        {value}
      </p>
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <div className="relative z-10 animate-pulse">
      <div className="h-3 w-16 rounded-full bg-white/70" />
      <div className="mt-2 h-6 w-32 rounded-full bg-white/70" />
      <div className="mt-3 flex gap-4">
        <div className="h-8 w-12 rounded-lg bg-white/60" />
        <div className="h-8 w-12 rounded-lg bg-white/60" />
        <div className="h-8 w-12 rounded-lg bg-white/60" />
      </div>
    </div>
  );
}

function LocationPin({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 text-stone-500 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 21s7-6.2 7-11.2A7 7 0 0 0 5 9.8C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.2" />
    </svg>
  );
}

function formatTemp(value: number | null) {
  return value != null ? `${value}℃` : "—";
}

function formatUpdatedAt(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useLiveWeather(): LiveWeatherState {
  const [state, setState] = useState<LiveWeatherState>({
    status: "loading",
    weather: null,
    usingFallback: false,
    updatedAt: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const coords = await getCurrentCoords();
      try {
        const weather = await fetchLiveWeather(coords.lat, coords.lng);
        if (cancelled) return;
        setState({
          status: "ready",
          weather,
          usingFallback: coords.fallback,
          updatedAt: Date.now(),
        });
      } catch {
        if (cancelled) return;
        setState({
          status: "error",
          weather: null,
          usingFallback: coords.fallback,
          updatedAt: null,
        });
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return state;
}
