"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { formatOpenAt, type Capsule } from "@/lib/capsules";
import { supabase } from "@/lib/supabase";

const isDev = process.env.NODE_ENV === "development";

export default function CapsulePage() {
  const params = useParams<{ id: string }>();
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [forcePreview, setForcePreview] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("capsules")
        .select(
          "id, recipient, letter, open_at, created_at, firebase_uid, capsule_photos(id, public_url, storage_path, sort_order)",
        )
        .eq("id", params.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setCapsule(null);
        setLoading(false);
        return;
      }
      setCapsule(data as Capsule | null);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-16 text-sm text-stone-400">
        불러오는 중...
      </main>
    );
  }

  if (!capsule) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 text-center">
        <p className="text-stone-600">캡슐을 찾지 못했어요</p>
        <Link href="/" className="mt-6 inline-block text-sm text-stone-400 hover:underline">
          대시보드로
        </Link>
      </main>
    );
  }

  const naturallyOpen =
    !capsule.open_at || now >= new Date(capsule.open_at).getTime();
  const open = naturallyOpen || forcePreview;
  const photos = [...capsule.capsule_photos].sort((a, b) => a.sort_order - b.sort_order);
  const title = capsule.recipient ? `${capsule.recipient}에게` : "이름 없는 캡슐";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/"
        className="text-sm text-stone-400 transition hover:text-stone-600 hover:underline"
      >
        ← 대시보드
      </Link>

      {open ? (
        <OpenedCapsule
          title={title}
          letter={capsule.letter}
          openAt={capsule.open_at}
          photos={photos}
          previewed={forcePreview && !naturallyOpen}
        />
      ) : (
        <LockedCapsule
          title={title}
          openAt={capsule.open_at}
          onPreview={() => setForcePreview(true)}
        />
      )}
    </main>
  );
}

function LockedCapsule({
  title,
  openAt,
  onPreview,
}: {
  title: string;
  openAt: string | null;
  onPreview: () => void;
}) {
  return (
    <article className="relative mt-6 overflow-hidden rounded-[2rem] border border-rose-100/80 bg-white/80 px-6 py-16 text-center shadow-xl shadow-rose-100/50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_55%)]" />
      <div className="relative">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-rose-200 bg-linear-to-b from-rose-50 to-amber-50 text-2xl text-rose-300 shadow-inner">
          ✧
        </div>
        <p className="mt-8 text-sm font-medium tracking-wide text-rose-400">
          아직 기간이 남았어요
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-800">
          {title}
        </h1>
        <p className="mt-3 text-sm text-stone-400">{formatOpenAt(openAt)}</p>
        <div className="mx-auto mt-10 max-w-sm rounded-3xl border border-rose-100 bg-white/70 px-6 py-5">
          <p className="text-xs tracking-[0.2em] text-stone-400">REMAINING</p>
          <Countdown
            openAt={openAt}
            className="mt-2 block text-2xl font-medium text-rose-400"
          />
        </div>
        <p className="mt-6 text-sm leading-relaxed text-stone-400">
          열람일이 되어야 편지와 사진을 열어볼 수 있어요
        </p>
        {isDev ? (
          <button
            type="button"
            onClick={onPreview}
            className="mt-10 text-[11px] text-stone-300/70 transition hover:text-stone-400"
          >
            바로보기
          </button>
        ) : null}
      </div>
    </article>
  );
}

function OpenedCapsule({
  title,
  letter,
  openAt,
  photos,
  previewed,
}: {
  title: string;
  letter: string;
  openAt: string | null;
  photos: Capsule["capsule_photos"];
  previewed: boolean;
}) {
  return (
    <article className="mt-6 overflow-hidden rounded-[2rem] border border-rose-100/80 bg-white/85 shadow-xl shadow-rose-100/50">
      {photos[0] ? (
        <img
          src={photos[0].public_url}
          alt=""
          className="h-56 w-full object-cover sm:h-72"
        />
      ) : (
        <div className="h-40 bg-linear-to-br from-rose-100 via-amber-50 to-stone-100" />
      )}
      <div className="px-6 py-8 sm:px-8">
        {previewed ? (
          <p className="text-xs text-stone-300">개발 모드 바로보기</p>
        ) : (
          <p className="text-sm font-medium text-emerald-700">열람 가능</p>
        )}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-800">
          {title}
        </h1>
        <p className="mt-2 text-sm text-stone-400">{formatOpenAt(openAt)}</p>
        <div className="mt-8 rounded-3xl bg-linear-to-b from-amber-50/80 to-white px-5 py-6">
          {letter ? (
            <p className="whitespace-pre-wrap text-base leading-8 text-stone-700">
              {letter}
            </p>
          ) : (
            <p className="text-sm text-stone-400">편지가 없어요</p>
          )}
        </div>
        {photos.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <img
                key={photo.id}
                src={photo.public_url}
                alt=""
                className="aspect-square w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
