"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { useAuth } from "@/components/AuthProvider";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { KeywordChips } from "@/components/KeywordChips";
import { NowWeather } from "@/components/NowWeather";
import { WeatherScene } from "@/components/WeatherScene";
import { normalizeMood, type CapsuleMood, type CapsuleShape } from "@/lib/capsuleStyle";
import { fetchLiveWeather, getCurrentCoords, type LiveWeather } from "@/lib/liveWeather";
import { supabase } from "@/lib/supabase";

const BUCKET = "capsule-jus";
const DRAFT_KEY = "capsule-me-pending-bury";

type Preview = {
  file: File;
  url: string;
};

type Prepared = {
  weather: LiveWeather;
  mood: CapsuleMood;
};

type Draft = {
  to: string;
  letter: string;
  openAt: string;
  prepared: Prepared | null;
  pendingBury: boolean;
};

export default function NewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [to, setTo] = useState("");
  const [letter, setLetter] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const pendingBuryRef = useRef(false);
  const buryingRef = useRef(false);

  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setTo(draft.to);
      setLetter(draft.letter);
      setOpenAt(draft.openAt);
      setPrepared(draft.prepared);
      pendingBuryRef.current = draft.pendingBury;
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  useEffect(() => {
    if (!draftReady || loading || !user || !pendingBuryRef.current) return;
    pendingBuryRef.current = false;
    clearDraft();
    void buryCapsule(user);
    // buryCapsule reads latest form state from this render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftReady, loading, user]);

  function markDirty() {
    setSuccess(false);
    setPrepared(null);
  }

  function handlePhotosChange(files: FileList | null) {
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    const next = Array.from(files ?? []).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(next);
    markDirty();
  }

  async function prepareCapsule() {
    const coords = await getCurrentCoords();
    const weather = await fetchLiveWeather(coords.lat, coords.lng);
    const generated = await fetchMood(letter, to, weather);
    const mood = normalizeMood(
      generated
        ? {
            ...generated,
            shape: generated.shape as CapsuleShape,
          }
        : null,
      weather.sky,
      weather.temperature,
    );
    const next = { weather, mood };
    setPrepared(next);
    return next;
  }

  async function buryCapsule(owner: User, ready?: Prepared) {
    if (buryingRef.current) return;
    buryingRef.current = true;
    pendingBuryRef.current = false;
    const snapshot = ready ?? prepared ?? (await prepareCapsule());
    setSuccess(false);
    setSubmitting(true);
    try {
      const timestamp = Date.now();
      const photos: { storage_path: string; public_url: string; sort_order: number }[] =
        [];

      for (let i = 0; i < previews.length; i += 1) {
        const file = previews[i].file;
        const ext = getExtension(file);
        const storage_path = `${owner.uid}_${timestamp}_${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storage_path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(storage_path);
        photos.push({
          storage_path,
          public_url: data.publicUrl,
          sort_order: i,
        });
      }

      const { data: capsule, error: capsuleError } = await supabase
        .from("capsules")
        .insert({
          firebase_uid: owner.uid,
          recipient: to,
          letter,
          open_at: openAt ? new Date(openAt).toISOString() : null,
          weather_sky: snapshot.weather.sky,
          weather_temp: snapshot.weather.temperature,
          weather_humidity: snapshot.weather.humidity,
          mood_line: snapshot.mood.line,
          keywords: snapshot.mood.keywords,
          capsule_shape: snapshot.mood.shape,
          capsule_color: snapshot.mood.color,
        })
        .select("id")
        .single();

      if (capsuleError || !capsule) {
        throw capsuleError ?? new Error("캡슐 저장에 실패했습니다.");
      }

      if (photos.length > 0) {
        const { error: photoError } = await supabase.from("capsule_photos").insert(
          photos.map((photo) => ({
            capsule_id: capsule.id,
            storage_path: photo.storage_path,
            public_url: photo.public_url,
            sort_order: photo.sort_order,
          })),
        );

        if (photoError) {
          throw photoError;
        }
      }

      clearDraft();
      setSuccess(true);
      window.setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (error) {
      console.error(error);
      alert("캡슐을 묻지 못했습니다.");
      buryingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  function queueBury() {
    pendingBuryRef.current = true;
    writeDraft({
      to,
      letter,
      openAt,
      prepared,
      pendingBury: true,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (user) {
      await buryCapsule(user);
      return;
    }

    setSubmitting(true);
    try {
      await prepareCapsule();
    } catch (error) {
      console.error(error);
      alert("캡슐을 만들지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <main className="w-full max-w-md rounded-3xl border border-rose-100/80 bg-white/80 px-8 py-10 shadow-xl shadow-rose-100/60 backdrop-blur-sm">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-stone-800">
          {user ? "캡슐 묻기" : "캡슐 만들어보기"}
        </h1>
        {user ? null : (
          <p className="mt-3 text-center text-sm text-stone-500">
            먼저 캡슐을 만들어 보고, 묻을 때만 로그인하면 돼요
          </p>
        )}
        <div className="mt-6">
          <NowWeather compact hint="묻는 순간의 날씨와 위치가 함께 저장돼요" />
        </div>
        <form
          className="mt-8 flex flex-col gap-5"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label className="flex flex-col gap-2 text-sm text-stone-600">
            받는사람
            <input
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                markDirty();
              }}
              disabled={submitting}
              className="rounded-2xl border border-rose-100 bg-white px-4 py-3 text-stone-800 outline-none focus:border-stone-400 disabled:opacity-60"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-600">
            편지
            <textarea
              value={letter}
              onChange={(event) => {
                setLetter(event.target.value);
                markDirty();
              }}
              rows={6}
              disabled={submitting}
              className="resize-none rounded-2xl border border-rose-100 bg-white px-4 py-3 text-stone-800 outline-none focus:border-stone-400 disabled:opacity-60"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-600">
            열람일
            <input
              type="datetime-local"
              value={openAt}
              onChange={(event) => {
                setOpenAt(event.target.value);
                markDirty();
              }}
              disabled={submitting}
              className="rounded-2xl border border-rose-100 bg-white px-4 py-3 text-stone-800 outline-none focus:border-stone-400 disabled:opacity-60"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-600">
            사진
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={submitting}
              onChange={(event) => handlePhotosChange(event.target.files)}
              className="text-stone-500 file:mr-3 file:rounded-full file:border-0 file:bg-stone-800 file:px-4 file:py-2 file:text-sm file:text-white disabled:opacity-60"
            />
          </label>
          {previews.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {previews.map((item) => (
                <img
                  key={item.url}
                  src={item.url}
                  alt=""
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ))}
            </div>
          ) : null}

          {prepared ? (
            <CapsulePreview mood={prepared.mood} guest={!user} />
          ) : (
            <p className="text-center text-xs text-stone-400">
              위에 보이는 지금 날씨로 그날의 한마디와 키워드가 붙어요
            </p>
          )}

          {user || !prepared ? (
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="mt-2 rounded-full bg-stone-800 px-7 py-3 text-sm font-medium text-white shadow-md shadow-stone-300 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? user
                  ? "묻는 중..."
                  : "만드는 중..."
                : user
                  ? "캡슐묻기"
                  : "미리 만들어보기"}
            </button>
          ) : (
            <div className="mt-2 flex flex-col items-center gap-3">
              <p className="text-center text-sm text-stone-500">
                이 캡슐을 땅에 묻으려면 로그인이 필요해요
              </p>
              <GoogleLoginButton
                className="rounded-full bg-stone-800 px-7 py-3 text-sm font-medium text-white shadow-md shadow-stone-300 transition hover:bg-stone-700 disabled:opacity-60"
                onBeforeSignIn={queueBury}
                onSuccess={(signedIn) => {
                  if (signedIn) {
                    void buryCapsule(signedIn);
                  }
                }}
                onError={() => {
                  pendingBuryRef.current = false;
                  writeDraft({
                    to,
                    letter,
                    openAt,
                    prepared,
                    pendingBury: false,
                  });
                }}
              >
                Google로 묻고 저장하기
              </GoogleLoginButton>
              <button
                type="button"
                onClick={markDirty}
                className="text-xs text-stone-400 underline-offset-4 hover:text-stone-600 hover:underline"
              >
                다시 만들기
              </button>
            </div>
          )}
          {success ? (
            <p className="text-center text-sm font-medium text-emerald-700">
              캡슐을 성공적으로 묻었어요
            </p>
          ) : null}
        </form>
      </main>
    </div>
  );
}

function CapsulePreview({ mood, guest }: { mood: CapsuleMood; guest: boolean }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/50 text-center shadow-md shadow-rose-100/40">
      <WeatherScene
        shape={mood.shape}
        className="h-28"
      />
      <div className="bg-white/90 px-5 py-4">
        {guest ? (
          <p className="text-xs font-medium tracking-wide text-rose-400">미리보기</p>
        ) : null}
        <p className="mt-2 text-sm leading-6 text-stone-600">{mood.line}</p>
        <KeywordChips keywords={mood.keywords} className="mt-3 justify-center" />
      </div>
    </div>
  );
}

function getExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName !== file.name.toLowerCase()) {
    return fromName;
  }
  return file.type.split("/")[1] || "bin";
}

async function fetchMood(
  letter: string,
  recipient: string,
  weather: {
    sky: string | null;
    temperature: number | null;
    humidity: number | null;
  },
) {
  try {
    const res = await fetch("/api/capsule-mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter, recipient, weather }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      line: string;
      keywords: string[];
      shape: string;
      color: string;
    };
  } catch {
    return null;
  }
}

function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}
