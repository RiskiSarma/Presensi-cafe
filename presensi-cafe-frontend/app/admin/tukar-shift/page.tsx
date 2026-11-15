"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { pesanError } from "@/lib/format";
import { TukarShift, labelJadwal } from "@/lib/tukar-shift";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TukarShiftBadge from "@/components/TukarShiftBadge";

export default function AdminTukarShiftPage() {
  const [daftar, setDaftar] = useState<TukarShift[]>([]);
  const [filter, setFilter] = useState<"menunggu_admin" | "semua">("menunggu_admin");
  const [loading, setLoading] = useState(true);
  const [prosesId, setProsesId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function muat() {
    setLoading(true);
    api
      .get("/tukar-shift-admin", { params: { status: filter } })
      .then(({ data }) => setDaftar(data))
      .finally(() => setLoading(false));
  }

  useEffect(muat, [filter]);

  async function putuskan(t: TukarShift, setuju: boolean) {
    let catatan: string | null = null;
    if (!setuju) {
      catatan = prompt("Alasan penolakan (akan terlihat oleh pegawai, boleh dikosongkan):");
      if (catatan === null) return;
    } else if (!confirm("Setujui dan tukar jadwal kedua pegawai sekarang?")) {
      return;
    }

    setError(null);
    setProsesId(t.id);
    try {
      await api.put(`/tukar-shift-admin/${t.id}/putuskan`, { setuju, catatan: catatan || null });
      muat();
    } catch (err) {
      setError(pesanError(err, "Gagal memproses."));
    } finally {
      setProsesId(null);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Tukar Shift</h1>
      <p className="mb-6 text-sm text-muted">Permintaan tukar shift yang sudah disetujui rekannya dan menunggu keputusan Anda. Jadwal otomatis berubah saat Anda setujui.</p>

      <div className="mb-4 inline-flex rounded-lg bg-paper p-1 text-sm">
        {([["menunggu_admin", "Perlu keputusan"], ["semua", "Semua"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-md px-3 py-1.5 transition-colors ${filter === k ? "bg-surface font-medium text-ink shadow-warm" : "text-muted"}`}>
            {l}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="flex max-w-3xl flex-col gap-3">
        {!loading && daftar.length === 0 && <Card className="text-center text-sm text-muted">Tidak ada permintaan.</Card>}
        {daftar.map((t) => (
          <Card key={t.id}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="flex items-center gap-2 font-medium text-ink">
                {t.pemohon.user.name}
                <ArrowLeftRight className="h-4 w-4 text-muted" />
                {t.target.user.name}
              </p>
              <TukarShiftBadge status={t.status} />
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p className="rounded-lg bg-paper px-3 py-2">
                <span className="block text-xs text-muted">{t.pemohon.user.name} melepas</span>
                {labelJadwal(t.jadwal_pemohon)}
              </p>
              <p className="rounded-lg bg-paper px-3 py-2">
                <span className="block text-xs text-muted">{t.target.user.name} melepas</span>
                {labelJadwal(t.jadwal_target)}
              </p>
            </div>
            {t.alasan && <p className="mt-2 text-xs italic text-muted">&quot;{t.alasan}&quot;</p>}
            {t.catatan_admin && <p className="mt-1 text-xs text-muted">Catatan admin: {t.catatan_admin}</p>}
            {t.status === "menunggu_admin" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="accent" isLoading={prosesId === t.id} onClick={() => putuskan(t, true)}>
                  <Check className="h-4 w-4" /> Setujui
                </Button>
                <Button size="sm" variant="danger" disabled={prosesId === t.id} onClick={() => putuskan(t, false)}>
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
