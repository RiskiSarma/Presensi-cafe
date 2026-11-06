"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, CalendarDays, Clock } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Shift {
  id: number;
  nama_shift: string;
  jam_mulai: string;
  jam_selesai: string;
  toleransi_telat_menit: number;
  is_active: boolean;
}

interface Jadwal {
  id: number;
  tanggal: string;
  catatan: string | null;
  pegawai_profil: { jabatan: string; user: { name: string } };
  shift: { nama_shift: string; jam_mulai: string; jam_selesai: string };
}

interface Pegawai {
  id: number;
  jabatan: string;
  user: { name: string };
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type Tab = "jadwal" | "master";

export default function AdminShiftJadwalPage() {
  const [tab, setTab] = useState<Tab>("jadwal");
  const [shiftList, setShiftList] = useState<Shift[]>([]);
  const [shiftLoading, setShiftLoading] = useState(true);

  useEffect(() => {
    fetchShift();
  }, []);

  function fetchShift() {
    setShiftLoading(true);
    api
      .get("/shifts")
      .then(({ data }) => setShiftList(data.data ?? data))
      .finally(() => setShiftLoading(false));
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Shift & Jadwal</h1>
      </div>
      <p className="mb-6 text-sm text-muted">Atur jam kerja dan siapa masuk shift apa</p>

      {/* Tab switcher */}
      <div className="mb-6 inline-flex rounded-full border border-border bg-surface p-1">
        <button
          onClick={() => setTab("jadwal")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ${
            tab === "jadwal" ? "bg-espresso-gradient text-white shadow-warm" : "text-muted hover:text-ink"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Jadwal Mingguan
        </button>
        <button
          onClick={() => setTab("master")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ${
            tab === "master" ? "bg-forest-gradient text-white shadow-warm" : "text-muted hover:text-ink"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Master Shift
        </button>
      </div>

      {tab === "jadwal" && <TabJadwal shiftList={shiftList} />}
      {tab === "master" && <TabMasterShift daftar={shiftList} loading={shiftLoading} onRefresh={fetchShift} />}
    </div>
  );
}

// ==============================
// Tab: Jadwal Mingguan
// ==============================
function TabJadwal({ shiftList }: { shiftList: Shift[] }) {
  const [minggu, setMinggu] = useState(() => startOfWeek(new Date()));
  const [daftar, setDaftar] = useState<Jadwal[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const tanggalMulai = toISODate(minggu);
  const tanggalSelesai = toISODate(new Date(minggu.getTime() + 6 * 86400000));

  useEffect(() => {
    api.get("/pegawai").then(({ data }) => setPegawaiList(data.data ?? data));
  }, []);

  useEffect(() => {
    fetchJadwal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanggalMulai]);

  function fetchJadwal() {
    setLoading(true);
    api
      .get("/jadwal-shift", { params: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai } })
      .then(({ data }) => setDaftar(data.data ?? data))
      .finally(() => setLoading(false));
  }

  async function handleDelete(j: Jadwal) {
    if (!confirm(`Hapus jadwal ${j.pegawai_profil.user.name} tanggal ${j.tanggal}?`)) return;
    await api.delete(`/jadwal-shift/${j.id}`);
    fetchJadwal();
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {new Date(tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} –{" "}
          {new Date(tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMinggu(new Date(minggu.getTime() - 7 * 86400000))}>
            ← Minggu lalu
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setMinggu(new Date(minggu.getTime() + 7 * 86400000))}>
            Minggu depan →
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Tambah Jadwal
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Pegawai</th>
              <th className="px-4 py-3 font-medium">Shift</th>
              <th className="px-4 py-3 font-medium">Catatan</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!loading && daftar.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Belum ada jadwal minggu ini.
                </td>
              </tr>
            )}
            {daftar.map((j) => (
              <tr key={j.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">
                  {new Date(j.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                </td>
                <td className="px-4 py-3 text-ink">
                  {j.pegawai_profil.user.name}
                  <p className="text-xs capitalize text-muted">{j.pegawai_profil.jabatan}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-espresso-dark">
                  {j.shift.nama_shift} ({j.shift.jam_mulai.slice(0, 5)}-{j.shift.jam_selesai.slice(0, 5)})
                </td>
                <td className="px-4 py-3 text-muted">{j.catatan ?? "-"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(j)} className="rounded p-1.5 text-muted hover:bg-danger-soft hover:text-danger">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showForm && (
        <JadwalFormModal
          pegawaiList={pegawaiList}
          shiftList={shiftList}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchJadwal(); }}
        />
      )}
    </div>
  );
}

function JadwalFormModal({
  pegawaiList,
  shiftList,
  onClose,
  onSaved,
}: {
  pegawaiList: Pegawai[];
  shiftList: Shift[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pegawaiId, setPegawaiId] = useState<number | "">("");
  const [shiftId, setShiftId] = useState<number | "">("");
  const [tanggal, setTanggal] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      await api.post("/jadwal-shift", {
        pegawai_profil_id: pegawaiId,
        shift_id: shiftId,
        tanggal,
        catatan: catatan || null,
      });
      onSaved();
    } catch {
      setError("Gagal menyimpan jadwal. Periksa kembali data yang diisi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <Card className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Tambah Jadwal</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Pegawai</label>
            <select
              value={pegawaiId}
              onChange={(e) => setPegawaiId(Number(e.target.value))}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20"
            >
              <option value="">Pilih pegawai</option>
              {pegawaiList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user.name} — {p.jabatan}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Shift</label>
            <select
              value={shiftId}
              onChange={(e) => setShiftId(Number(e.target.value))}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20"
            >
              <option value="">Pilih shift</option>
              {shiftList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama_shift}
                </option>
              ))}
            </select>
          </div>

          <Input label="Tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
          <Input label="Catatan (opsional)" value={catatan} onChange={(e) => setCatatan(e.target.value)} />

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!pegawaiId || !shiftId || !tanggal} className="mt-2 w-full">
            Simpan Jadwal
          </Button>
        </div>
      </Card>
    </Modal>
  );
}

// ==============================
// Tab: Master Shift
// ==============================
function TabMasterShift({ daftar, loading, onRefresh }: { daftar: Shift[]; loading: boolean; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);

  async function handleDelete(s: Shift) {
    if (!confirm(`Hapus shift "${s.nama_shift}"?`)) return;
    await api.delete(`/shifts/${s.id}`);
    onRefresh();
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Tambah Shift
        </Button>
      </div>

      <div className="grid animate-stagger grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!loading && daftar.length === 0 && (
          <Card className="col-span-full text-center text-sm text-muted">Belum ada shift.</Card>
        )}
        {daftar.map((s) => (
          <Card key={s.id}>
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-medium text-ink">{s.nama_shift}</h3>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(s); setShowForm(true); }} className="rounded p-1.5 text-muted hover:bg-paper hover:text-ink">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(s)} className="rounded p-1.5 text-muted hover:bg-danger-soft hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="font-mono text-sm text-espresso-dark">
              {s.jam_mulai.slice(0, 5)} – {s.jam_selesai.slice(0, 5)}
            </p>
            <p className="mt-1 text-xs text-muted">Toleransi telat {s.toleransi_telat_menit} menit</p>
          </Card>
        ))}
      </div>

      {showForm && (
        <ShiftFormModal
          shift={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

function ShiftFormModal({ shift, onClose, onSaved }: { shift: Shift | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!shift;
  const [namaShift, setNamaShift] = useState(shift?.nama_shift ?? "");
  const [jamMulai, setJamMulai] = useState(shift?.jam_mulai.slice(0, 5) ?? "");
  const [jamSelesai, setJamSelesai] = useState(shift?.jam_selesai.slice(0, 5) ?? "");
  const [toleransi, setToleransi] = useState(shift?.toleransi_telat_menit ?? 15);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      const payload = {
        nama_shift: namaShift,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai,
        toleransi_telat_menit: toleransi,
      };
      if (isEdit) {
        await api.put(`/shifts/${shift!.id}`, payload);
      } else {
        await api.post("/shifts", payload);
      }
      onSaved();
    } catch {
      setError("Gagal menyimpan shift. Periksa kembali data yang diisi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <Card className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">{isEdit ? "Edit Shift" : "Tambah Shift"}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <Input label="Nama Shift" placeholder="Shift Pagi" value={namaShift} onChange={(e) => setNamaShift(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Jam Mulai" type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} required />
            <Input label="Jam Selesai" type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} required />
          </div>
          <Input
            label="Toleransi Telat (menit)"
            type="number"
            min={0}
            value={toleransi}
            onChange={(e) => setToleransi(Number(e.target.value))}
          />
          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          <Button onClick={handleSubmit} isLoading={isLoading} className="mt-2 w-full">
            Simpan
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
