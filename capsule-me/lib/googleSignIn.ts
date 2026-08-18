import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function isEmbeddedPreview() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export async function signInWithGoogle() {
  const provider = googleProvider();

  if (isEmbeddedPreview()) {
    await signInWithRedirect(auth, provider);
    return;
  }

  try {
    return await signInWithPopup(auth, provider);
  } catch (err) {
    if (getAuthErrorCode(err) === "auth/popup-blocked") {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
}

export function getAuthErrorCode(err: unknown) {
  if (typeof err === "object" && err && "code" in err) {
    return String(err.code);
  }
  return "";
}

export function getAuthErrorMessage(err: unknown) {
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
