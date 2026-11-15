import Link from "next/link";
import { Coffee } from "lucide-react";
import CoffeeBeanPattern from "./CoffeeBeanPattern";

/** Halaman error ramah pengguna (403, 404, 419, 500). Tidak pernah menampilkan detail teknis. */
export default function ErrorPage({
  kode,
  judul,
  pesan,
  aksi,
}: {
  kode: string;
  judul: string;
  pesan: string;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4">
      <CoffeeBeanPattern className="text-espresso" opacity={0.05} />
      <div className="relative w-full max-w-md animate-fade-in-up rounded-card border border-border bg-surface px-8 py-10 text-center shadow-warm-lg">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-blob bg-bistro-gradient shadow-warm">
          <Coffee className="h-6 w-6 text-cream" />
        </span>
        <p className="bg-espresso-gradient bg-clip-text text-6xl font-extrabold text-transparent">{kode}</p>
        <h1 className="mt-2 text-lg font-semibold text-ink">{judul}</h1>
        <p className="mb-6 mt-2 text-sm leading-relaxed text-muted">{pesan}</p>
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
          {aksi}
          <Link
            href="/"
            className="inline-block rounded-lg bg-espresso-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-warm transition-transform hover:-translate-y-0.5"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
