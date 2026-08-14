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
