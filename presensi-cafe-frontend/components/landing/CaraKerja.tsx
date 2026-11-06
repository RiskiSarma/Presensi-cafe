import { UserPlus, MapPinned, ScanFace, BarChart3 } from "lucide-react";
import CoffeeBeanPattern from "@/components/ui/CoffeeBeanPattern";
import Reveal from "./Reveal";

const langkah = [
  { ikon: UserPlus, judul: "Daftar gratis", teks: "Buat akun pemilik dalam 1 menit. Uji coba 14 hari langsung aktif." },
  { ikon: MapPinned, judul: "Atur cabang & shift", teks: "Tandai lokasi cafe, tentukan radius, lalu buat shift dan jadwal tim." },
  { ikon: ScanFace, judul: "Daftarkan wajah pegawai", teks: "Ambil satu foto wajah per pegawai langsung dari aplikasi." },
  { ikon: BarChart3, judul: "Presensi berjalan", teks: "Tim absen lewat HP atau kiosk, Anda pantau semuanya dari dashboard." },
];

export default function CaraKerja() {
  return (
    <section id="cara-kerja" className="relative scroll-mt-20 overflow-hidden bg-forest-gradient py-20 text-cream md:py-28">
      <CoffeeBeanPattern className="text-cream" opacity={0.07} />
      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-latte">Cara kerja</p>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Siap dipakai dalam 15 menit</h2>
          <p className="mt-3 text-cream/70">Tidak perlu alat khusus. Cukup HP atau satu tablet di cafe.</p>
        </Reveal>

        <div className="relative grid gap-6 md:grid-cols-4">
          <div className="absolute left-[12%] right-[12%] top-8 hidden border-t-2 border-dashed border-cream/20 md:block" />
          {langkah.map((l, i) => {
            const Ikon = l.ikon;
            return (
              <Reveal key={l.judul} delay={i * 100}>
                <div className="relative text-center">
                  <span className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-blob bg-cream/10 ring-1 ring-cream/20 backdrop-blur">
                    <Ikon className="h-6 w-6 text-latte" />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-espresso text-xs font-bold text-forest-dark">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="font-semibold">{l.judul}</h3>
                  <p className="mx-auto mt-1.5 max-w-[15rem] text-sm leading-relaxed text-cream/65">{l.teks}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
