"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, ScanFace, Pencil, UserX, X, Camera } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CameraCapture, { CameraCaptureHandle } from "@/components/CameraCapture";

interface Cabang {
  id: number;
  nama_cabang: string;
}

interface Pegawai {
  id: number;
  kode_pegawai: string;
  jabatan: string;
  no_telepon: string | null;
  status_aktif: boolean;
  user: { id: number; name: string; email: string };
  cabang: Cabang | null;
}

export default function AdminPegawaiPage() {
  const [daftar, setDaftar] = useState<Pegawai[]>([]);
  const [cabangList, setCabangList] = useState<Cabang[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pegawai | null>(null);
  const [wajahTarget, setWajahTarget] = useState<Pegawai | null>(null);

  useEffect(() => {
    api.get("/cabang").then(({ data }) => setCabangList(data));
  }, []);

  useEffect(() => {
    fetchData();
  }, [search]);

  function fetchData() {
    setLoading(true);
    api
      .get("/pegawai", { params: { search: search || undefined } })
      .then(({ data }) => setDaftar(data.data ?? data))
      .finally(() => setLoading(false));
  }

  async function handleNonaktifkan(p: Pegawai) {
    if (!confirm(`Nonaktifkan ${p.user.name}? Data presensi tetap tersimpan.`)) return;
    await api.delete(`/pegawai/${p.id}`);
    fetchData();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Pegawai</h1>
          <p className="text-sm text-muted">Kelola data pegawai & jabatan cafe</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Tambah Pegawai
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau kode pegawai…"
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20"
        />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Kode</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Jabatan</th>
              <th className="px-4 py-3 font-medium">Cabang</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!loading && daftar.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Belum ada pegawai terdaftar.
                </td>
              </tr>
            )}
            {daftar.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-muted">{p.kode_pegawai}</td>
                <td className="px-4 py-3 text-ink">
                  {p.user.name}
                  <p className="text-xs text-muted">{p.user.email}</p>
                </td>
                <td className="px-4 py-3 capitalize text-ink">{p.jabatan}</td>
                <td className="px-4 py-3 text-muted">{p.cabang?.nama_cabang ?? "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      p.status_aktif ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                    }`}
                  >
                    {p.status_aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setWajahTarget(p)}
                      title="Daftarkan wajah"
                      className="rounded-lg p-2 text-muted hover:bg-espresso-soft hover:text-espresso-dark"
                    >
                      <ScanFace className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setEditing(p); setShowForm(true); }}
                      title="Edit"
                      className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {p.status_aktif && (
                      <button
                        onClick={() => handleNonaktifkan(p)}
                        title="Nonaktifkan"
                        className="rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showForm && (
        <PegawaiFormModal
          pegawai={editing}
          cabangList={cabangList}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchData(); }}
        />
      )}

      {wajahTarget && (
        <DaftarWajahModal
          pegawai={wajahTarget}
          onClose={() => setWajahTarget(null)}
        />
      )}
    </div>
  );
}

// ==============================
// Modal: Tambah / Edit Pegawai
// ==============================
function PegawaiFormModal({
  pegawai,
  cabangList,
  onClose,
  onSaved,
}: {
  pegawai: Pegawai | null;
  cabangList: Cabang[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!pegawai;
  const [name, setName] = useState(pegawai?.user.name ?? "");
  const [email, setEmail] = useState(pegawai?.user.email ?? "");
  const [password, setPassword] = useState("");
  const [jabatan, setJabatan] = useState(pegawai?.jabatan ?? "");
  const [cabangId, setCabangId] = useState<number | "">(pegawai?.cabang?.id ?? "");
  const [noTelepon, setNoTelepon] = useState(pegawai?.no_telepon ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      if (isEdit) {
        await api.put(`/pegawai/${pegawai!.id}`, { name, jabatan, cabang_id: cabangId, no_telepon: noTelepon || null });
      } else {
        await api.post("/pegawai", { name, email, password, jabatan, cabang_id: cabangId, no_telepon: noTelepon || null });
      }
      onSaved();
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" ") : "Gagal menyimpan data.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">{isEdit ? "Edit Pegawai" : "Tambah Pegawai"}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Input label="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} required />

          {!isEdit && (
            <>
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </>
          )}

          <Input label="Jabatan" placeholder="Kasir, Waiters, Barista, dll" value={jabatan} onChange={(e) => setJabatan(e.target.value)} required />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Cabang</label>
            <select
              value={cabangId}
              onChange={(e) => setCabangId(Number(e.target.value))}
              required
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20"
            >
              <option value="">Pilih cabang</option>
              {cabangList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama_cabang}
                </option>
              ))}
            </select>
          </div>

          <Input label="No. Telepon" value={noTelepon} onChange={(e) => setNoTelepon(e.target.value)} />

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <Button onClick={handleSubmit} isLoading={isLoading} className="mt-2 w-full">
            {isEdit ? "Simpan Perubahan" : "Tambah Pegawai"}
          </Button>
        </div>
      </Card>
    </Modal>
  );
}

// ==============================
// Modal: Daftarkan Wajah
// ==============================
function DaftarWajahModal({ pegawai, onClose }: { pegawai: Pegawai; onClose: () => void }) {
  const cameraRef = useRef<CameraCaptureHandle>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCapture() {
    setError(null);
    setIsLoading(true);
    try {
      const blob = await cameraRef.current?.capture();
      if (!blob) {
        setError("Gagal mengambil gambar. Coba lagi.");
        return;
      }
      const formData = new FormData();
      formData.append("foto", blob, "wajah.jpg");
      await api.post(`/pegawai/${pegawai.id}/daftar-wajah`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Wajah gagal didaftarkan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <Card className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Daftarkan Wajah — {pegawai.user.name}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <ScanFace className="h-10 w-10 text-success" />
            <p className="text-sm text-ink">Wajah berhasil didaftarkan.</p>
            <Button variant="secondary" onClick={onClose}>Tutup</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <CameraCapture ref={cameraRef} variant="light" />
            <p className="text-center text-xs text-muted">Pastikan wajah menghadap kamera dengan pencahayaan cukup</p>
            {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
            <Button onClick={handleCapture} isLoading={isLoading} className="w-full">
              <Camera className="h-4 w-4" />
              Ambil Foto & Daftarkan
            </Button>
          </div>
        )}
      </Card>
    </Modal>
  );
}
