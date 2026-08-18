"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { auth } from "@/lib/firebase";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const tryingCapsule = pathname === "/new";

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
            <>
              {tryingCapsule ? null : (
                <Link
                  href="/new"
                  className="rounded-full bg-stone-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
                >
                  캡슐 체험하기
                </Link>
              )}
              <GoogleLoginButton className="text-sm text-stone-400 underline-offset-4 hover:text-stone-600 hover:underline disabled:opacity-60">
                로그인
              </GoogleLoginButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
