"use client";

import { WeatherBackdrop } from "@/components/WeatherBackdrop";
import type { CapsuleShape } from "@/lib/capsuleStyle";

export function WeatherScene({
  shape,
  className,
  soft = false,
}: {
  shape: CapsuleShape;
  className?: string;
  soft?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <WeatherBackdrop shape={shape} soft={soft} />
    </div>
  );
}
