import Link from "next/link";
import { Coffee, ArrowRight, MessageCircle } from "lucide-react";
import CoffeeBeanPattern from "@/components/ui/CoffeeBeanPattern";
import OrganicBlob from "@/components/ui/OrganicBlob";
import Reveal from "./Reveal";

// Nomor WhatsApp admin (format internasional tanpa + atau spasi, contoh 6281234567890).
// Isi lewat NEXT_PUBLIC_WHATSAPP_NUMBER di .env.local frontend.
const NOMOR_WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const PESAN_WA = "Halo, saya tertarik dengan Presensi Cafe dan ingin bertanya lebih lanjut.";
const LINK_WA = `https://wa.me/${6281269334494}?text=${encodeURIComponent(PESAN_WA)}`;

export function Cta() {
  return (
    <section className="bg-paper px-4 pb-20 md:px-6 md:pb-28">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-bistro-gradient px-6 py-14 text-center text-cream shadow-warm-lg md:py-20">
          <CoffeeBeanPattern className="text-cream" opacity={0.1} />
          <OrganicBlob className="absolute -left-16 -top-16 h-56 w-56 bg-latte/30 blur-2xl" />
          <OrganicBlob className="absolute -bottom-20 -right-10 h-64 w-64 bg-forest-dark/40 blur-2xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-3xl font-semibold leading-tight md:text-4xl">Siap tutup buku rekap absen manual?</h2>
            <p className="mx-auto mt-3 max-w-md text-cream/80">Coba gratis 14 hari. Daftar dalam semenit, tanpa kartu kredit.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-cream px-7 py-3.5 text-sm font-semibold text-forest-dark shadow-warm-lg transition-transform hover:-translate-y-0.5"
              >
                Mulai Gratis Sekarang
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href={LINK_WA}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-cream/40 bg-cream/10 px-7 py-3.5 text-sm font-semibold text-cream backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-cream/20"
              >
                <MessageCircle className="h-4 w-4" />
                Hubungi Kami (WhatsApp)
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:flex-row md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-blob bg-bistro-gradient">
            <Coffee className="h-4 w-4 text-cream" />
          </span>
          <span className="font-semibold text-ink">Presensi Cafe</span>
        </Link>
        {/* <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <a href="#fitur" className="hover:text-ink">Fitur</a>
          <a href="#harga" className="hover:text-ink">Harga</a>
          <a href="#panduan" className="hover:text-ink">Panduan</a>
          <Link href="/login" className="hover:text-ink">Masuk</Link>
          <Link href="/register" className="hover:text-ink">Daftar</Link>
        </nav> */}
        <p>© {new Date().getFullYear()} Presensi Cafe a product by KaryaLokal</p>
      </div>
    </footer>
  );
}