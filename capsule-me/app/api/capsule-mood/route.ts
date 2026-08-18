import { NextRequest, NextResponse } from "next/server";
import { generateCapsuleMood } from "@/lib/gemini";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    letter?: string;
    recipient?: string;
    weather?: {
      sky: string | null;
      temperature: number | null;
      humidity: number | null;
    };
  };

  const mood = await generateCapsuleMood({
    letter: body.letter ?? "",
    recipient: body.recipient ?? "",
    weather: body.weather ?? {
      sky: null,
      temperature: null,
      humidity: null,
    },
  });

  return NextResponse.json(mood);
}
