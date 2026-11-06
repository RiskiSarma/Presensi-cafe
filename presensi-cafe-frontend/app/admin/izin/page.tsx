"use client";

import { useEffect, useState } from "react";
import { Check, X as XIcon } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

interface PengajuanIzin {
  id: number;
  jenis: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
  status: string;
  pegawai_profil: { jabatan: string; user: { name: string } };
}

export default function AdminIzinPage() {
  const [daftar, setDaftar] = useState<PengajuanIzin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "semua">("pending");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function fetchData() {
    setLoading(true);
    api
      .get("/pengajuan-izin", { params: filter === "pending" ? { status: "pending" } : {} })
      .then(({ data }) => setDaftar(data.data ?? data))
      .finally(() => setLoading(false));
  }

  async function handleApprove(id: number) {
    setProcessingId(id);
    try {
      await api.put(`/pengajuan-izin/${id}/approve`);
      fetchData();
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: number) {
    if (!confirm("Tolak pengajuan izin ini?")) return;
    setProcessingId(id);
    try {
      await api.put(`/pengajuan-izin/${id}/reject`);
      fetchData();
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Pengajuan Izin</h1>
      <p className="mb-6 text-sm text-muted">Approve atau tolak izin, sakit, cuti pegawai</p>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("pending")}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
            filter === "pending" ? "bg-espresso text-white" : "bg-surface text-muted border border-border"
          }`}
        >
          Menunggu
        </button>
        <button
          onClick={() => setFilter("semua")}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
            filter === "semua" ? "bg-espresso text-white" : "bg-surface text-muted border border-border"
          }`}
        >
          Semua
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {!loading && daftar.length === 0 && (
          <Card className="text-center text-sm text-muted">Tidak ada pengajuan izin.</Card>
        )}
        {daftar.map((d) => (
          <Card key={d.id}>
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-medium text-ink">{d.pegawai_profil.user.name}</p>
                <p className="text-xs capitalize text-muted">{d.pegawai_profil.jabatan}</p>
              </div>
              <StatusBadge status={d.status} />
            </div>
            <p className="mb-1 text-sm capitalize text-ink">
              {d.jenis} • {new Date(d.tanggal_mulai).toLocaleDateString("id-ID")} – {new Date(d.tanggal_selesai).toLocaleDateString("id-ID")}
            </p>
            <p className="mb-3 text-sm text-muted">{d.alasan}</p>

            {d.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" variant="accent" onClick={() => handleApprove(d.id)} isLoading={processingId === d.id}>
                  <Check className="h-4 w-4" />
                  Setujui
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleReject(d.id)} isLoading={processingId === d.id}>
                  <XIcon className="h-4 w-4" />
                  Tolak
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
