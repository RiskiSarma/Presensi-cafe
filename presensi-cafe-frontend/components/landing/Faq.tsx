"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Reveal from "./Reveal";

const faq = [
  { q: "Apakah pegawai harus punya HP?", a: "Tidak harus. Dengan mode kiosk (paket Pro dan Business), cukup satu tablet di cafe. Pegawai menatap kamera dan presensi tercatat tanpa login." },
  { q: "Bagaimana mencegah titip absen?", a: "Setiap absen mencocokkan wajah dengan data wajah pegawai yang didaftarkan, dan memeriksa lokasi sesuai radius cabang. Absen oleh orang lain atau dari luar area akan ditolak." },
  { q: "Apa yang terjadi setelah uji coba 14 hari habis?", a: "Akun dinonaktifkan: pegawai tidak bisa presensi sampai Anda berlangganan. Data tetap tersimpan, dan begitu langganan aktif semuanya bisa dipakai lagi." },
  { q: "Apakah perlu kartu kredit untuk uji coba?", a: "Tidak. Daftar cukup dengan email, lalu pakai gratis 14 hari." },
  { q: "Bagaimana cara membayar?", a: "Lewat menu Langganan di dalam aplikasi: QRIS, e-wallet, atau Virtual Account (diproses Midtrans), atau transfer bank manual dengan unggah bukti." },
  { q: "Bisa ganti paket atau menambah cabang nanti?", a: "Bisa. Anda dapat pindah ke paket yang lebih besar kapan saja dari menu Langganan. Jumlah cabang dan pegawai aktif mengikuti batas paket." },
  { q: "Saya lupa password, bagaimana?", a: "Di halaman Masuk klik Lupa password, masukkan email terdaftar, lalu buka link yang kami kirim ke email Anda untuk membuat password baru." },
];

export default function Faq() {
  const [buka, setBuka] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <Reveal className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-espresso-dark">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">Pertanyaan yang sering muncul</h2>
        </Reveal>

        <div className="space-y-3">
          {faq.map((f, i) => {
            const terbuka = buka === i;
            return (
              <Reveal key={f.q} delay={i * 40}>
                <div className={`overflow-hidden rounded-card border bg-surface transition-colors ${terbuka ? "border-forest/40 shadow-warm" : "border-border"}`}>
                  <button
                    onClick={() => setBuka(terbuka ? null : i)}
                    aria-expanded={terbuka}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-medium text-ink">{f.q}</span>
                    <Plus className={`h-5 w-5 shrink-0 text-espresso-dark transition-transform duration-300 ${terbuka ? "rotate-45" : ""}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ${terbuka ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
