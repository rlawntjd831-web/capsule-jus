"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { WeatherScene } from "@/components/WeatherScene";
import { fetchCapsuleCount } from "@/lib/capsules";

export function LandingPage() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await fetchCapsuleCount();
        if (!cancelled) setCount(next);
      } catch {
        if (!cancelled) setCount(0);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full overflow-hidden rounded-[2rem] border border-white/50 shadow-lg shadow-rose-100/40">
        <WeatherScene
          shape="sun"
          className="h-36"
        />
      </div>

      <p className="mt-8 text-sm font-medium tracking-wide text-rose-400">
        캡슐 미
      </p>
      <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-stone-800 sm:text-4xl">
        오늘의 마음을
        <br />
        캡슐에 담아 보세요
      </h1>
      <p className="mt-4 text-center text-sm leading-6 text-stone-500">
        로그인 없이 먼저 만들어 볼 수 있어요.
        <br />
        땅에 묻을 때만 Google 로그인이 필요해요.
      </p>

      <section className="mt-10 w-full rounded-[2rem] border border-rose-100/80 bg-white/80 px-8 py-8 text-center shadow-xl shadow-rose-100/50">
        <p className="text-xs tracking-[0.22em] text-stone-400">BURIED SO FAR</p>
        {count == null ? (
          <div className="mx-auto mt-4 h-14 w-28 animate-pulse rounded-2xl bg-stone-100" />
        ) : (
          <p className="mt-3 text-6xl font-semibold tracking-tight text-stone-800">
            {count.toLocaleString("ko-KR")}
          </p>
        )}
        <p className="mt-3 text-sm text-stone-500">지금까지 묻힌 캡슐</p>
      </section>

      <Link
        href="/new"
        className="mt-8 inline-flex rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium text-white shadow-md shadow-stone-300 transition hover:bg-stone-700"
      >
        캡슐 만들어보기
      </Link>

      <div className="mt-6">
        <GoogleLoginButton className="text-sm text-stone-400 underline-offset-4 hover:text-stone-600 hover:underline disabled:opacity-60">
          이미 묻은 캡슐이 있다면 로그인
        </GoogleLoginButton>
      </div>
    </main>
  );
}
