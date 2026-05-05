"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.error("SW registration failed:", err);
      });

    // Listener per i messaggi dal SW (es. notification click)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "navigate" && event.data?.url) {
        window.location.href = event.data.url;
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}
