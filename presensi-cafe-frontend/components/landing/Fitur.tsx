import { ScanFace, MapPin, CalendarDays, Tablet, FileText, Timer, Building2, ClipboardCheck } from "lucide-react";
import Reveal from "./Reveal";

const fitur = [
  {
    ikon: ScanFace,
    judul: "Pengenalan wajah anti titip absen",
    teks: "Pegawai absen dengan wajahnya sendiri. Foto dicocokkan dengan data wajah yang didaftarkan, jadi tidak bisa diwakilkan teman.",
    gaya: "md:col-span-2 bg-forest-gradient text-cream",
    ikonGaya: "bg-cream/15 text-latte",
    teksGaya: "text-cream/75",
  },
  {
    ikon: MapPin,
    judul: "Verifikasi lokasi cabang",
    teks: "Titik koordinat dan radius toleransi diatur per cabang. Absen di luar area ditolak otomatis.",
    gaya: "bg-surface",
    ikonGaya: "bg-forest-soft text-forest",
    teksGaya: "text-muted",
  },
  {
    ikon: Tablet,
    judul: "Mode kiosk tablet",
    teks: "Taruh satu tablet di cafe. Pegawai cukup menatap kamera, tanpa perlu login atau HP pribadi.",
    gaya: "bg-surface",
    ikonGaya: "bg-espresso-soft text-espresso-dark",
    teksGaya: "text-muted",
  },
  {
    ikon: CalendarDays,
    judul: "Shift & jadwal mingguan",
    teks: "Buat shift pagi, siang, malam, lalu atur jadwal tiap pegawai. Keterlambatan dihitung dari jadwalnya.",
    gaya: "md:col-span-2 bg-espresso-soft",
    ikonGaya: "bg-surface text-espresso-dark",
    teksGaya: "text-ink/70",
  },
  {
    ikon: Timer,
    judul: "Lembur otomatis",
    teks: "Durasi lembur dihitung saat pegawai absen pulang. Tidak perlu hitung manual.",
    gaya: "bg-surface",
    ikonGaya: "bg-forest-soft text-forest",
    teksGaya: "text-muted",
  },
  {
    ikon: FileText,
    judul: "Izin, sakit & cuti",
    teks: "Pegawai ajukan dari HP, Anda setujui atau tolak dengan satu klik.",
    gaya: "bg-surface",
    ikonGaya: "bg-espresso-soft text-espresso-dark",
    teksGaya: "text-muted",
  },
  {
    ikon: Building2,
    judul: "Multi cabang",
    teks: "Kelola beberapa outlet dari satu akun, masing-masing dengan lokasi dan kiosk sendiri.",
    gaya: "bg-surface",
    ikonGaya: "bg-forest-soft text-forest",
    teksGaya: "text-muted",
  },
  {
    ikon: ClipboardCheck,
    judul: "Laporan presensi siap pakai",
    teks: "Lihat siapa hadir, terlambat, atau izin per hari, lengkap dengan jam masuk dan pulang.",
    gaya: "md:col-span-2 bg-surface",
    ikonGaya: "bg-espresso-soft text-espresso-dark",
    teksGaya: "text-muted",
  },
];

export default function Fitur() {
  return (
    <section id="fitur" className="scroll-mt-20 bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-espresso-dark">Fitur</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">Semua yang dibutuhkan tim cafe Anda</h2>
          <p className="mt-3 text-muted">Dari absen pagi sampai rekap lembur, semuanya dalam satu aplikasi yang gampang dipakai.</p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-4">
          {fitur.map((f, i) => {
            const Ikon = f.ikon;
            return (
              <Reveal key={f.judul} delay={(i % 4) * 60} className={f.gaya.includes("col-span-2") ? "md:col-span-2" : ""}>
                <div
                  className={`group h-full rounded-card border border-border/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-warm-lg ${f.gaya.replace("md:col-span-2", "")}`}
                >
                  <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${f.ikonGaya}`}>
                    <Ikon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">{f.judul}</h3>
                  <p className={`mt-1.5 text-sm leading-relaxed ${f.teksGaya}`}>{f.teks}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
