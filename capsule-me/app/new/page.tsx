"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

const BUCKET = "capsule-jus";

type Preview = {
  file: File;
  url: string;
};

export default function NewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [to, setTo] = useState("");
  const [letter, setLetter] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  function handlePhotosChange(files: FileList | null) {
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    const next = Array.from(files ?? []).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(next);
    setSuccess(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      alert("로그인 먼저!");
      return;
    }

    setSuccess(false);
    setSubmitting(true);
    try {
      const timestamp = Date.now();
      const photos: { storage_path: string; public_url: string; sort_order: number }[] =
        [];

      for (let i = 0; i < previews.length; i += 1) {
        const file = previews[i].file;
        const ext = getExtension(file);
        const storage_path = `${user.uid}_${timestamp}_${i}.${ext}`;

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
          firebase_uid: user.uid,
          recipient: to,
          letter,
          open_at: openAt ? new Date(openAt).toISOString() : null,
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

      setSuccess(true);
      window.setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (error) {
      console.error(error);
      alert("캡슐을 묻지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <main className="w-full max-w-md rounded-3xl border border-rose-100/80 bg-white/80 px-8 py-10 shadow-xl shadow-rose-100/60 backdrop-blur-sm">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-stone-800">
          캡슐 묻기
        </h1>
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
                setSuccess(false);
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
                setSuccess(false);
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
                setSuccess(false);
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
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="mt-2 rounded-full bg-stone-800 px-7 py-3 text-sm font-medium text-white shadow-md shadow-stone-300 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "묻는 중..." : "캡슐묻기"}
          </button>
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

function getExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName !== file.name.toLowerCase()) {
    return fromName;
  }
  return file.type.split("/")[1] || "bin";
}
