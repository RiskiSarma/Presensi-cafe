"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Tombol "Pasang" yang hanya muncul kalau browser mengizinkan instalasi (Android/Chrome/Edge). */
export default function PasangAplikasi({ className = "" }: { className?: string }) {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event) return null;

  return (
    <button
      onClick={async () => {
        await event.prompt();
        await event.userChoice;
        setEvent(null);
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border border-espresso/40 bg-espresso-soft px-3 py-1.5 text-xs font-medium text-espresso-dark transition-colors hover:bg-espresso-soft/70 ${className}`}
    >
      <Download className="h-3.5 w-3.5" />
      Pasang aplikasi
    </button>
  );
}
