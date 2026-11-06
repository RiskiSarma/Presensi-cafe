"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Sparkles } from "lucide-react";
import { api, KatalogFitur, Paket, Siklus } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRupiah } from "@/lib/format";
import Reveal from "./Reveal";

export default function Harga() {
  const { user } = useAuth();
  const [paket, setPaket] = useState<Paket[]>([]);
  const [katalog, setKatalog] = useState<KatalogFitur[]>([]);
  const [siklus, setSiklus] = useState<Siklus>("bulanan");
  const [status, setStatus] = useState<"memuat" | "ok" | "gagal">("memuat");

  useEffect(() => {
    api
      .get("/paket")
      .then(({ data }) => {
        setPaket(data.paket);
        setKatalog(data.katalog_fitur);
        setStatus("ok");
      })
      .catch(() => setStatus("gagal"));
  }, []);

  return (
    <section id="harga" className="scroll-mt-20 bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-espresso-dark">Harga</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">Harga transparan, tanpa kejutan</h2>
          <p className="mt-3 text-muted">Mulai gratis 14 hari. Setelah itu pilih paket yang pas dengan ukuran cafe Anda.</p>

          <div className="mt-6 inline-flex rounded-full border border-border bg-surface p-1 text-sm shadow-warm">
            {(["bulanan", "tahunan"] as Siklus[]).map((s) => (
              <button
                key={s}
                onClick={() => setSiklus(s)}
                className={`rounded-full px-5 py-2 font-medium capitalize transition-all ${
                  siklus === s ? "bg-forest text-cream shadow-warm" : "text-muted hover:text-ink"
                }`}
              >
                {s}
                {s === "tahunan" && <span className={`ml-1.5 text-xs ${siklus === s ? "text-latte" : "text-success"}`}>hemat 2 bulan</span>}
              </button>
            ))}
          </div>
        </Reveal>

        {status === "memuat" && (
          <div className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-card bg-border/50" />
            ))}
          </div>
        )}

        {status === "gagal" && (
          <p className="rounded-card border border-border bg-surface p-6 text-center text-sm text-muted">
            Daftar harga belum bisa dimuat. Coba muat ulang halaman, atau{" "}
            <Link href="/register" className="font-medium text-espresso-dark underline">
              daftar gratis
            </Link>{" "}
            dan lihat harga di dalam aplikasi.
          </p>
        )}

        {status === "ok" && (
          <div className="grid items-stretch gap-5 md:grid-cols-3">
            {paket.map((p, i) => {
              const gratis = p.harga_bulanan === 0;
              const harga = siklus === "tahunan" ? p.harga_tahunan : p.harga_bulanan;
              const hemat = p.harga_bulanan * 12 - p.harga_tahunan;
              const unggulan = p.is_populer;
              const tujuan = gratis
                ? "/register"
                : user?.role === "admin"
                  ? "/admin/langganan"
                  : `/register?paket=${p.kode}`;

              return (
                <Reveal key={p.id} delay={i * 80} className="h-full">
                  <div
                    className={`relative flex h-full flex-col rounded-card p-7 transition-all duration-300 hover:-translate-y-1.5 ${
                      unggulan
                        ? "bg-forest-gradient text-cream shadow-warm-lg md:scale-[1.03]"
                        : "border border-border bg-surface shadow-warm hover:shadow-warm-lg"
                    }`}
                  >
                    {unggulan && (
                      <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-espresso px-3.5 py-1 text-xs font-bold text-forest-dark shadow-warm">
                        <Sparkles className="h-3 w-3" />
                        Paling populer
                      </span>
                    )}

                    <h3 className="text-lg font-semibold">{p.nama}</h3>
                    <p className={`mt-1 min-h-[2.5rem] text-sm ${unggulan ? "text-cream/70" : "text-muted"}`}>{p.deskripsi}</p>

                    <div className="mt-4">
                      {gratis ? (
                        <p className="text-4xl font-semibold">Gratis</p>
                      ) : (
                        <p className="text-4xl font-semibold">
                          {formatRupiah(harga)}
                          <span className={`text-sm font-normal ${unggulan ? "text-cream/60" : "text-muted"}`}>/{siklus === "tahunan" ? "tahun" : "bulan"}</span>
                        </p>
                      )}
                      <p className={`mt-1 h-5 text-xs ${unggulan ? "text-latte" : "text-success"}`}>
                        {gratis ? "Uji coba 14 hari penuh" : siklus === "tahunan" && hemat > 0 ? `Hemat ${formatRupiah(hemat)} per tahun` : ""}
                      </p>
                    </div>

                    <ul className="my-6 flex-1 space-y-2.5 text-sm">
                      <Baris unggulan={unggulan} ok teks={p.max_cabang === null ? "Cabang tanpa batas" : `${p.max_cabang} cabang`} />
                      <Baris unggulan={unggulan} ok teks={p.max_pegawai === null ? "Pegawai tanpa batas" : `${p.max_pegawai} pegawai`} />
                      <Baris unggulan={unggulan} ok teks="Pengenalan wajah + verifikasi lokasi" />
                      <Baris unggulan={unggulan} ok teks="Shift, jadwal & laporan presensi" />
                      {katalog.map((f) => (
                        <Baris key={f.key} unggulan={unggulan} ok={p.fitur.includes(f.key)} teks={f.label} />
                      ))}
                    </ul>

                    <Link
                      href={tujuan}
                      className={`block rounded-xl px-5 py-3 text-center text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                        unggulan
                          ? "bg-espresso text-forest-dark shadow-warm"
                          : gratis
                            ? "border border-forest/30 bg-forest-soft text-forest"
                            : "bg-forest text-cream shadow-warm"
                      }`}
                    >
                      {gratis ? "Mulai uji coba gratis" : `Pilih ${p.nama}`}
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}

        <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-muted">
          Setelah 14 hari uji coba, akun nonaktif sampai Anda memilih paket berbayar. Data Anda tetap tersimpan. Bayar lewat QRIS, e-wallet, Virtual Account, atau transfer bank.
        </p>
      </div>
    </section>
  );
}

function Baris({ ok, teks, unggulan }: { ok: boolean; teks: string; unggulan: boolean }) {
  return (
    <li className={`flex items-start gap-2.5 ${ok ? "" : unggulan ? "text-cream/40 line-through" : "text-muted/60 line-through"}`}>
      {ok ? (
        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${unggulan ? "text-latte" : "text-success"}`} />
      ) : (
        <X className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      {teks}
    </li>
  );
}
