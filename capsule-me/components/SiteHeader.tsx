"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";
import { getAuthErrorCode, signInWithGoogle } from "@/lib/googleSignIn";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setError("");
    setPending(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-rose-100/80 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-stone-800">
          캡슐 미
        </Link>
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-stone-400">확인 중...</span>
          ) : user ? (
            <>
              <span className="hidden text-sm text-stone-500 sm:inline">
                {user.displayName ?? user.email}
              </span>
              <Link
                href="/new"
                className="rounded-full bg-stone-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
              >
                캡슐 묻기
              </Link>
              <button
                type="button"
                onClick={() => void signOut(auth)}
                className="text-sm text-stone-400 underline-offset-4 hover:text-stone-600 hover:underline"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={pending}
              className="rounded-full bg-stone-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-60"
            >
              {pending ? "로그인 중..." : "Google로 시작하기"}
            </button>
          )}
        </div>
      </div>
      {error ? (
        <p className="px-6 pb-3 text-center text-sm text-rose-500">{error}</p>
      ) : null}
    </header>
  );
}

function getAuthErrorMessage(err: unknown) {
  const code = getAuthErrorCode(err);
  if (code === "auth/operation-not-allowed") {
    return "콘솔에서 Google 로그인을 아직 켜지 않았습니다.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "로그인 창이 닫혔습니다. 다시 시도해 주세요.";
  }
  if (code === "auth/unauthorized-domain") {
    return "이 도메인은 아직 승인되지 않았습니다.";
  }
  return "로그인에 실패했습니다. 다시 시도해 주세요.";
}
