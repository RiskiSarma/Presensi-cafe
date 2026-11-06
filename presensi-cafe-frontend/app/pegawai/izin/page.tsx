"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

interface PengajuanIzin {
  id: number;
  jenis: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
  status: string;
}

export default function AjukanIzinPage() {
  const [riwayat, setRiwayat] = useState<PengajuanIzin[]>([]);
  const [jenis, setJenis] = useState("izin");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [alasan, setAlasan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiwayat();
  }, []);

  function fetchRiwayat() {
    api.get("/pengajuan-izin/riwayat-saya").then(({ data }) => setRiwayat(data.data ?? data));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await api.post("/pengajuan-izin", {
        jenis,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        alasan,
      });
      setSuccess(true);
      setTanggalMulai("");
      setTanggalSelesai("");
      setAlasan("");
      fetchRiwayat();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Gagal mengajukan izin. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-6">
      <Link href="/pegawai" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      <h1 className="mb-4 text-lg font-semibold text-ink">Ajukan Izin</h1>

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Jenis</label>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20"
            >
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
              <option value="cuti">Cuti</option>
            </select>
          </div>

          <Input
            type="date"
            label="Tanggal Mulai"
            value={tanggalMulai}
            onChange={(e) => setTanggalMulai(e.target.value)}
            required
          />
          <Input
            type="date"
            label="Tanggal Selesai"
            value={tanggalSelesai}
            onChange={(e) => setTanggalSelesai(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Alasan</label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={3}
              required
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20"
              placeholder="Jelaskan alasan pengajuan…"
            />
          </div>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          {success && (
            <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Pengajuan berhasil dikirim, menunggu approval admin.
            </p>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full">
            Kirim Pengajuan
          </Button>
        </form>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-ink">Riwayat Pengajuan</h2>
      <div className="flex flex-col gap-2">
        {riwayat.length === 0 && <Card className="text-center text-sm text-muted">Belum ada pengajuan.</Card>}
        {riwayat.map((r) => (
          <Card key={r.id} className="py-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium capitalize text-ink">{r.jenis}</span>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-xs text-muted">
              {new Date(r.tanggal_mulai).toLocaleDateString("id-ID")} – {new Date(r.tanggal_selesai).toLocaleDateString("id-ID")}
            </p>
            <p className="mt-1 text-xs text-muted">{r.alasan}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
