"use client";

import { useEffect } from "react";

/** Mendaftarkan service worker (hanya di production) supaya aplikasi bisa dipasang di layar utama. */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  return null;
}
