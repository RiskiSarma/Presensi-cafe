"use client";

import ErrorPage from "@/components/ui/ErrorPage";

// Error tak terduga di halaman. Detail error sengaja TIDAK ditampilkan ke pengguna.
export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorPage
      kode="500"
      judul="Ada yang tidak beres di sisi kami"
      pesan="Halaman ini gagal dimuat. Coba lagi, atau kembali ke beranda."
      aksi={
        <button
          onClick={reset}
          className="inline-block rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper"
        >
          Coba lagi
        </button>
      }
    />
  );
}
