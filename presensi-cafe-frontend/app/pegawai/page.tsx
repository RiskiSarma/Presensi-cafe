"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScanFace, FileText, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

interface Presensi {
  id: number;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string;
  lembur_menit: number | null;
}

export default function PegawaiDashboardPage() {
  const [riwayat, setRiwayat] = useState<Presensi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/presensi/riwayat-saya")
      .then(({ data }) => setRiwayat(data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-sm px-4 py-6">
      <Link
        href="/presensi"
        className="mb-6 flex items-center gap-3 rounded-card border border-espresso bg-espresso-soft px-4 py-4 text-espresso-dark transition-colors hover:bg-espresso-soft/70"
      >
        <ScanFace className="h-6 w-6" />
        <div className="flex-1">
          <p className="font-medium">Presensi Hari Ini</p>
          <p className="text-xs opacity-80">Absen masuk / pulang</p>
        </div>
        <ChevronRight className="h-5 w-5" />
      </Link>

      <Link
        href="/pegawai/izin"
        className="mb-6 flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-4 text-ink transition-colors hover:border-espresso"
      >
        <FileText className="h-6 w-6 text-muted" />
        <div className="flex-1">
          <p className="font-medium">Ajukan Izin</p>
          <p className="text-xs text-muted">Izin, sakit, atau cuti</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted" />
      </Link>

      <h2 className="mb-3 text-sm font-semibold text-ink">Riwayat Presensi</h2>

      {loading && <p className="text-sm text-muted">Memuat…</p>}

      {!loading && riwayat.length === 0 && (
        <Card className="text-center text-sm text-muted">Belum ada riwayat presensi.</Card>
      )}

      <div className="flex flex-col gap-2">
        {riwayat.map((p) => (
          <Card key={p.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-ink">
                {new Date(p.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <p className="font-mono text-xs text-muted">
                {p.jam_masuk ? new Date(p.jam_masuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                {" – "}
                {p.jam_pulang ? new Date(p.jam_pulang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
              </p>
            </div>
            <StatusBadge status={p.status} />
            {p.lembur_menit && (
              <span className="mt-1 block rounded-full bg-espresso-soft px-2 py-0.5 text-center text-[10px] font-medium text-espresso-dark">
                Lembur {Math.floor(p.lembur_menit / 60) > 0 ? `${Math.floor(p.lembur_menit / 60)}j ` : ""}
                {p.lembur_menit % 60}m
              </span>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}
