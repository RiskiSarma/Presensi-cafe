"use client";

import { useState } from "react";
import { Store, Smartphone, Tablet, Lightbulb } from "lucide-react";
import Reveal from "./Reveal";

type TabKey = "admin" | "pegawai" | "kiosk";

const tab: { key: TabKey; label: string; sub: string; ikon: typeof Store }[] = [
  { key: "admin", label: "Pemilik / Admin", sub: "Atur cafe & pantau tim", ikon: Store },
  { key: "pegawai", label: "Pegawai", sub: "Absen lewat HP", ikon: Smartphone },
  { key: "kiosk", label: "Mode Kiosk", sub: "Absen lewat tablet cafe", ikon: Tablet },
];

const isi: Record<TabKey, { langkah: { judul: string; teks: string }[]; tips: string }> = {
  admin: {
    langkah: [
      { judul: "Daftar dan masuk", teks: "Klik Coba Gratis, isi nama cafe, email, dan password yang kuat. Uji coba 14 hari langsung aktif dan Anda masuk ke dashboard." },
      { judul: "Atur cabang", teks: "Buka menu Cabang. Isi nama, alamat, titik lokasi (latitude dan longitude), serta radius toleransi dalam meter. Absen hanya sah di dalam radius ini." },
      { judul: "Buat shift dan jadwal", teks: "Di menu Shift & Jadwal, buat shift lebih dulu (misal Pagi 07:00 sampai 15:00), lalu susun jadwal mingguan tiap pegawai." },
      { judul: "Tambah pegawai dan daftarkan wajah", teks: "Di menu Pegawai, tambahkan data pegawai. Lalu klik ikon wajah pada kartunya dan ambil satu foto: wajah menghadap kamera, cahaya cukup." },
      { judul: "Pantau presensi", teks: "Dashboard menampilkan kehadiran hari ini. Menu Laporan Presensi memuat jam masuk, jam pulang, keterlambatan, dan lembur." },
      { judul: "Proses pengajuan izin", teks: "Pengajuan izin, sakit, atau cuti dari pegawai muncul di menu Pengajuan Izin. Setujui atau tolak dengan satu klik." },
      { judul: "Berlangganan", teks: "Sebelum 14 hari habis, buka menu Langganan, pilih paket, lalu bayar lewat QRIS, e-wallet, Virtual Account, atau transfer bank." },
    ],
    tips: "Kelola beberapa outlet? Buat satu cabang per outlet. Lokasi, jadwal, dan kiosk diatur terpisah di tiap cabang.",
  },
  pegawai: {
    langkah: [
      { judul: "Masuk ke akun", teks: "Buka aplikasi dan masuk dengan email dan password yang diberikan admin. Lupa password? Pakai tautan Lupa password di halaman Masuk, link reset dikirim ke email Anda." },
      { judul: "Izinkan kamera dan lokasi", teks: "Saat pertama kali absen, browser meminta akses kamera dan GPS. Pilih Izinkan, keduanya diperlukan untuk presensi." },
      { judul: "Absen masuk", teks: "Tekan Absen Masuk, hadapkan wajah ke kamera, lalu ambil foto. Sistem mencocokkan wajah dan memeriksa apakah Anda berada di area cafe." },
      { judul: "Simpan struk absen", teks: "Setelah berhasil, muncul struk berisi jam masuk dan status (tepat waktu atau terlambat)." },
      { judul: "Absen pulang", teks: "Saat selesai shift, buka lagi halaman presensi. Tombolnya berubah jadi Absen Pulang, caranya sama seperti absen masuk." },
      { judul: "Ajukan izin", teks: "Tidak bisa hadir? Buka menu Izin, pilih jenis dan tanggalnya, lalu kirim. Admin akan memprosesnya." },
    ],
    tips: "Absen ditolak karena lokasi? Pastikan GPS aktif, Anda berada di dalam cafe, dan coba lagi beberapa detik kemudian. Kalau wajah tidak dikenali, cari tempat yang lebih terang.",
  },
  kiosk: {
    langkah: [
      { judul: "Salin token kiosk", teks: "Admin membuka menu Cabang dan menyalin Kiosk Token milik cabang yang bersangkutan. Setiap cabang punya token sendiri." },
      { judul: "Siapkan tablet", teks: "Di tablet cafe, buka halaman Masuk lalu pilih Buka mode Kiosk. Tempelkan token sekali saja, tablet akan mengingatnya." },
      { judul: "Pegawai tinggal menatap kamera", teks: "Pegawai berdiri di depan tablet. Sistem mengenali wajah dan mencatat masuk atau pulang otomatis, tanpa login dan tanpa HP pribadi." },
      { judul: "Ganti token bila perlu", teks: "Tablet hilang atau diganti? Klik Ganti Token di menu Cabang. Token lama langsung tidak berlaku dan tablet baru perlu disetel ulang." },
    ],
    tips: "Mode kiosk tersedia di paket Pro dan Business. Taruh tablet di sisi pintu karyawan dengan cahaya yang cukup, dan colokkan ke charger.",
  },
};

export default function Panduan() {
  const [aktif, setAktif] = useState<TabKey>("admin");
  const data = isi[aktif];

  return (
    <section id="panduan" className="scroll-mt-20 bg-cream-gradient py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-espresso-dark">Panduan pengguna</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">Mulai dari mana? Ikuti langkahnya</h2>
          <p className="mt-3 text-muted">Pilih peran Anda, lalu ikuti langkah demi langkah.</p>
        </Reveal>

        <Reveal>
          <div role="tablist" className="mb-8 grid gap-3 sm:grid-cols-3">
            {tab.map((t) => {
              const Ikon = t.ikon;
              const dipilih = aktif === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={dipilih}
                  onClick={() => setAktif(t.key)}
                  className={`flex items-center gap-3 rounded-card border p-4 text-left transition-all duration-200 ${
                    dipilih
                      ? "border-forest bg-forest text-cream shadow-warm-lg"
                      : "border-border bg-surface text-ink hover:-translate-y-0.5 hover:border-forest/40"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dipilih ? "bg-cream/15 text-latte" : "bg-forest-soft text-forest"}`}>
                    <Ikon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{t.label}</span>
                    <span className={`block text-xs ${dipilih ? "text-cream/65" : "text-muted"}`}>{t.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <div key={aktif} className="animate-fade-in" role="tabpanel">
          <ol className="relative space-y-3">
            <span className="absolute bottom-6 left-[1.2rem] top-6 hidden w-px bg-border sm:block" />
            {data.langkah.map((l, i) => (
              <li key={l.judul} className="relative flex gap-4 rounded-card border border-border/70 bg-surface p-4 shadow-warm transition-transform hover:-translate-y-0.5 sm:p-5">
                <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-espresso-gradient text-sm font-bold text-white shadow-warm">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-ink">{l.judul}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{l.teks}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-5 flex items-start gap-3 rounded-card bg-espresso-soft p-4 text-sm text-espresso-dark">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
            {data.tips}
          </p>
        </div>
      </div>
    </section>
  );
}
