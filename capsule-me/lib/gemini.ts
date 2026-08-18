import { GoogleGenAI } from "@google/genai";
import {
  normalizeMood,
  type CapsuleMood,
  type CapsuleShape,
} from "@/lib/capsuleStyle";
import type { WeatherSnapshot } from "@/lib/kma";

const MODELS = ["gemini-3.5-flash", "gemini-2.5-flash"];

const schema = {
  type: "object",
  properties: {
    line: {
      type: "string",
      description: "날씨만 담은 한국어 한 줄. 편지 내용을 인용하지 말 것.",
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "편지를 스포일러 없이 암시하는 한국어 단어 3~5개",
    },
    shape: {
      type: "string",
      enum: ["sun", "cloud", "rain", "snow", "fog", "storm", "heat"],
    },
    color: {
      type: "string",
      description: "HEX 색상. 예: #6A93C4",
    },
  },
  required: ["line", "keywords", "shape", "color"],
};

export async function generateCapsuleMood(input: {
  letter: string;
  recipient: string;
  weather: WeatherSnapshot;
}): Promise<CapsuleMood> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return normalizeMood(null, input.weather.sky, input.weather.temperature);
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `너는 타임캡슐 디자이너다.
날씨에 맞는 캡슐 형태/색과, 봉인된 상태에서도 볼 수 있는 힌트용 키워드를 만든다.

날씨: ${input.weather.sky ?? "알 수 없음"}
기온: ${input.weather.temperature ?? "-"}℃
습도: ${input.weather.humidity ?? "-"}%
받는사람: ${input.recipient || "없음"}
편지:
${input.letter || "(내용 없음)"}

규칙:
- line: 그날 날씨 분위기의 한국어 한 문장. 편지 문장을 그대로 쓰지 말 것.
- keywords: 편지의 감정이나 장면을 스포일러 없이 암시하는 단어 3~5개. 직접 인용 금지.
- shape: 날씨에 맞는 sun, cloud, rain, snow, fog, storm, heat 중 하나.
- color: 그 날씨에 어울리는 HEX.`;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
        },
      });
      const parsed = parseJson(response.text) as Partial<CapsuleMood>;
      return normalizeMood(
        {
          ...parsed,
          shape: parsed.shape as CapsuleShape,
        },
        input.weather.sky,
        input.weather.temperature,
      );
    } catch (error) {
      console.error(error);
    }
  }

  return normalizeMood(null, input.weather.sky, input.weather.temperature);
}

function parseJson(text: string | undefined) {
  if (!text) return {};
  const trimmed = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(trimmed) as unknown;
}
