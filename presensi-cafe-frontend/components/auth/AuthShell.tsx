import Link from "next/link";
import { Coffee, Sparkles, Leaf, ArrowLeft } from "lucide-react";
import CoffeeBeanPattern from "@/components/ui/CoffeeBeanPattern";
import OrganicBlob from "@/components/ui/OrganicBlob";

/** Kerangka halaman autentikasi (daftar, lupa & reset password). Tampilannya disamakan dengan halaman login. */
export default function AuthShell({
  judul,
  subjudul,
  children,
  lebar = "max-w-sm",
}: {
  judul: string;
  subjudul: string;
  children: React.ReactNode;
  lebar?: string;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <div className="relative hidden h-full w-1/2 items-center justify-center overflow-hidden bg-bistro-gradient lg:flex">
        <CoffeeBeanPattern className="text-cream" opacity={0.1} />
        <OrganicBlob className="absolute -left-20 -top-24 h-72 w-72 bg-latte/25 blur-3xl" />
        <OrganicBlob className="absolute -bottom-28 -right-16 h-96 w-96 bg-forest-light/20 blur-3xl" />
        <OrganicBlob className="absolute right-16 top-1/3 h-24 w-24 bg-cream/15" />

        <div className="relative z-10 flex max-w-sm flex-col items-start gap-5 px-10 text-cream">
          <Link href="/" className="flex h-14 w-14 items-center justify-center rounded-blob bg-cream/15 backdrop-blur" aria-label="Ke beranda">
            <Coffee className="h-7 w-7" />
          </Link>
          <h1 className="text-3xl font-semibold leading-tight">
            Presensi hangat,<br />secepat pesanan.
          </h1>
          <p className="text-sm leading-relaxed text-cream/75">
            Kelola kehadiran, shift, dan tim cafe & resto kamu dengan pengenalan wajah — tanpa kertas, tanpa ribet.
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-full bg-cream/15 px-4 py-2 text-xs text-cream/85 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Uji coba gratis 14 hari
          </div>
          <div className="flex items-center gap-2 text-xs text-cream/60">
            <Leaf className="h-3.5 w-3.5" />
            Dibuat untuk bisnis F&B yang gesit
          </div>
        </div>
      </div>

      <div className="relative h-full w-full flex-1 overflow-y-auto lg:w-1/2">
        <CoffeeBeanPattern className="text-espresso lg:hidden" opacity={0.04} />
        <Link
          href="/"
          className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Beranda
        </Link>
        <div className="relative flex min-h-full items-center justify-center px-4 py-14">
        <div className={`relative w-full ${lebar} animate-fade-in-up`}>
          <Link href="/" className="mb-8 flex flex-col items-center gap-2 text-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-blob bg-bistro-gradient shadow-warm">
              <Coffee className="h-6 w-6 text-cream" />
            </div>
            <span className="text-xl font-semibold text-ink">Presensi Cafe</span>
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-ink">{judul}</h2>
            <p className="mt-1 text-sm text-muted">{subjudul}</p>
          </div>

          {children}
        </div>
        </div>
      </div>
    </div>
  );
}
