"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatRupiah, formatTanggal, pesanError } from "@/lib/format";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface Kupon {
  id: number;
  kode: string;
  deskripsi: string | null;
  tipe: "persen" | "nominal";
  nilai: number;
  maks_pemakaian: number;
  terpakai: number;
  paket_target: string;
  berakhir_at: string | null;
  is_active: boolean;
}

interface PaketOpsi {
  id: number;
  kode: string;
  nama: string;
}

export default function KuponPage() {
  const [daftar, setDaftar] = useState<Kupon[]>([]);
  const [paket, setPaket] = useState<PaketOpsi[]>([]);
  const [form, setForm] = useState<{ kupon: Kupon | null } | null>(null);

  function muat() {
    api.get("/super-admin/kupon").then(({ data }) => {
      setDaftar(data.kupon);
      setPaket(data.paket);
    });
  }
  useEffect(muat, []);

  async function hapus(k: Kupon) {
    if (!confirm(`Hapus kupon ${k.kode}?`)) return;
    await api.delete(`/super-admin/kupon/${k.id}`);
    muat();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Kupon Promo</h1>
          <p className="text-sm text-muted">Kode diskon untuk langganan. Satu bisnis hanya bisa memakai satu kode sekali.</p>
        </div>
        <Button onClick={() => setForm({ kupon: null })}>
          <Plus className="h-4 w-4" />
          Tambah Kupon
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {daftar.length === 0 && <Card className="col-span-full text-center text-sm text-muted">Belum ada kupon.</Card>}
        {daftar.map((k) => (
          <Card key={k.id} className={k.is_active ? "" : "opacity-60"}>
            <div className="mb-2 flex items-start justify-between">
              <p className="font-mono text-lg font-semibold text-ink">{k.kode}</p>
              <span className="rounded-full bg-espresso-soft px-2.5 py-1 text-xs font-medium text-espresso-dark">
                {k.tipe === "persen" ? `${k.nilai}%` : formatRupiah(k.nilai)}
              </span>
            </div>
            {k.deskripsi && <p className="mb-2 text-sm text-muted">{k.deskripsi}</p>}
            <p className="text-xs text-muted">
              Dipakai {k.terpakai} / {k.maks_pemakaian} · Paket: {k.paket_target === "all" ? "semua" : k.paket_target}
              {k.berakhir_at && ` · s/d ${formatTanggal(k.berakhir_at)}`}
              {!k.is_active && " · nonaktif"}
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setForm({ kupon: k })}>
                <Pencil className="h-3.5 w-3.5" /> Ubah
              </Button>
              <Button size="sm" variant="ghost" onClick={() => hapus(k)}>
                <Trash2 className="h-3.5 w-3.5" /> Hapus
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {form && (
        <KuponForm
          kupon={form.kupon}
          paket={paket}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            muat();
          }}
        />
      )}
    </div>
  );
}

function KuponForm({ kupon, paket, onClose, onSaved }: { kupon: Kupon | null; paket: PaketOpsi[]; onClose: () => void; onSaved: () => void }) {
  const [kode, setKode] = useState(kupon?.kode ?? "");
  const [deskripsi, setDeskripsi] = useState(kupon?.deskripsi ?? "");
  const [tipe, setTipe] = useState(kupon?.tipe ?? "persen");
  const [nilai, setNilai] = useState(String(kupon?.nilai ?? ""));
  const [maks, setMaks] = useState(String(kupon?.maks_pemakaian ?? 1));
  const [target, setTarget] = useState(kupon?.paket_target ?? "all");
  const [berakhir, setBerakhir] = useState(kupon?.berakhir_at?.slice(0, 10) ?? "");
  const [aktif, setAktif] = useState(kupon?.is_active ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20";

  async function simpan() {
    setError(null);
    setIsLoading(true);
    const payload = {
      kode,
      deskripsi: deskripsi || null,
      tipe,
      nilai: Number(nilai),
      maks_pemakaian: Number(maks),
      paket_target: target,
      berakhir_at: berakhir || null,
      is_active: aktif,
    };
    try {
      if (kupon) await api.put(`/super-admin/kupon/${kupon.id}`, payload);
      else await api.post("/super-admin/kupon", payload);
      onSaved();
    } catch (err) {
      setError(pesanError(err, "Gagal menyimpan kupon."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">{kupon ? `Ubah ${kupon.kode}` : "Tambah Kupon"}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <Input label="Kode kupon" placeholder="HEMAT20" value={kode} onChange={(e) => setKode(e.target.value.toUpperCase())} />
          <Input label="Deskripsi (opsional)" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Jenis</label>
              <select className={selectClass} value={tipe} onChange={(e) => setTipe(e.target.value as "persen" | "nominal")}>
                <option value="persen">Persen (%)</option>
                <option value="nominal">Nominal (Rp)</option>
              </select>
            </div>
            <Input label={tipe === "persen" ? "Besar diskon (%)" : "Besar diskon (Rp)"} type="number" min={1} max={tipe === "persen" ? 100 : undefined} value={nilai} onChange={(e) => setNilai(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Kuota pemakaian" type="number" min={1} value={maks} onChange={(e) => setMaks(e.target.value)} />
            <Input label="Berlaku sampai" type="date" value={berakhir} onChange={(e) => setBerakhir(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Berlaku untuk paket</label>
            <select className={selectClass} value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="all">Semua paket</option>
              {paket.map((p) => (
                <option key={p.id} value={p.kode}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} /> Kupon aktif
          </label>
          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          <Button onClick={simpan} isLoading={isLoading} disabled={!kode.trim() || !nilai} className="w-full">
            Simpan Kupon
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
