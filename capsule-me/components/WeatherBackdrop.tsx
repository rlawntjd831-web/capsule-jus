"use client";

import { WeatherIcon, type IconName } from "@/components/WeatherIcons";
import type { CapsuleShape } from "@/lib/capsuleStyle";
import { WEATHER_SKY } from "@/lib/capsuleStyle";

type Mark = {
  name: IconName;
  className: string;
};

const MARKS: Record<CapsuleShape, Mark[]> = {
  sun: [
    { name: "sun", className: "absolute -right-6 -top-4 h-[95%] aspect-square opacity-40" },
    { name: "sunrise", className: "absolute -left-3 bottom-[-8%] h-[60%] aspect-square opacity-25" },
    { name: "rainbow", className: "absolute left-[30%] top-[4%] h-[44%] aspect-square opacity-18" },
  ],
  cloud: [
    { name: "cloud", className: "absolute -right-5 -top-3 h-[82%] aspect-square opacity-40" },
    { name: "cloudSun", className: "absolute -left-4 bottom-[-12%] h-[64%] aspect-square opacity-28" },
    { name: "cloud", className: "absolute left-[36%] top-[8%] h-[36%] aspect-square rotate-6 opacity-18" },
  ],
  rain: [
    { name: "cloudRain", className: "absolute -right-6 -top-5 h-[90%] aspect-square opacity-40" },
    { name: "umbrella", className: "absolute left-[4%] bottom-[-10%] h-[60%] aspect-square -rotate-12 opacity-28" },
    { name: "cloudRain", className: "absolute left-[34%] top-[6%] h-[34%] aspect-square rotate-8 opacity-16" },
  ],
  snow: [
    { name: "cloudSnow", className: "absolute -right-5 -top-4 h-[86%] aspect-square opacity-40" },
    { name: "cloudSnow", className: "absolute -left-5 bottom-[-8%] h-[58%] aspect-square -rotate-8 opacity-24" },
    { name: "cloud", className: "absolute left-[38%] top-[10%] h-[32%] aspect-square opacity-16" },
  ],
  fog: [
    { name: "cloudFog", className: "absolute -right-4 -top-3 h-[84%] aspect-square opacity-38" },
    { name: "wind", className: "absolute left-[2%] bottom-[4%] h-[50%] aspect-square opacity-26" },
    { name: "cloudFog", className: "absolute left-[32%] top-[6%] h-[36%] aspect-square opacity-16" },
  ],
  storm: [
    { name: "cloudStorm", className: "absolute -right-6 -top-5 h-[92%] aspect-square opacity-42" },
    { name: "cloudStorm", className: "absolute -left-4 bottom-[-12%] h-[58%] aspect-square -rotate-6 opacity-22" },
    { name: "umbrella", className: "absolute left-[38%] top-[8%] h-[32%] aspect-square rotate-12 opacity-16" },
  ],
  heat: [
    { name: "sun", className: "absolute left-1/2 top-[-20%] h-[94%] aspect-square -translate-x-1/2 opacity-36" },
    { name: "sunrise", className: "absolute -right-4 bottom-[-8%] h-[54%] aspect-square opacity-24" },
    { name: "sun", className: "absolute left-[4%] bottom-[4%] h-[32%] aspect-square opacity-16" },
  ],
};

const INK: Record<CapsuleShape, string> = {
  sun: "#C4A56A",
  cloud: "#8A9AAB",
  rain: "#6F8AA3",
  snow: "#8EA4B8",
  fog: "#A3988E",
  storm: "#7D82A0",
  heat: "#C48B72",
};

export function WeatherBackdrop({
  shape,
  soft = false,
  className,
}: {
  shape: CapsuleShape;
  soft?: boolean;
  className?: string;
}) {
  const sky = WEATHER_SKY[shape];

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden
      style={{ color: INK[shape] }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${sky.from} 0%, ${sky.via} 52%, ${sky.to} 100%)`,
        }}
      />
      {MARKS[shape].map((mark, index) => (
        <div key={`${mark.name}-${index}`} className={mark.className}>
          <WeatherIcon
            name={mark.name}
            className={`h-full w-full ${index === 0 ? "weather-icon-float" : "weather-icon-drift"}`}
          />
        </div>
      ))}
      {soft ? (
        <div className="absolute inset-0 bg-linear-to-r from-white/40 via-white/55 to-white/70" />
      ) : (
        <div className="absolute inset-0 bg-white/10" />
      )}
    </div>
  );
}
