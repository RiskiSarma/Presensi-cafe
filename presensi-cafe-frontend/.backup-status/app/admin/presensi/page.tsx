"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import KoreksiModal, { KoreksiAwal, PegawaiOpsi } from "@/components/admin/KoreksiModal";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import StatusBadge from "@/components/ui/StatusBadge";

interface PresensiRow {
  id: number;
  pegawai_profil_id: number;
  dikoreksi_at: string | null;
  alasan_koreksi: string | null;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  device_type_masuk: string | null;
  jenis_perangkat_masuk: string | null;
  confidence_score_masuk: number | null;
  status: string;
  lembur_menit: number | null;
  pegawai_profil: { jabatan: string; user: { name: string } };
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminPresensiPage() {
  const today = new Date();
  const [tanggalMulai, setTanggalMulai] = useState(toISODate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [tanggalSelesai, setTanggalSelesai] = useState(toISODate(today));
  const [daftar, setDaftar] = useState<PresensiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pegawaiList, setPegawaiList] = useState<PegawaiOpsi[]>([]);
  const [koreksi, setKoreksi] = useState<{ awal?: KoreksiAwal; terkunci: boolean } | null>(null);
  const [muat, setMuat] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .get("/presensi", { params: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai, per_page: 500 } })
      .then(({ data }) => setDaftar(data.data ?? data))
      .finally(() => setLoading(false));
  }, [tanggalMulai, tanggalSelesai, muat]);

  useEffect(() => {
    api.get("/pegawai", { params: { per_page: 200, status_aktif: 1 } }).then(({ data }) => setPegawaiList(data.data ?? data));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Laporan Presensi</h1>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-muted">Riwayat presensi semua pegawai</p>
        <Button size="sm" onClick={() => setKoreksi({ terkunci: false })} disabled={pegawaiList.length === 0}>
          <Plus className="h-4 w-4" />
          Tambah / Koreksi Manual
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input type="date" label="Dari" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} />
        <Input type="date" label="Sampai" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Masuk</th>
              <th className="px-4 py-3 font-medium">Pulang</th>
              <th className="px-4 py-3 font-medium">Jalur</th>
              <th className="px-4 py-3 font-medium">Perangkat</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {!loading && daftar.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  Tidak ada data presensi di rentang tanggal ini.
                </td>
              </tr>
            )}
            {daftar.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">
                  {new Date(p.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </td>
                <td className="px-4 py-3 text-ink">
                  {p.pegawai_profil.user.name}
                  <p className="text-xs capitalize text-muted">{p.pegawai_profil.jabatan}</p>
                </td>
                <td className="px-4 py-3 font-mono text-ink">
                  {p.jam_masuk ? new Date(p.jam_masuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                </td>
                <td className="px-4 py-3 font-mono text-ink">
                  {p.jam_pulang ? new Date(p.jam_pulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                </td>
                <td className="px-4 py-3 capitalize text-muted">{p.device_type_masuk ?? "-"}</td>
                <td className="px-4 py-3 capitalize text-muted">{p.jenis_perangkat_masuk ?? "-"}</td>
                <td className="px-4 py-3 text-muted">{p.confidence_score_masuk ? `${p.confidence_score_masuk}%` : "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={p.status} />
                    {p.lembur_menit && (
                      <span className="rounded-full bg-espresso-soft px-2.5 py-1 text-xs font-medium text-espresso-dark">
                        Lembur {Math.floor(p.lembur_menit / 60) > 0 ? `${Math.floor(p.lembur_menit / 60)}j ` : ""}
                        {p.lembur_menit % 60}m
                      </span>
                    )}
                    {p.dikoreksi_at && (
                      <span
                        title={p.alasan_koreksi ?? "Dikoreksi admin"}
                        className="rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-border"
                      >
                        Dikoreksi
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      setKoreksi({
                        terkunci: true,
                        awal: {
                          pegawai_profil_id: p.pegawai_profil_id,
                          tanggal: p.tanggal,
                          jam_masuk: p.jam_masuk,
                          jam_pulang: p.jam_pulang,
                          status: p.status,
                        },
                      })
                    }
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-paper hover:text-ink"
                    aria-label="Koreksi presensi"
                    title="Koreksi"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {koreksi && (
        <KoreksiModal
          pegawaiList={pegawaiList}
          awal={koreksi.awal}
          terkunci={koreksi.terkunci}
          onClose={() => setKoreksi(null)}
          onSaved={() => {
            setKoreksi(null);
            setMuat((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
