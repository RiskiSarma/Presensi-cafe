"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Log {
  id: number;
  aksi: string;
  subjek: string;
  deskripsi: string;
  perubahan: { sebelum?: Record<string, unknown> | null; sesudah?: Record<string, unknown> } | null;
  ip: string | null;
  created_at: string;
  user: { name: string; role: string } | null;
}

const warnaAksi: Record<string, string> = {
  dibuat: "bg-success-soft text-success",
  diubah: "bg-espresso-soft text-espresso-dark",
  dihapus: "bg-danger-soft text-danger",
  koreksi: "bg-warning-soft text-warning",
  langganan: "bg-forest-soft text-forest",
};

const tampil = (v: unknown) => (v === null || v === undefined || v === "" ? "-" : typeof v === "object" ? JSON.stringify(v) : String(v));

export default function LogAktivitasPage() {
  const [daftar, setDaftar] = useState<Log[]>([]);
  const [halaman, setHalaman] = useState(1);
  const [terakhir, setTerakhir] = useState(1);
  const [loading, setLoading] = useState(true);
  const [terbuka, setTerbuka] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/log-aktivitas", { params: { page: halaman } })
      .then(({ data }) => {
        setDaftar((d) => (halaman === 1 ? data.data : [...d, ...data.data]));
        setTerakhir(data.last_page);
      })
      .finally(() => setLoading(false));
  }, [halaman]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Log Aktivitas</h1>
      <p className="mb-6 text-sm text-muted">Catatan siapa mengubah apa dan kapan, untuk pegawai, cabang, shift, izin, koreksi presensi, dan langganan.</p>

      <Card className="max-w-3xl p-0">
        {!loading && daftar.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">Belum ada aktivitas tercatat.</p>}
        <ul className="divide-y divide-border">
          {daftar.map((l) => {
            const punyaDetail = !!l.perubahan;
            return (
              <li key={l.id} className="px-5 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink">{l.deskripsi}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {l.user?.name ?? "Sistem"} ·{" "}
                      {new Date(l.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${warnaAksi[l.aksi] ?? "bg-paper text-muted"}`}>{l.aksi}</span>
                    {punyaDetail && (
                      <button onClick={() => setTerbuka(terbuka === l.id ? null : l.id)} className="text-muted hover:text-ink" aria-label="Lihat rincian">
                        <ChevronDown className={`h-4 w-4 transition-transform ${terbuka === l.id ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>
                </div>
                {terbuka === l.id && l.perubahan?.sesudah && (
                  <table className="mt-3 w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted">
                        <th className="py-1 pr-3 font-medium">Kolom</th>
                        <th className="py-1 pr-3 font-medium">Sebelum</th>
                        <th className="py-1 font-medium">Sesudah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(l.perubahan.sesudah).map((k) => (
                        <tr key={k} className="border-t border-border">
                          <td className="py-1 pr-3 font-mono text-muted">{k}</td>
                          <td className="py-1 pr-3 text-ink">{tampil(l.perubahan?.sebelum?.[k])}</td>
                          <td className="py-1 text-ink">{tampil(l.perubahan?.sesudah?.[k])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </li>
            );
          })}
        </ul>
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-espresso" />
          </div>
        )}
      </Card>

      {halaman < terakhir && !loading && (
        <Button variant="secondary" className="mt-4" onClick={() => setHalaman((h) => h + 1)}>
          Muat lebih banyak
        </Button>
      )}
    </div>
  );
}
