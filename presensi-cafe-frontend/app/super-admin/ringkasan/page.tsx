"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, TrendingUp, Users, Clock, CreditCard, Percent } from "lucide-react";
import { api } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";
import Card from "@/components/ui/Card";

interface Ringkasan {
  total_bisnis: number;
  status: Record<string, number>;
  mrr: number;
  pendapatan_bulan_ini: number;
  pendapatan_total: number;
  grafik: { bulan: string; jumlah: number }[];
  distribusi_paket: { paket: string; jumlah: number }[];
  konversi: { pernah_bayar: number; total: number; persen: number };
  menunggu_verifikasi: number;
  segera_berakhir: { bisnis_id: number; nama_bisnis: string; email_owner: string; jenis: string; paket: string; sisa_hari: number; berakhir_at: string }[];
}

const singkatBulan = (b: string) => new Date(`${b}-01T00:00:00`).toLocaleDateString("id-ID", { month: "short" });

export default function RingkasanPage() {
  const [data, setData] = useState<Ringkasan | null>(null);

  useEffect(() => {
    api.get("/super-admin/ringkasan").then(({ data }) => setData(data));
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-espresso" />
      </div>
    );
  }

  const maks = Math.max(...data.grafik.map((g) => g.jumlah), 1);
  const berbayar = data.status.aktif + data.status.grace;

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Ringkasan</h1>
      <p className="mb-6 text-sm text-muted">Kondisi pelanggan dan pendapatan langganan</p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat ikon={TrendingUp} label="Pendapatan bulan ini" nilai={formatRupiah(data.pendapatan_bulan_ini)} catatan={`Total semua: ${formatRupiah(data.pendapatan_total)}`} />
        <Stat ikon={CreditCard} label="MRR (estimasi)" nilai={formatRupiah(data.mrr)} catatan="Pendapatan bulanan berulang dari pelanggan aktif" />
        <Stat ikon={Users} label="Pelanggan berbayar" nilai={String(berbayar)} catatan={`${data.status.trial} sedang trial`} />
        <Stat
          ikon={Percent}
          label="Konversi ke berbayar"
          nilai={`${data.konversi.persen}%`}
          catatan={`${data.konversi.pernah_bayar} dari ${data.konversi.total} bisnis pernah bayar`}
        />
      </div>

      {data.menunggu_verifikasi > 0 && (
        <Link
          href="/super-admin/pembayaran"
          className="mb-6 flex items-center justify-between rounded-card border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning transition-colors hover:bg-warning-soft/70"
        >
          <span>
            <strong>{data.menunggu_verifikasi}</strong> pembayaran menunggu verifikasi Anda
          </span>
          <span className="font-medium underline">Buka</span>
        </Link>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-ink">Pendapatan 6 bulan terakhir</h2>
          <div className="flex h-44 items-end gap-3">
            {data.grafik.map((g) => (
              <div key={g.bulan} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] text-muted">{g.jumlah ? `${Math.round(g.jumlah / 1000)}rb` : ""}</span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-espresso-gradient transition-all duration-500"
                    style={{ height: `${Math.max((g.jumlah / maks) * 100, g.jumlah ? 4 : 1)}%` }}
                    title={formatRupiah(g.jumlah)}
                  />
                </div>
                <span className="text-xs capitalize text-muted">{singkatBulan(g.bulan)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-ink">Status bisnis</h2>
          <ul className="space-y-2.5 text-sm">
            {[
              ["Berlangganan", data.status.aktif, "bg-success"],
              ["Masa tenggang", data.status.grace, "bg-warning"],
              ["Trial", data.status.trial, "bg-espresso"],
              ["Berakhir", data.status.kedaluwarsa + data.status.tanpa_langganan, "bg-danger"],
              ["Disuspend", data.status.nonaktif, "bg-muted"],
            ].map(([label, n, warna]) => (
              <li key={label as string} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink">
                  <span className={`h-2.5 w-2.5 rounded-full ${warna}`} />
                  {label}
                </span>
                <span className="font-semibold text-ink">{n}</span>
              </li>
            ))}
          </ul>
          {data.distribusi_paket.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted">Pelanggan per paket</p>
              {data.distribusi_paket.map((d) => (
                <p key={d.paket} className="flex justify-between text-sm text-ink">
                  {d.paket}
                  <span className="font-medium">{d.jumlah}</span>
                </p>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Clock className="h-4 w-4 text-espresso-dark" />
          <h2 className="font-semibold text-ink">Segera berakhir (7 hari ke depan)</h2>
        </div>
        {data.segera_berakhir.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Tidak ada trial atau langganan yang segera berakhir.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.segera_berakhir.map((s) => (
              <li key={s.bisnis_id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{s.nama_bisnis}</p>
                  <p className="text-xs text-muted">{s.email_owner}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.jenis === "trial" ? "bg-espresso-soft text-espresso-dark" : "bg-warning-soft text-warning"}`}>
                    {s.jenis === "trial" ? "Trial" : `Paket ${s.paket}`} · {s.sisa_hari} hari lagi
                  </span>
                  <p className="mt-1 text-xs text-muted">{formatTanggal(s.berakhir_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ ikon: Ikon, label, nilai, catatan }: { ikon: typeof Users; label: string; nilai: string; catatan: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Ikon className="h-4 w-4 text-espresso-dark" />
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold text-ink">{nilai}</p>
      <p className="mt-0.5 text-xs text-muted">{catatan}</p>
    </Card>
  );
}
