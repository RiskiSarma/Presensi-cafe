import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Timer, Sparkles } from "lucide-react";
import CoffeeBeanPattern from "@/components/ui/CoffeeBeanPattern";
import OrganicBlob from "@/components/ui/OrganicBlob";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream-gradient pt-28 md:pt-32">
      <CoffeeBeanPattern className="text-forest" opacity={0.05} />
      <OrganicBlob className="absolute -left-24 top-24 h-80 w-80 bg-latte/50 blur-3xl" />
      <OrganicBlob className="absolute -right-20 top-10 h-96 w-96 bg-forest-light/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-espresso/30 bg-espresso-soft px-3.5 py-1.5 text-xs font-medium text-espresso-dark">
            <Sparkles className="h-3.5 w-3.5" />
            Uji coba gratis 14 hari, tanpa kartu kredit
          </span>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] text-ink md:text-6xl">
            Presensi cafe,
            <br />
            cukup <span className="relative whitespace-nowrap text-forest">
              tatap kamera
              <svg className="absolute -bottom-2 left-0 w-full text-espresso" viewBox="0 0 220 12" fill="none" preserveAspectRatio="none" aria-hidden>
                <path d="M2 8c40-7 90-8 130-4s60 3 86-1" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
            .
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            Catat kehadiran barista, kasir, dan tim dapur dengan pengenalan wajah dan lokasi cabang. Tanpa kartu, tanpa titip absen, tanpa rekap manual di akhir bulan.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-espresso-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-warm-lg transition-transform hover:-translate-y-0.5"
            >
              Coba Gratis 14 Hari
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#harga"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-forest/40"
            >
              Lihat Harga
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {["Pengenalan wajah", "Verifikasi lokasi cabang", "Mode kiosk tablet", "Lembur otomatis"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-success" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

/** Ilustrasi HP sedang memindai wajah, dibuat murni dengan CSS/SVG supaya ringan. */
function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md animate-scale-in" aria-hidden>
      <div className="absolute inset-6 rounded-[3rem] bg-bistro-gradient opacity-25 blur-2xl" />

      {/* HP */}
      <div className="relative mx-auto w-64 rounded-[2.4rem] border-[7px] border-forest-dark bg-forest-dark p-1.5 shadow-warm-lg animate-float md:w-72">
        <div className="relative overflow-hidden rounded-[1.9rem] bg-forest-gradient">
          <div className="mx-auto mt-2 h-4 w-20 rounded-full bg-forest-dark" />

          <div className="px-4 pb-5 pt-3 text-cream">
            <p className="text-center text-xs text-cream/60">Absen Masuk · Cabang Utama</p>

            <div className="relative mx-auto mt-3 flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl bg-kiosk-surface">
              {/* siluet wajah */}
              <svg viewBox="0 0 120 160" className="h-4/5 text-latte/80" fill="none">
                <circle cx="60" cy="58" r="30" stroke="currentColor" strokeWidth="2.5" />
                <path d="M14 152c4-30 24-44 46-44s42 14 46 44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="49" cy="54" r="2.6" fill="currentColor" />
                <circle cx="71" cy="54" r="2.6" fill="currentColor" />
                <path d="M50 70c5 5 15 5 20 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>

              {/* sudut pemindai */}
              {[
                "left-3 top-3 border-l-2 border-t-2 rounded-tl-lg",
                "right-3 top-3 border-r-2 border-t-2 rounded-tr-lg",
                "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg",
                "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg",
              ].map((c) => (
                <span key={c} className={`absolute h-7 w-7 border-espresso-light ${c}`} />
              ))}

              {/* garis scan */}
              <span className="animate-scan absolute inset-x-4 h-0.5 rounded-full bg-espresso-light shadow-[0_0_14px_3px_rgba(227,190,114,0.7)]" />
            </div>

            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-cream/10 px-3 py-2.5 backdrop-blur">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-success">
                <span className="animate-ring absolute inset-0 rounded-full bg-success/60" />
                <BadgeCheck className="relative h-4 w-4 text-white" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">Rina Putri</p>
                <p className="text-xs text-cream/60">Barista · wajah dikenali</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* kartu melayang */}
      <div className="animate-float-slow absolute -left-2 top-14 w-44 rounded-2xl border border-border bg-surface p-3 shadow-warm-lg md:-left-10">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 text-forest" />
          Lokasi sesuai
        </p>
        <p className="mt-1 text-sm font-semibold text-ink">Dalam radius 40 m</p>
        <p className="text-xs text-success">Check-in 07:58 · tepat waktu</p>
      </div>

      <div className="animate-float absolute -right-2 bottom-24 w-44 rounded-2xl border border-border bg-surface p-3 shadow-warm-lg md:-right-8">
        <p className="text-xs text-muted">Hadir hari ini</p>
        <p className="text-lg font-semibold text-ink">
          12<span className="text-sm font-normal text-muted"> / 14 pegawai</span>
        </p>
        <div className="mt-2 flex h-8 items-end gap-1">
          {[40, 65, 50, 85, 70, 95, 80].map((h, i) => (
            <span key={i} className="flex-1 rounded-sm bg-forest/70" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      <div className="animate-float-slow absolute -bottom-3 left-4 flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 shadow-warm-lg md:left-10">
        <Timer className="h-4 w-4 text-espresso-dark" />
        <span className="text-xs font-medium text-ink">Lembur 45 menit tercatat otomatis</span>
      </div>
    </div>
  );
}
