export const CAPSULE_SHAPES = [
  "sun",
  "cloud",
  "rain",
  "snow",
  "fog",
  "storm",
  "heat",
] as const;

export type CapsuleShape = (typeof CAPSULE_SHAPES)[number];

export type CapsuleMood = {
  line: string;
  keywords: string[];
  shape: CapsuleShape;
  color: string;
};

const SHAPE_COLORS: Record<CapsuleShape, string> = {
  sun: "#E8D5A3",
  cloud: "#C5D0DC",
  rain: "#A9C0D4",
  snow: "#D9E6F0",
  fog: "#D5CDC6",
  storm: "#B7B8C9",
  heat: "#E8C4B0",
};

export const WEATHER_SKY: Record<CapsuleShape, { from: string; via: string; to: string }> = {
  sun: { from: "#FFF8EA", via: "#F7E6C3", to: "#EDD3B0" },
  cloud: { from: "#F6F8FB", via: "#E4EAF1", to: "#D2DCE6" },
  rain: { from: "#EEF3F8", via: "#D7E3EE", to: "#C3D4E3" },
  snow: { from: "#FCFDFE", via: "#EEF4F9", to: "#DCE8F1" },
  fog: { from: "#F8F5F2", via: "#EBE5DF", to: "#DDD5CE" },
  storm: { from: "#EEF0F5", via: "#D8DCE8", to: "#C5C9D8" },
  heat: { from: "#FFF5EE", via: "#F6DDD0", to: "#EBC8B6" },
};

export function weatherTheme(sky: string | null, temperature?: number | null) {
  const shape = skyToShape(sky, temperature);
  return { shape, color: SHAPE_COLORS[shape] };
}

export function skyToShape(
  sky: string | null,
  temperature?: number | null,
): CapsuleShape {
  if (temperature != null && temperature >= 32) return "heat";
  if (sky === "맑음") return "sun";
  if (sky === "구름많음") return "cloud";
  if (sky === "흐림") return "fog";
  if (sky === "비" || sky === "소나기") return "rain";
  if (sky === "눈" || sky === "비/눈") return "snow";
  return "cloud";
}

export function normalizeMood(
  raw: Partial<CapsuleMood> | null,
  sky: string | null,
  temperature?: number | null,
): CapsuleMood {
  const shape = CAPSULE_SHAPES.includes(raw?.shape as CapsuleShape)
    ? (raw?.shape as CapsuleShape)
    : skyToShape(sky, temperature);
  const color =
    typeof raw?.color === "string" && /^#([0-9A-Fa-f]{6})$/.test(raw.color)
      ? raw.color
      : SHAPE_COLORS[shape];
  const keywords = Array.isArray(raw?.keywords)
    ? raw.keywords.map((word) => String(word).trim()).filter(Boolean).slice(0, 5)
    : [];

  return {
    line: raw?.line?.trim() || (sky ? `${sky} 속에 묻어 둔 하루` : "오늘을 봉인해 두었어요"),
    keywords: keywords.length > 0 ? keywords : [sky, "기억", "오늘"].filter(Boolean) as string[],
    shape,
    color,
  };
}
