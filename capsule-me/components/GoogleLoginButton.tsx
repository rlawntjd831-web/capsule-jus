"use client";

import { useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { getAuthErrorMessage, signInWithGoogle } from "@/lib/googleSignIn";

export function GoogleLoginButton({
  children = "Google로 로그인",
  className,
  onBeforeSignIn,
  onSuccess,
  onError,
}: {
  children?: ReactNode;
  className?: string;
  onBeforeSignIn?: () => void;
  onSuccess?: (user?: User) => void;
  onError?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setPending(true);
    try {
      onBeforeSignIn?.();
      const result = await signInWithGoogle();
      onSuccess?.(result?.user);
    } catch (err) {
      onError?.();
      setError(getAuthErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={pending}
        className={className}
      >
        {pending ? "로그인 중..." : children}
      </button>
      {error ? (
        <p className="mt-2 text-center text-sm text-rose-500">{error}</p>
      ) : null}
    </div>
  );
}
