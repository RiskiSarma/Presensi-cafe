"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { pesanError } from "@/lib/format";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export interface PegawaiOpsi {
  id: number;
  user: { name: string };
}

export interface KoreksiAwal {
  pegawai_profil_id?: number;
  tanggal?: string;
  jam_masuk?: string | null;
  jam_pulang?: string | null;
  status?: string;
}

const NON_HADIR = ["tidak_hadir", "izin", "sakit", "cuti"];

const opsiStatus = [
  { value: "", label: "Hadir (status otomatis dari jadwal)" },
  { value: "tepat_waktu", label: "Hadir, tepat waktu" },
  { value: "terlambat", label: "Hadir, terlambat" },
  { value: "pulang_cepat", label: "Hadir, pulang cepat" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "cuti", label: "Cuti" },
  { value: "tidak_hadir", label: "Tidak hadir (alpha)" },
];

function jamDariIso(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Tambah atau koreksi presensi secara manual. Alasan wajib dan tercatat sebagai jejak audit. */
export default function KoreksiModal({
  pegawaiList,
  awal,
  terkunci = false,
  onClose,
  onSaved,
}: {
  pegawaiList: PegawaiOpsi[];
  awal?: KoreksiAwal;
  terkunci?: boolean; // true = pegawai & tanggal tidak bisa diganti (mengoreksi baris yang sudah ada)
  onClose: () => void;
  onSaved: () => void;
}) {
  const hariIni = new Date().toISOString().slice(0, 10);
  const [pegawaiId, setPegawaiId] = useState(String(awal?.pegawai_profil_id ?? pegawaiList[0]?.id ?? ""));
  const [tanggal, setTanggal] = useState(awal?.tanggal?.slice(0, 10) ?? hariIni);
  const [status, setStatus] = useState(awal?.status && ["izin", "sakit", "cuti", "tidak_hadir"].includes(awal.status) ? awal.status : "");
  const [jamMasuk, setJamMasuk] = useState(jamDariIso(awal?.jam_masuk));
  const [jamPulang, setJamPulang] = useState(jamDariIso(awal?.jam_pulang));
  const [alasan, setAlasan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nonHadir = NON_HADIR.includes(status);

  const selectClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20 disabled:bg-paper disabled:text-muted";

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      await api.post("/presensi/koreksi", {
        pegawai_profil_id: Number(pegawaiId),
        tanggal,
        status: status || null,
        jam_masuk: nonHadir ? null : jamMasuk || null,
        jam_pulang: nonHadir ? null : jamPulang || null,
        alasan,
      });
      onSaved();
    } catch (err) {
      setError(pesanError(err, "Gagal menyimpan koreksi."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink">{terkunci ? "Koreksi Presensi" : "Tambah Presensi Manual"}</h2>
            <p className="text-xs text-muted">Untuk lupa absen, kamera bermasalah, atau salah catat.</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Pegawai</label>
            <select className={selectClass} value={pegawaiId} onChange={(e) => setPegawaiId(e.target.value)} disabled={terkunci}>
              {pegawaiList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user.name}
                </option>
              ))}
            </select>
          </div>

          <Input label="Tanggal" type="date" max={hariIni} value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={terkunci} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Status</label>
            <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              {opsiStatus.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {!nonHadir && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Jam masuk" type="time" value={jamMasuk} onChange={(e) => setJamMasuk(e.target.value)} />
              <Input label="Jam pulang" type="time" value={jamPulang} onChange={(e) => setJamPulang(e.target.value)} />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Alasan koreksi</label>
            <textarea
              className={`${selectClass} min-h-[72px] resize-y`}
              placeholder="Contoh: lupa absen pulang, kamera kiosk rusak"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              maxLength={255}
            />
            <span className="text-xs text-muted">Alasan akan tercatat dan terlihat di laporan sebagai penanda &quot;Dikoreksi&quot;.</span>
          </div>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <Button onClick={handleSubmit} isLoading={isLoading} disabled={alasan.trim().length < 5 || !pegawaiId || (!nonHadir && !jamMasuk)} className="w-full">
            Simpan
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
