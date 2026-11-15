"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { api } from "@/lib/api";
import { pesanError } from "@/lib/format";
import { JadwalTukar, TukarShift, labelJadwal } from "@/lib/tukar-shift";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TukarShiftBadge from "@/components/TukarShiftBadge";

interface Rekan {
  id: number;
  nama: string;
  jabatan: string;
}

const selectClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20 disabled:bg-paper";

export default function TukarShiftPegawaiPage() {
  const [masuk, setMasuk] = useState<TukarShift[]>([]);
  const [keluar, setKeluar] = useState<TukarShift[]>([]);
  const [jadwalSaya, setJadwalSaya] = useState<JadwalTukar[]>([]);
  const [rekan, setRekan] = useState<Rekan[]>([]);
  const [jadwalRekan, setJadwalRekan] = useState<JadwalTukar[]>([]);

  const [pilihSaya, setPilihSaya] = useState("");
  const [pilihRekan, setPilihRekan] = useState("");
  const [pilihTarget, setPilihTarget] = useState("");
  const [alasan, setAlasan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function muat() {
    api
      .get("/tukar-shift")
      .then(({ data }) => {
        setMasuk(data.masuk);
        setKeluar(data.keluar);
      })
      .catch((err) => setError(pesanError(err, "Gagal memuat data.")));
    api
      .get("/tukar-shift/opsi")
      .then(({ data }) => {
        setJadwalSaya(data.jadwal_saya);
        setRekan(data.rekan);
      })
      .catch(() => undefined);
  }

  useEffect(muat, []);

  useEffect(() => {
    setPilihTarget("");
    setJadwalRekan([]);
    if (!pilihRekan) return;
    api.get(`/tukar-shift/rekan/${pilihRekan}`).then(({ data }) => setJadwalRekan(data));
  }, [pilihRekan]);

  async function kirim() {
    setError(null);
    setInfo(null);
    setIsLoading(true);
    try {
      await api.post("/tukar-shift", { jadwal_pemohon_id: Number(pilihSaya), jadwal_target_id: Number(pilihTarget), alasan: alasan || null });
      setInfo("Permintaan terkirim. Menunggu persetujuan rekan, lalu admin.");
      setPilihSaya("");
      setPilihRekan("");
      setAlasan("");
      muat();
    } catch (err) {
      setError(pesanError(err, "Gagal mengirim permintaan."));
    } finally {
      setIsLoading(false);
    }
  }

  async function jawab(id: number, setuju: boolean) {
    setError(null);
    try {
      await api.put(`/tukar-shift/${id}/jawab`, { setuju });
      muat();
    } catch (err) {
      setError(pesanError(err, "Gagal menjawab permintaan."));
    }
  }

  async function batalkan(id: number) {
    if (!confirm("Batalkan permintaan ini?")) return;
    try {
      await api.delete(`/tukar-shift/${id}`);
      muat();
    } catch (err) {
      setError(pesanError(err, "Gagal membatalkan."));
    }
  }

  const menungguSaya = masuk.filter((t) => t.status === "menunggu_rekan");

  return (
    <main className="mx-auto max-w-sm px-4 py-6">
      <Link href="/pegawai" className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>
      <h1 className="mb-1 flex items-center gap-2 text-lg font-semibold text-ink">
        <ArrowLeftRight className="h-5 w-5 text-espresso-dark" />
        Tukar Shift
      </h1>
      <p className="mb-5 text-sm text-muted">Tukar shift dengan rekan satu cabang. Rekan setuju dulu, lalu admin menyetujui.</p>

      {error && <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      {info && <p className="mb-4 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">{info}</p>}

      {menungguSaya.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-ink">Menunggu jawaban Anda</h2>
          <div className="flex flex-col gap-3">
            {menungguSaya.map((t) => (
              <Card key={t.id} className="p-4">
                <p className="text-sm text-ink">
                  <strong>{t.pemohon.user.name}</strong> mengajak tukar shift
                </p>
                <p className="mt-2 text-xs text-muted">Shift Anda: {labelJadwal(t.jadwal_target)}</p>
                <p className="text-xs text-muted">Menjadi: {labelJadwal(t.jadwal_pemohon)}</p>
                {t.alasan && <p className="mt-1 text-xs italic text-muted">&quot;{t.alasan}&quot;</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => jawab(t.id, true)}>
                    Setuju
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => jawab(t.id, false)}>
                    Tolak
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Ajukan tukar shift</h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Shift saya yang ingin ditukar</label>
            <select className={selectClass} value={pilihSaya} onChange={(e) => setPilihSaya(e.target.value)}>
              <option value="">{jadwalSaya.length ? "Pilih shift saya" : "Tidak ada shift mendatang"}</option>
              {jadwalSaya.map((j) => (
                <option key={j.id} value={j.id}>
                  {labelJadwal(j)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Tukar dengan</label>
            <select className={selectClass} value={pilihRekan} onChange={(e) => setPilihRekan(e.target.value)} disabled={!pilihSaya}>
              <option value="">Pilih rekan</option>
              {rekan.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Shift rekan yang diambil</label>
            <select className={selectClass} value={pilihTarget} onChange={(e) => setPilihTarget(e.target.value)} disabled={!pilihRekan}>
              <option value="">{pilihRekan && jadwalRekan.length === 0 ? "Rekan tidak punya shift mendatang" : "Pilih shift rekan"}</option>
              {jadwalRekan.map((j) => (
                <option key={j.id} value={j.id}>
                  {labelJadwal(j)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Alasan (opsional)</label>
            <input className={selectClass} value={alasan} onChange={(e) => setAlasan(e.target.value)} maxLength={255} placeholder="Contoh: ada acara keluarga" />
          </div>
          <Button onClick={kirim} isLoading={isLoading} disabled={!pilihSaya || !pilihTarget} className="w-full">
            Kirim permintaan
          </Button>
        </div>
      </Card>

      <h2 className="mb-2 text-sm font-semibold text-ink">Permintaan saya</h2>
      {keluar.length === 0 && <p className="text-sm text-muted">Belum ada permintaan.</p>}
      <div className="flex flex-col gap-3">
        {keluar.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">dengan {t.target.user.name}</p>
              <TukarShiftBadge status={t.status} />
            </div>
            <p className="text-xs text-muted">Saya lepas: {labelJadwal(t.jadwal_pemohon)}</p>
            <p className="text-xs text-muted">Saya ambil: {labelJadwal(t.jadwal_target)}</p>
            {t.catatan_admin && <p className="mt-1 text-xs italic text-muted">Admin: {t.catatan_admin}</p>}
            {(t.status === "menunggu_rekan" || t.status === "menunggu_admin") && (
              <button onClick={() => batalkan(t.id)} className="mt-2 text-xs text-danger underline underline-offset-2">
                Batalkan
              </button>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}
