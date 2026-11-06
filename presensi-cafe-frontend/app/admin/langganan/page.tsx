"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, Loader2, Upload, Copy, CheckCircle2, Clock } from "lucide-react";
import { api, KatalogFitur, Paket, Siklus, Tagihan } from "@/lib/api";
import { useLangganan } from "@/lib/langganan-context";
import { formatRupiah, formatTanggal, pesanError } from "@/lib/format";
import { bayarDenganSnap } from "@/lib/midtrans";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const labelStatus: Record<string, { label: string; className: string }> = {
  trial: { label: "Masa Percobaan", className: "bg-espresso-soft text-espresso-dark" },
  aktif: { label: "Aktif", className: "bg-success-soft text-success" },
  grace: { label: "Masa Tenggang", className: "bg-danger-soft text-danger" },
  kedaluwarsa: { label: "Berakhir", className: "bg-danger-soft text-danger" },
  nonaktif: { label: "Dinonaktifkan", className: "bg-danger-soft text-danger" },
  tanpa_langganan: { label: "Belum Berlangganan", className: "bg-paper text-muted" },
};

const labelTagihan: Record<Tagihan["status"], { label: string; className: string }> = {
  menunggu_pembayaran: { label: "Menunggu pembayaran", className: "bg-warning-soft text-warning" },
  menunggu_konfirmasi: { label: "Menunggu verifikasi", className: "bg-warning-soft text-warning" },
  lunas: { label: "Lunas", className: "bg-success-soft text-success" },
  ditolak: { label: "Ditolak", className: "bg-danger-soft text-danger" },
  dibatalkan: { label: "Dibatalkan", className: "bg-paper text-muted" },
};

export default function AdminLanggananPage() {
  const { data, isLoading, refresh } = useLangganan();
  const [paket, setPaket] = useState<Paket[]>([]);
  const [katalog, setKatalog] = useState<KatalogFitur[]>([]);
  const [riwayat, setRiwayat] = useState<Tagihan[]>([]);
  const [siklus, setSiklus] = useState<Siklus>("bulanan");
  const [memilihId, setMemilihId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    api.get("/paket").then(({ data }) => {
      setPaket(data.paket);
      setKatalog(data.katalog_fitur);
    });
    fetchRiwayat();
  }, []);

  function fetchRiwayat() {
    api.get("/langganan/riwayat").then(({ data }) => setRiwayat(data));
  }

  async function bukaSnap(t: Tagihan) {
    if (!data?.midtrans.aktif || !t.snap_token) return;
    setError(null);
    try {
      await bayarDenganSnap(t.snap_token, data.midtrans, async () => {
        // Tanya Midtrans langsung supaya langganan aktif tanpa menunggu webhook
        try {
          const { data: res } = await api.post(`/langganan/pembayaran/${t.id}/sinkron`);
          setInfo(
            res.tagihan.status === "lunas"
              ? "Pembayaran berhasil! Langganan Anda sudah aktif."
              : "Pembayaran belum selesai. Kalau Anda sudah membayar (mis. lewat Virtual Account), langganan aktif otomatis begitu pembayaran terkonfirmasi."
          );
        } catch {
          /* abaikan, status tetap bisa dicek lewat refresh */
        }
        await refresh();
        fetchRiwayat();
      });
    } catch (err) {
      setError(pesanError(err, "Gagal membuka pembayaran."));
    }
  }

  async function handlePilih(p: Paket, metode: "midtrans" | "transfer") {
    setError(null);
    setInfo(null);
    setMemilihId(p.id);
    try {
      const { data: res } = await api.post("/langganan/checkout", { paket_id: p.id, siklus, metode });
      await refresh();
      fetchRiwayat();
      // Area konten yang ter-scroll adalah <main>, bukan window
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
      if (metode === "midtrans") bukaSnap(res.tagihan);
      else setInfo("Tagihan dibuat. Ikuti petunjuk transfer di bawah, lalu unggah bukti transfernya.");
    } catch (err) {
      setError(pesanError(err, "Gagal membuat tagihan."));
    } finally {
      setMemilihId(null);
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-espresso" />
      </div>
    );
  }

  const st = labelStatus[data.status];
  const tagihanTerbuka = data.pembayaran_terbuka;
  const bisaBeli = data.status !== "nonaktif";

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Langganan</h1>
        <p className="text-sm text-muted">Paket, pemakaian, dan pembayaran akun cafe Anda</p>
      </div>

      {/* Status saat ini */}
      <Card className="mb-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Paket saat ini</p>
            <h2 className="text-lg font-semibold text-ink">{data.paket?.nama ?? "Belum ada paket"}</h2>
            {data.berakhir_at && (
              <p className="text-sm text-muted">
                {data.status === "kedaluwarsa" || data.status === "grace" ? "Berakhir pada " : "Aktif sampai "}
                {formatTanggal(data.berakhir_at)}
                {data.sisa_hari !== null && data.sisa_hari > 0 && ` (${data.sisa_hari} hari lagi)`}
              </p>
            )}
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.className}`}>{st.label}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PemakaianBar label="Cabang aktif" pakai={data.pemakaian.cabang} batas={data.batas.cabang} />
          <PemakaianBar label="Pegawai aktif" pakai={data.pemakaian.pegawai} batas={data.batas.pegawai} />
        </div>
      </Card>

      {info && <p className="mb-4 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">{info}</p>}

      {/* Tagihan berjalan */}
      {tagihanTerbuka && (
        <TagihanTerbuka
          tagihan={tagihanTerbuka}
          rekening={data.rekening}
          onBayarOnline={() => bukaSnap(tagihanTerbuka)}
          onChanged={() => {
            refresh();
            fetchRiwayat();
          }}
        />
      )}

      {/* Pilih paket */}
      {bisaBeli && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-ink">{data.status === "aktif" ? "Perpanjang atau ganti paket" : "Pilih paket"}</h2>
            <div className="inline-flex rounded-lg bg-paper p-1 text-sm">
              {(["bulanan", "tahunan"] as Siklus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSiklus(s)}
                  className={`rounded-md px-3 py-1.5 capitalize transition-colors ${
                    siklus === s ? "bg-surface font-medium text-ink shadow-warm" : "text-muted"
                  }`}
                >
                  {s}
                  {s === "tahunan" && <span className="ml-1.5 text-xs text-success">hemat</span>}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <div className="mb-8 grid gap-4 lg:grid-cols-3">
            {paket.map((p) => {
              const harga = siklus === "tahunan" ? p.harga_tahunan : p.harga_bulanan;
              const hematTahunan = p.harga_bulanan * 12 - p.harga_tahunan;
              const saatIni = data.paket?.id === p.id && (data.status === "aktif" || data.status === "grace");
              return (
                <Card key={p.id} className={`flex flex-col ${p.is_populer ? "ring-2 ring-espresso" : ""}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-semibold text-ink">{p.nama}</h3>
                    {p.is_populer && (
                      <span className="rounded-full bg-espresso-soft px-2 py-0.5 text-xs font-medium text-espresso-dark">Terpopuler</span>
                    )}
                  </div>
                  <p className="mb-3 min-h-[2.5rem] text-xs text-muted">{p.deskripsi}</p>
                  <p className="text-2xl font-semibold text-ink">
                    {formatRupiah(harga)}
                    <span className="text-sm font-normal text-muted">/{siklus === "tahunan" ? "tahun" : "bulan"}</span>
                  </p>
                  {siklus === "tahunan" && hematTahunan > 0 && (
                    <p className="text-xs text-success">Hemat {formatRupiah(hematTahunan)} dibanding bulanan</p>
                  )}

                  <ul className="my-4 flex-1 space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-ink">
                      <Check className="h-4 w-4 text-success" />
                      {p.max_cabang === null ? "Cabang tanpa batas" : `${p.max_cabang} cabang`}
                    </li>
                    <li className="flex items-center gap-2 text-ink">
                      <Check className="h-4 w-4 text-success" />
                      {p.max_pegawai === null ? "Pegawai tanpa batas" : `${p.max_pegawai} pegawai`}
                    </li>
                    {katalog.map((f) => {
                      const ada = p.fitur.includes(f.key);
                      return (
                        <li key={f.key} className={`flex items-center gap-2 ${ada ? "text-ink" : "text-muted/60 line-through"}`}>
                          {ada ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4" />}
                          {f.label}
                        </li>
                      );
                    })}
                  </ul>

                  {harga === 0 ? (
                    <p className="rounded-lg bg-paper px-3 py-2.5 text-center text-sm text-muted">
                      Uji coba gratis {data.status === "trial" ? "(sedang berjalan)" : "14 hari untuk bisnis baru"}
                    </p>
                  ) : (
                    <>
                      <Button
                        variant={p.is_populer ? "primary" : "secondary"}
                        className="w-full"
                        isLoading={memilihId === p.id}
                        disabled={memilihId !== null || tagihanTerbuka?.status === "menunggu_konfirmasi"}
                        onClick={() => handlePilih(p, data.midtrans.aktif ? "midtrans" : "transfer")}
                      >
                        {saatIni ? "Perpanjang" : data.status === "aktif" ? "Pindah ke paket ini" : "Pilih paket"}
                        {data.midtrans.aktif ? " & bayar" : " (transfer)"}
                      </Button>
                      {data.midtrans.aktif && (
                        <button
                          className="mt-2 text-center text-xs text-muted underline underline-offset-2 hover:text-ink disabled:opacity-50"
                          disabled={memilihId !== null || tagihanTerbuka?.status === "menunggu_konfirmasi"}
                          onClick={() => handlePilih(p, "transfer")}
                        >
                          atau transfer manual
                        </button>
                      )}
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Riwayat */}
      <h2 className="mb-3 font-semibold text-ink">Riwayat pembayaran</h2>
      <Card className="p-0">
        {riwayat.length === 0 ? (
          <p className="p-5 text-center text-sm text-muted">Belum ada pembayaran.</p>
        ) : (
          <ul className="divide-y divide-border">
            {riwayat.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">
                    {t.paket?.nama} · <span className="capitalize">{t.siklus}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {formatTanggal(t.created_at)} · {formatRupiah(t.jumlah_total)}
                    {t.status === "ditolak" && t.alasan_tolak && ` · ${t.alasan_tolak}`}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${labelTagihan[t.status].className}`}>
                  {labelTagihan[t.status].label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function PemakaianBar({ label, pakai, batas }: { label: string; pakai: number; batas: number | null }) {
  const persen = batas ? Math.min(100, Math.round((pakai / batas) * 100)) : 0;
  const hampirPenuh = batas !== null && persen >= 90;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-ink">
          {pakai} / {batas === null ? "tanpa batas" : batas}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper">
        <div
          className={`h-full rounded-full transition-all ${hampirPenuh ? "bg-danger" : "bg-forest"}`}
          style={{ width: batas === null ? "8%" : `${persen}%` }}
        />
      </div>
    </div>
  );
}

function TagihanTerbuka({
  tagihan,
  rekening,
  onChanged,
  onBayarOnline,
}: {
  tagihan: Tagihan;
  rekening: { bank: string; nomor: string; atas_nama: string };
  onChanged: () => void;
  onBayarOnline: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [namaPengirim, setNamaPengirim] = useState("");
  const [bankPengirim, setBankPengirim] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disalin, setDisalin] = useState<string | null>(null);

  const menungguKonfirmasi = tagihan.status === "menunggu_konfirmasi";

  if (tagihan.metode === "midtrans") {
    return (
      <Card className="mb-6 border-espresso/40 bg-cream">
        <h2 className="mb-1 font-semibold text-ink">Selesaikan pembayaran</h2>
        <p className="mb-4 text-sm text-muted">
          Paket <span className="font-medium text-ink">{tagihan.paket?.nama}</span> ({tagihan.siklus}) sebesar{" "}
          <span className="font-medium text-ink">{formatRupiah(tagihan.jumlah_total)}</span>. Bayar lewat QRIS, e-wallet, atau
          Virtual Account. Langganan aktif otomatis setelah pembayaran berhasil.
        </p>
        {error && <p className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={onBayarOnline} className="flex-1">
            Lanjut bayar
          </Button>
          <Button variant="ghost" onClick={handleBatal}>
            Batalkan
          </Button>
        </div>
      </Card>
    );
  }

  function salin(teks: string, kunci: string) {
    navigator.clipboard.writeText(teks);
    setDisalin(kunci);
    setTimeout(() => setDisalin(null), 1500);
  }

  async function handleUpload() {
    if (!file) {
      setError("Pilih foto bukti transfer dulu.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("bukti", file);
      if (namaPengirim) form.append("nama_pengirim", namaPengirim);
      if (bankPengirim) form.append("bank_pengirim", bankPengirim);
      await api.post(`/langganan/pembayaran/${tagihan.id}/bukti`, form);
      onChanged();
    } catch (err) {
      setError(pesanError(err, "Gagal mengirim bukti."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBatal() {
    if (!confirm("Batalkan tagihan ini?")) return;
    try {
      await api.delete(`/langganan/pembayaran/${tagihan.id}`);
      onChanged();
    } catch (err) {
      setError(pesanError(err, "Gagal membatalkan tagihan."));
    }
  }

  return (
    <Card className="mb-6 border-espresso/40 bg-cream">
      <div className="mb-3 flex items-center gap-2">
        {menungguKonfirmasi ? <Clock className="h-4 w-4 text-warning" /> : <CheckCircle2 className="h-4 w-4 text-espresso" />}
        <h2 className="font-semibold text-ink">
          {menungguKonfirmasi ? "Pembayaran sedang diverifikasi" : "Selesaikan pembayaran"}
        </h2>
      </div>

      <p className="mb-4 text-sm text-muted">
        Paket <span className="font-medium text-ink">{tagihan.paket?.nama}</span> ({tagihan.siklus}).
        {menungguKonfirmasi
          ? " Bukti transfer sudah kami terima. Langganan aktif otomatis setelah diverifikasi."
          : " Transfer sesuai nominal di bawah, lalu unggah bukti transfernya."}
      </p>

      <div className="mb-4 grid gap-3 rounded-lg bg-surface p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted">Transfer tepat sebesar</p>
          <p className="flex items-center gap-2 text-lg font-semibold text-ink">
            {formatRupiah(tagihan.jumlah_total)}
            <button onClick={() => salin(String(tagihan.jumlah_total), "jumlah")} className="text-muted hover:text-ink" title="Salin nominal">
              {disalin === "jumlah" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </button>
          </p>
          <p className="text-xs text-muted">
            Termasuk kode unik {tagihan.kode_unik} supaya pembayaran mudah dikenali. Jangan dibulatkan.
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Ke rekening {rekening.bank}</p>
          <p className="flex items-center gap-2 font-mono text-lg font-semibold text-ink">
            {rekening.nomor}
            <button onClick={() => salin(rekening.nomor, "rek")} className="text-muted hover:text-ink" title="Salin nomor rekening">
              {disalin === "rek" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </button>
          </p>
          <p className="text-xs text-muted">a.n. {rekening.atas_nama}</p>
        </div>
      </div>

      {tagihan.status === "menunggu_pembayaran" || menungguKonfirmasi ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nama pengirim (opsional)" value={namaPengirim} onChange={(e) => setNamaPengirim(e.target.value)} />
            <Input label="Bank pengirim (opsional)" value={bankPengirim} onChange={(e) => setBankPengirim(e.target.value)} />
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface px-4 py-3 text-sm text-muted transition-colors hover:border-espresso hover:text-ink"
          >
            <Upload className="h-4 w-4" />
            {file ? file.name : menungguKonfirmasi ? "Ganti bukti transfer" : "Pilih foto bukti transfer"}
          </button>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleUpload} isLoading={isLoading} className="flex-1">
              {menungguKonfirmasi ? "Kirim ulang bukti" : "Kirim bukti transfer"}
            </Button>
            {!menungguKonfirmasi && (
              <Button variant="ghost" onClick={handleBatal}>
                Batalkan
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
