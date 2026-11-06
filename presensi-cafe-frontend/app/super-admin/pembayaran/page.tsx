"use client";

import { useEffect, useState } from "react";
import { Check, X, ExternalLink } from "lucide-react";
import { api, Tagihan } from "@/lib/api";
import { formatRupiah, formatTanggal, pesanError } from "@/lib/format";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type Filter = "menunggu_konfirmasi" | "menunggu_pembayaran" | "semua";

const warnaStatus: Record<Tagihan["status"], string> = {
  menunggu_pembayaran: "bg-warning-soft text-warning",
  menunggu_konfirmasi: "bg-warning-soft text-warning",
  lunas: "bg-success-soft text-success",
  ditolak: "bg-danger-soft text-danger",
  dibatalkan: "bg-paper text-muted",
};

export default function SuperAdminPembayaranPage() {
  const [daftar, setDaftar] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("menunggu_konfirmasi");
  const [prosesId, setProsesId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function fetchData() {
    setLoading(true);
    api
      .get("/super-admin/pembayaran", { params: filter === "semua" ? {} : { status: filter } })
      .then(({ data }) => setDaftar(data))
      .finally(() => setLoading(false));
  }

  async function handleKonfirmasi(t: Tagihan) {
    if (!confirm(`Konfirmasi lunas ${formatRupiah(t.jumlah_total)} dari ${t.bisnis?.nama_bisnis}? Langganan akan langsung aktif.`)) return;
    setProsesId(t.id);
    try {
      await api.put(`/super-admin/pembayaran/${t.id}/konfirmasi`);
      fetchData();
    } catch (err) {
      alert(pesanError(err, "Gagal mengonfirmasi."));
    } finally {
      setProsesId(null);
    }
  }

  async function handleTolak(t: Tagihan) {
    const alasan = prompt("Alasan penolakan (akan terlihat oleh admin cafe):");
    if (!alasan) return;
    setProsesId(t.id);
    try {
      await api.put(`/super-admin/pembayaran/${t.id}/tolak`, { alasan });
      fetchData();
    } catch (err) {
      alert(pesanError(err, "Gagal menolak."));
    } finally {
      setProsesId(null);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Pembayaran Langganan</h1>
        <p className="text-sm text-muted">Cocokkan nominal (termasuk kode unik) dengan mutasi rekening sebelum konfirmasi.</p>
      </div>

      <div className="mb-4 inline-flex rounded-lg bg-paper p-1 text-sm">
        {([
          ["menunggu_konfirmasi", "Perlu dicek"],
          ["menunggu_pembayaran", "Belum bayar"],
          ["semua", "Semua"],
        ] as [Filter, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-md px-3 py-1.5 transition-colors ${filter === k ? "bg-surface font-medium text-ink shadow-warm" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {!loading && daftar.length === 0 && <Card className="text-center text-sm text-muted">Tidak ada pembayaran.</Card>}
        {daftar.map((t) => (
          <Card key={t.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{t.bisnis?.nama_bisnis}</p>
                <p className="text-xs text-muted">{t.bisnis?.email_owner}</p>
                <p className="mt-2 text-sm text-ink">
                  Paket {t.paket?.nama} · <span className="capitalize">{t.siklus}</span> ·{" "}
                  {t.metode === "midtrans" ? `Midtrans${t.midtrans_payment_type ? ` (${t.midtrans_payment_type})` : ""}` : "Transfer manual"}
                </p>
                <p className="text-lg font-semibold text-ink">{formatRupiah(t.jumlah_total)}</p>
                <p className="text-xs text-muted">
                  dasar {formatRupiah(t.jumlah_dasar)} + kode unik {t.kode_unik} · dibuat {formatTanggal(t.created_at)}
                </p>
                {(t.nama_pengirim || t.bank_pengirim) && (
                  <p className="text-xs text-muted">Pengirim: {[t.nama_pengirim, t.bank_pengirim].filter(Boolean).join(" · ")}</p>
                )}
                {t.alasan_tolak && <p className="text-xs text-danger">Ditolak: {t.alasan_tolak}</p>}
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${warnaStatus[t.status]}`}>{t.status.replace("_", " ")}</span>
                {t.bukti_url && (
                  <a href={t.bukti_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-espresso-dark underline">
                    Lihat bukti <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            {t.metode === "transfer" && (t.status === "menunggu_konfirmasi" || t.status === "menunggu_pembayaran") && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="accent" isLoading={prosesId === t.id} onClick={() => handleKonfirmasi(t)}>
                  <Check className="h-4 w-4" /> Konfirmasi lunas
                </Button>
                <Button size="sm" variant="danger" disabled={prosesId === t.id} onClick={() => handleTolak(t)}>
                  <X className="h-4 w-4" /> Tolak
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
