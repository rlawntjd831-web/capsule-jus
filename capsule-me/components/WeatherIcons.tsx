"use client";

import type { ReactNode } from "react";

type IconName =
  | "cloud"
  | "cloudRain"
  | "cloudSun"
  | "cloudFog"
  | "sun"
  | "sunrise"
  | "cloudSnow"
  | "cloudStorm"
  | "moonStars"
  | "wind"
  | "umbrella"
  | "rainbow";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function WeatherIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

const ICONS: Record<IconName, ReactNode> = {
  cloud: <Cloud />,
  cloudRain: (
    <>
      <Cloud y={-4} />
      <path {...stroke} d="M30 50c0 3 4 8 4 8s4-5 4-8a4 4 0 0 0-8 0z" />
    </>
  ),
  cloudSun: (
    <>
      <circle {...stroke} cx="44" cy="18" r="7" />
      <path {...stroke} d="M44 6v3.5M44 26.5V30M33.5 18H30M58 18h-3.5M36.2 10.2l2.5 2.5M49.3 23.3l2.5 2.5M51.8 10.2l-2.5 2.5M36.2 25.8l2.5-2.5" />
      <Cloud />
    </>
  ),
  cloudFog: (
    <>
      <Cloud y={-6} />
      <path {...stroke} strokeDasharray="5 6" d="M16 48h32" />
      <path {...stroke} strokeDasharray="5 6" d="M20 55h24" />
    </>
  ),
  sun: (
    <>
      <circle {...stroke} cx="32" cy="32" r="10" />
      <path {...stroke} d="M32 8v6M32 50v6M8 32h6M50 32h6M14.2 14.2l4.2 4.2M45.6 45.6l4.2 4.2M14.2 49.8l4.2-4.2M45.6 18.4l4.2-4.2" />
    </>
  ),
  sunrise: (
    <>
      <path {...stroke} d="M10 42h44" />
      <path {...stroke} d="M20 42a12 12 0 0 1 24 0" />
      <path {...stroke} d="M32 18v6M18.5 24.5l3.5 3.5M45.5 24.5l-3.5 3.5" />
    </>
  ),
  cloudSnow: (
    <>
      <Cloud y={-6} />
      <circle cx="24" cy="50" r="2" fill="currentColor" />
      <circle cx="32" cy="54" r="2" fill="currentColor" />
      <circle cx="40" cy="49" r="2" fill="currentColor" />
      <circle cx="28" cy="58" r="1.6" fill="currentColor" />
      <circle cx="36" cy="58" r="1.6" fill="currentColor" />
    </>
  ),
  cloudStorm: (
    <>
      <Cloud y={-6} />
      <path {...stroke} d="M30 42 24 52h7l-4 10 12-14h-7l5-6z" />
    </>
  ),
  moonStars: (
    <>
      <path {...stroke} d="M34 14a14 14 0 1 0 8 24 12 12 0 0 1-8-24z" />
      <path {...stroke} d="M48 16v6M45 19h6M18 22v4M16 24h4" />
    </>
  ),
  wind: (
    <>
      <path {...stroke} d="M10 22h30a6 6 0 1 0-1.2-8" />
      <path {...stroke} d="M10 34h36a6 6 0 1 1-1.2 8" />
      <path {...stroke} d="M10 46h22" />
    </>
  ),
  umbrella: (
    <>
      <path {...stroke} d="M12 34a20 20 0 0 1 40 0" />
      <path {...stroke} d="M32 14v20M32 34v16a4 4 0 0 0 7 0" />
    </>
  ),
  rainbow: (
    <>
      <path {...stroke} d="M14 46a18 18 0 0 1 36 0" />
      <path {...stroke} d="M20 46a12 12 0 0 1 24 0" />
      <path {...stroke} d="M26 46a6 6 0 0 1 12 0" />
      <Cloud />
    </>
  ),
};

function Cloud({ y = 0 }: { y?: number }) {
  return (
    <path
      {...stroke}
      transform={y ? `translate(0 ${y})` : undefined}
      d="M18 42h26a8 8 0 0 0 1.2-15.9 11 11 0 0 0-21.4-2.8A9 9 0 0 0 18 42z"
    />
  );
}

export type { IconName };
