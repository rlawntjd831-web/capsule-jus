"use client";

import { getAnalytics, isSupported } from "firebase/analytics";
import { useEffect } from "react";
import { app } from "@/lib/firebase";

export function FirebaseAnalytics() {
  useEffect(() => {
    void isSupported().then((supported) => {
      if (supported) {
        getAnalytics(app);
      }
    });
  }, []);

  return null;
}
