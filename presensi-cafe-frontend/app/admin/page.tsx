"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, Clock3, FileText } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

interface PresensiRow {
  id: number;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string;
  pegawai_profil: { jabatan: string; user: { name: string } };
}

export default function AdminDashboardPage() {
  const [presensiHariIni, setPresensiHariIni] = useState<PresensiRow[]>([]);
  const [totalPegawai, setTotalPegawai] = useState<number | null>(null);
  const [izinPending, setIzinPending] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hariIni = new Date().toISOString().slice(0, 10);

    Promise.all([
      api.get("/presensi", { params: { tanggal_mulai: hariIni, tanggal_selesai: hariIni } }),
      api.get("/pegawai"),
      api.get("/pengajuan-izin", { params: { status: "pending" } }),
    ])
      .then(([presensiRes, pegawaiRes, izinRes]) => {
        setPresensiHariIni(presensiRes.data.data ?? []);
        setTotalPegawai((pegawaiRes.data.data ?? pegawaiRes.data).length);
        setIzinPending((izinRes.data.data ?? izinRes.data).length);
      })
      .finally(() => setLoading(false));
  }, []);

  const hadirHariIni = presensiHariIni.filter((p) => p.jam_masuk).length;

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
      <p className="mb-6 text-sm text-muted">
        {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mb-8 grid animate-stagger grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-espresso-gradient text-cream shadow-warm">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-ink">{loading ? "–" : totalPegawai}</p>
            <p className="text-xs text-muted">Total Pegawai</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-success to-success/70 text-white shadow-warm">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-ink">{loading ? "–" : hadirHariIni}</p>
            <p className="text-xs text-muted">Hadir Hari Ini</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-gradient text-cream shadow-warm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-ink">{loading ? "–" : izinPending}</p>
            <p className="text-xs text-muted">Izin Menunggu Approval</p>
          </div>
        </Card>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-muted" />
        <h2 className="text-sm font-semibold text-ink">Presensi Hari Ini</h2>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Jabatan</th>
              <th className="px-4 py-3 font-medium">Masuk</th>
              <th className="px-4 py-3 font-medium">Pulang</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading && presensiHariIni.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Belum ada presensi hari ini.
                </td>
              </tr>
            )}
            {presensiHariIni.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">{p.pegawai_profil.user.name}</td>
                <td className="px-4 py-3 capitalize text-muted">{p.pegawai_profil.jabatan}</td>
                <td className="px-4 py-3 font-mono text-ink">
                  {p.jam_masuk ? new Date(p.jam_masuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                </td>
                <td className="px-4 py-3 font-mono text-ink">
                  {p.jam_pulang ? new Date(p.jam_pulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
