"use client";

import { useEffect, useRef, ReactNode } from "react";

/**
 * Pembungkus modal: gelap di belakang, bisa di-scroll kalau isinya tinggi (tidak terpotong),
 * dan tertutup kalau klik area gelap di luar kotak modal atau tekan Esc.
 */
export default function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const mulaiDiLuar = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 animate-fade-in overflow-y-auto bg-ink/40">
      <div
        className="flex min-h-full items-center justify-center px-4 py-6"
        onMouseDown={(e) => {
          mulaiDiLuar.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          // Hanya tutup kalau tekan dan lepas klik sama-sama di area luar (bukan drag dari dalam kotak)
          if (mulaiDiLuar.current && e.target === e.currentTarget) onClose();
        }}
      >
        {children}
      </div>
    </div>
  );
}
