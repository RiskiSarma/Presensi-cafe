"use client";

import { useEffect, useState } from "react";
import { Plus, MapPin, Copy, RefreshCw, Trash2, X, Check, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Cabang {
  id: number;
  nama_cabang: string;
  alamat: string | null;
  latitude: number;
  longitude: number;
  radius_meter: number;
  kiosk_token: string;
  is_active: boolean;
  pegawai_profils_count?: number;
}

export default function AdminCabangPage() {
  const [daftar, setDaftar] = useState<Cabang[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Cabang | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  function fetchData() {
    setLoading(true);
    api
      .get("/cabang")
      .then(({ data }) => setDaftar(data))
      .finally(() => setLoading(false));
  }

  async function handleDelete(c: Cabang) {
    if (!confirm(`Hapus cabang "${c.nama_cabang}"?`)) return;
    try {
      await api.delete(`/cabang/${c.id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Gagal menghapus cabang.");
    }
  }

  async function handleRegenerateToken(c: Cabang) {
    if (!confirm(`Generate ulang kiosk token untuk "${c.nama_cabang}"? Tablet kiosk lama di cabang ini perlu di-setup ulang dengan token baru.`)) return;
    await api.post(`/cabang/${c.id}/regenerate-token`);
    fetchData();
  }

  function copyToken(c: Cabang) {
    navigator.clipboard.writeText(c.kiosk_token);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Cabang</h1>
          <p className="text-sm text-muted">Kelola lokasi cabang & token kiosk masing-masing</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Tambah Cabang
        </Button>
      </div>

      <div className="grid animate-stagger grid-cols-1 gap-4 lg:grid-cols-2">
        {!loading && daftar.length === 0 && (
          <Card className="col-span-full text-center text-sm text-muted">Belum ada cabang terdaftar.</Card>
        )}
        {daftar.map((c) => (
          <Card key={c.id}>
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-espresso" />
                <div>
                  <h3 className="font-medium text-ink">{c.nama_cabang}</h3>
                  {c.alamat && <p className="text-xs text-muted">{c.alamat}</p>}
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  c.is_active ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                }`}
              >
                {c.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-muted">
              <p>Radius: {c.radius_meter}m</p>
              <p>{c.pegawai_profils_count ?? 0} pegawai</p>
            </div>

            <div className="mb-3 rounded-lg bg-paper px-3 py-2">
              <p className="mb-1 text-xs text-muted">Kiosk Token (setup di tablet cabang ini)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate font-mono text-xs text-ink">{c.kiosk_token}</code>
                <button onClick={() => copyToken(c)} className="shrink-0 text-muted hover:text-espresso">
                  {copiedId === c.id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setEditing(c); setShowForm(true); }}>
                Edit
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleRegenerateToken(c)}>
                <RefreshCw className="h-3.5 w-3.5" />
                Ganti Token
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(c)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {showForm && (
        <CabangFormModal
          cabang={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function CabangFormModal({ cabang, onClose, onSaved }: { cabang: Cabang | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!cabang;
  const [namaCabang, setNamaCabang] = useState(cabang?.nama_cabang ?? "");
  const [alamat, setAlamat] = useState(cabang?.alamat ?? "");
  const [latitude, setLatitude] = useState(cabang ? String(cabang.latitude) : "");
  const [longitude, setLongitude] = useState(cabang ? String(cabang.longitude) : "");
  const [radiusMeter, setRadiusMeter] = useState(cabang?.radius_meter ?? 100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function ambilLokasiSaatIni() {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(String(pos.coords.latitude));
      setLongitude(String(pos.coords.longitude));
    });
  }

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      const payload = {
        nama_cabang: namaCabang,
        alamat: alamat || null,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius_meter: radiusMeter,
      };
      if (isEdit) {
        await api.put(`/cabang/${cabang!.id}`, payload);
      } else {
        await api.post("/cabang", payload);
      }
      setSuccess(true);
      setTimeout(onSaved, 600);
    } catch {
      setError("Gagal menyimpan cabang. Periksa kembali data yang diisi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <Card className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">{isEdit ? "Edit Cabang" : "Tambah Cabang"}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-sm text-ink">Cabang berhasil disimpan.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Input label="Nama Cabang" value={namaCabang} onChange={(e) => setNamaCabang(e.target.value)} required />
            <Input label="Alamat (opsional)" value={alamat} onChange={(e) => setAlamat(e.target.value)} />

            <div className="grid grid-cols-2 gap-3">
              <Input label="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
              <Input label="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
            </div>

            <Button variant="secondary" size="sm" onClick={ambilLokasiSaatIni} type="button">
              <MapPin className="h-4 w-4" />
              Pakai lokasi saat ini
            </Button>

            <Input
              label="Radius Toleransi (meter)"
              type="number"
              min={10}
              value={radiusMeter}
              onChange={(e) => setRadiusMeter(Number(e.target.value))}
            />

            {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

            <Button onClick={handleSubmit} isLoading={isLoading} className="mt-2 w-full">
              Simpan Cabang
            </Button>
          </div>
        )}
      </Card>
    </Modal>
  );
}
