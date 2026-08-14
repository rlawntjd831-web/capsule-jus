"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";
import {
  formatOpenAt,
  isCapsuleOpen,
  type Capsule,
} from "@/lib/capsules";
import { supabase } from "@/lib/supabase";

export function CapsuleDashboard() {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: fetchError } = await supabase
        .from("capsules")
        .select(
          "id, recipient, letter, open_at, created_at, firebase_uid, capsule_photos(id, public_url, storage_path, sort_order)",
        )
        .order("open_at", { ascending: true, nullsFirst: false });

      if (cancelled) return;

      if (fetchError) {
        setError("캡슐을 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      setCapsules((data ?? []) as Capsule[]);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCount = capsules.filter((capsule) => isCapsuleOpen(capsule.open_at)).length;
  const lockedCount = capsules.length - openCount;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
            묻힌 캡슐
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            열람일까지 기다렸다가, 함께 열어보세요
          </p>
        </div>
        <p className="text-sm text-stone-500">
          전체 {capsules.length} · 잠김 {lockedCount} · 열림 {openCount}
        </p>
      </div>

      {loading ? (
        <p className="mt-16 text-center text-sm text-stone-400">불러오는 중...</p>
      ) : error ? (
        <p className="mt-16 text-center text-sm text-rose-500">{error}</p>
      ) : capsules.length === 0 ? (
        <div className="mt-16 rounded-3xl border border-rose-100/80 bg-white/80 px-8 py-16 text-center shadow-xl shadow-rose-100/40">
          <p className="text-stone-600">아직 묻힌 캡슐이 없어요</p>
          <Link
            href="/new"
            className="mt-6 inline-flex rounded-full bg-stone-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            첫 캡슐 묻기
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {capsules.map((capsule) => {
            const open = isCapsuleOpen(capsule.open_at);
            const photos = [...capsule.capsule_photos].sort(
              (a, b) => a.sort_order - b.sort_order,
            );
            const cover = open ? photos[0]?.public_url : undefined;

            return (
              <li key={capsule.id}>
                <Link
                  href={`/capsule/${capsule.id}`}
                  className="flex h-full flex-col overflow-hidden rounded-3xl border border-rose-100/80 bg-white/80 shadow-lg shadow-rose-100/40 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="relative h-40 bg-linear-to-br from-rose-100 via-amber-50 to-stone-100">
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-stone-400">
                        {open ? "사진 없음" : "봉인됨"}
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-medium ${
                        open
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-800 text-white"
                      }`}
                    >
                      {open ? "열림" : "잠김"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col px-5 py-4">
                    <p className="text-lg font-medium text-stone-800">
                      {capsule.recipient ? `${capsule.recipient}에게` : "이름 없는 캡슐"}
                    </p>
                    <p className="mt-1 text-sm text-stone-400">
                      {formatOpenAt(capsule.open_at)}
                    </p>
                    <Countdown
                      openAt={capsule.open_at}
                      className="mt-3 text-sm font-medium text-rose-400"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
