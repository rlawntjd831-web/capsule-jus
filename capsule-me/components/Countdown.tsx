"use client";

import { useEffect, useState } from "react";
import { formatCountdown, isCapsuleOpen } from "@/lib/capsules";

export function Countdown({
  openAt,
  className,
}: {
  openAt: string | null;
  className?: string;
}) {
  const [label, setLabel] = useState(() => formatCountdown(openAt));

  useEffect(() => {
    setLabel(formatCountdown(openAt));
    if (isCapsuleOpen(openAt)) return;

    const timer = window.setInterval(() => {
      setLabel(formatCountdown(openAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [openAt]);

  return <span className={className}>{label}</span>;
}
