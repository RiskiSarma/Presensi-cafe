"use client";

import { useEffect, useState } from "react";
import { Plus, X, Check, Pencil } from "lucide-react";
import { api, KatalogFitur, Paket } from "@/lib/api";
import { formatRupiah, pesanError } from "@/lib/format";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SuperAdminPaketPage() {
  const [daftar, setDaftar] = useState<Paket[]>([]);
  const [katalog, setKatalog] = useState<KatalogFitur[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Paket | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  function fetchData() {
    setLoading(true);
    api
      .get("/super-admin/paket")
      .then(({ data }) => {
        setDaftar(data.paket);
        setKatalog(data.katalog_fitur);
      })
      .finally(() => setLoading(false));
  }

  async function handleDelete(p: Paket) {
    if (!confirm(`Hapus paket "${p.nama}"?`)) return;
    try {
      await api.delete(`/super-admin/paket/${p.id}`);
      fetchData();
    } catch (err) {
      alert(pesanError(err, "Gagal menghapus paket."));
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Paket Langganan</h1>
          <p className="text-sm text-muted">Atur harga, batas, dan fitur tiap paket. Perubahan langsung berlaku untuk semua pelanggan paket itu.</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Tambah Paket
        </Button>
      </div>

      <div className="grid animate-stagger grid-cols-1 gap-4 lg:grid-cols-3">
        {!loading && daftar.length === 0 && (
          <Card className="col-span-full text-center text-sm text-muted">Belum ada paket. Jalankan PaketSeeder atau tambah manual.</Card>
        )}
        {daftar.map((p) => (
          <Card key={p.id} className={p.is_active ? "" : "opacity-60"}>
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-ink">{p.nama}</h3>
                <p className="font-mono text-xs text-muted">{p.kode}</p>
              </div>
              <div className="flex gap-1">
                {p.is_populer && <span className="rounded-full bg-espresso-soft px-2 py-0.5 text-xs text-espresso-dark">Populer</span>}
                {!p.is_active && <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">Nonaktif</span>}
              </div>
            </div>
            <p className="text-lg font-semibold text-ink">
              {formatRupiah(p.harga_bulanan)}<span className="text-xs font-normal text-muted">/bln</span>
            </p>
            <p className="mb-3 text-xs text-muted">{formatRupiah(p.harga_tahunan)}/tahun</p>
            <p className="mb-1 text-sm text-ink">
              {p.max_cabang ?? "∞"} cabang · {p.max_pegawai ?? "∞"} pegawai
            </p>
            <ul className="mb-4 space-y-1 text-sm">
              {katalog.map((f) => {
                const ada = p.fitur.includes(f.key);
                return (
                  <li key={f.key} className={`flex items-center gap-2 ${ada ? "text-ink" : "text-muted/60 line-through"}`}>
                    {ada ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5" />}
                    {f.label}
                  </li>
                );
              })}
            </ul>
            <p className="mb-3 text-xs text-muted">{p.langganans_count ?? 0} periode langganan pernah memakai paket ini</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setEditing(p); setShowForm(true); }}>
                <Pencil className="h-3.5 w-3.5" /> Ubah
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(p)}>Hapus</Button>
            </div>
          </Card>
        ))}
      </div>

      {showForm && (
        <PaketFormModal
          paket={editing}
          katalog={katalog}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function PaketFormModal({
  paket,
  katalog,
  onClose,
  onSaved,
}: {
  paket: Paket | null;
  katalog: KatalogFitur[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kode, setKode] = useState(paket?.kode ?? "");
  const [nama, setNama] = useState(paket?.nama ?? "");
  const [deskripsi, setDeskripsi] = useState(paket?.deskripsi ?? "");
  const [hargaBulanan, setHargaBulanan] = useState(String(paket?.harga_bulanan ?? ""));
  const [hargaTahunan, setHargaTahunan] = useState(String(paket?.harga_tahunan ?? ""));
  const [maxCabang, setMaxCabang] = useState(paket?.max_cabang != null ? String(paket.max_cabang) : "");
  const [maxPegawai, setMaxPegawai] = useState(paket?.max_pegawai != null ? String(paket.max_pegawai) : "");
  const [fitur, setFitur] = useState<string[]>(paket?.fitur ?? []);
  const [urutan, setUrutan] = useState(String(paket?.urutan ?? 0));
  const [isPopuler, setIsPopuler] = useState(paket?.is_populer ?? false);
  const [isActive, setIsActive] = useState(paket?.is_active ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleFitur(key: string) {
    setFitur((f) => (f.includes(key) ? f.filter((k) => k !== key) : [...f, key]));
  }

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    const payload = {
      kode,
      nama,
      deskripsi: deskripsi || null,
      harga_bulanan: Number(hargaBulanan),
      harga_tahunan: Number(hargaTahunan),
      max_cabang: maxCabang === "" ? null : Number(maxCabang),
      max_pegawai: maxPegawai === "" ? null : Number(maxPegawai),
      fitur,
      urutan: Number(urutan) || 0,
      is_populer: isPopuler,
      is_active: isActive,
    };
    try {
      if (paket) await api.put(`/super-admin/paket/${paket.id}`, payload);
      else await api.post("/super-admin/paket", payload);
      onSaved();
    } catch (err) {
      setError(pesanError(err, "Gagal menyimpan paket."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">{paket ? `Ubah Paket ${paket.nama}` : "Tambah Paket"}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Kode" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="bisnis" />
            <Input label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Bisnis" />
          </div>
          <Input label="Deskripsi singkat" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Harga / bulan (Rp)" type="number" min={0} value={hargaBulanan} onChange={(e) => setHargaBulanan(e.target.value)} />
            <Input label="Harga / tahun (Rp)" type="number" min={0} value={hargaTahunan} onChange={(e) => setHargaTahunan(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Maks. cabang" type="number" min={1} value={maxCabang} onChange={(e) => setMaxCabang(e.target.value)} placeholder="kosong = tanpa batas" />
            <Input label="Maks. pegawai" type="number" min={1} value={maxPegawai} onChange={(e) => setMaxPegawai(e.target.value)} placeholder="kosong = tanpa batas" />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">Fitur yang termasuk</p>
            <div className="flex flex-col gap-2">
              {katalog.map((f) => (
                <label key={f.key} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5" checked={fitur.includes(f.key)} onChange={() => toggleFitur(f.key)} />
                  <span>
                    <span className="text-ink">{f.label}</span>
                    <span className="block text-xs text-muted">{f.deskripsi}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 items-end gap-3">
            <Input label="Urutan tampil" type="number" min={0} value={urutan} onChange={(e) => setUrutan(e.target.value)} />
            <div className="flex flex-col gap-1.5 pb-1 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={isPopuler} onChange={(e) => setIsPopuler(e.target.checked)} /> Tandai populer</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Dijual</label>
            </div>
          </div>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <Button onClick={handleSubmit} isLoading={isLoading} className="mt-1 w-full">
            Simpan Paket
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
