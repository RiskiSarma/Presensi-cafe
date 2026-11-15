"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, CalendarOff } from "lucide-react";
import { api } from "@/lib/api";
import { formatTanggal, pesanError } from "@/lib/format";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface Libur {
  id: number;
  tanggal: string;
  nama: string;
}

export default function HariLiburPage() {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [daftar, setDaftar] = useState<Libur[]>([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function muat() {
    setLoading(true);
    api
      .get("/hari-libur", { params: { tahun } })
      .then(({ data }) => setDaftar(data))
      .finally(() => setLoading(false));
  }

  useEffect(muat, [tahun]);

  async function tambah() {
    setError(null);
    setIsLoading(true);
    try {
      await api.post("/hari-libur", { nama, tanggal, tanggal_selesai: tanggalSelesai || null });
      setNama("");
      setTanggal("");
      setTanggalSelesai("");
      muat();
    } catch (err) {
      setError(pesanError(err, "Gagal menyimpan hari libur."));
    } finally {
      setIsLoading(false);
    }
  }

  async function hapus(l: Libur) {
    if (!confirm(`Hapus hari libur "${l.nama}" (${formatTanggal(l.tanggal)})?`)) return;
    await api.delete(`/hari-libur/${l.id}`);
    muat();
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Hari Libur</h1>
      <p className="mb-6 text-sm text-muted">
        Tanggal di sini tidak dihitung sebagai alpha di rekap, dan tidak ikut ringkasan &quot;belum hadir&quot;. Isi libur nasional, cuti bersama, atau hari tutup cafe.
      </p>

      <Card className="mb-6 max-w-2xl">
        <h2 className="mb-3 font-semibold text-ink">Tambah hari libur</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Nama libur" placeholder="Hari Kemerdekaan" value={nama} onChange={(e) => setNama(e.target.value)} />
          <Input label="Tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          <Input
            label="Sampai (opsional)"
            type="date"
            min={tanggal || undefined}
            value={tanggalSelesai}
            onChange={(e) => setTanggalSelesai(e.target.value)}
          />
        </div>
        <p className="mt-2 text-xs text-muted">Isi &quot;Sampai&quot; kalau liburnya beberapa hari berturut-turut (cuti bersama).</p>
        {error && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <Button className="mt-3" onClick={tambah} isLoading={isLoading} disabled={!nama.trim() || !tanggal}>
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </Card>

      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => setTahun((t) => t - 1)} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-paper">
          ←
        </button>
        <span className="min-w-[4rem] text-center font-semibold text-ink">{tahun}</span>
        <button onClick={() => setTahun((t) => t + 1)} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-paper">
          →
        </button>
      </div>

      <Card className="max-w-2xl p-0">
        {!loading && daftar.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-center text-sm text-muted">
            <CalendarOff className="h-6 w-6" />
            Belum ada hari libur di {tahun}.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {daftar.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{l.nama}</p>
                  <p className="text-xs text-muted">
                    {new Date(l.tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => hapus(l)} className="rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger" aria-label="Hapus">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
