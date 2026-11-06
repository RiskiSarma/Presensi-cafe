"use client";

import { useEffect, useState } from "react";
import { Plus, Building2, X, CheckCircle2 } from "lucide-react";
import { api, FiturKey, KatalogFitur, Paket, Siklus, StatusLangganan } from "@/lib/api";
import { formatTanggal, pesanError } from "@/lib/format";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Bisnis {
  id: number;
  nama_bisnis: string;
  slug: string;
  email_owner: string;
  status: "trial" | "aktif" | "nonaktif";
  users_count: number;
  cabangs_count: number;
  fitur_override: Partial<Record<FiturKey, boolean>> | null;
  batas_override: { max_cabang?: number; max_pegawai?: number } | null;
  langganan: {
    status: StatusLangganan;
    paket: { id: number; nama: string } | null;
    siklus: Siklus | null;
    berakhir_at: string | null;
  };
}

const labelLangganan: Record<StatusLangganan, string> = {
  trial: "Trial",
  aktif: "Berlangganan",
  grace: "Masa tenggang",
  kedaluwarsa: "Berakhir",
  nonaktif: "Dinonaktifkan",
  tanpa_langganan: "Tanpa langganan",
};

const statusStyle: Record<string, string> = {
  trial: "bg-warning-soft text-warning",
  aktif: "bg-success-soft text-success",
  nonaktif: "bg-danger-soft text-danger",
};

export default function SuperAdminDashboardPage() {
  const [daftar, setDaftar] = useState<Bisnis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pengaturan, setPengaturan] = useState<Bisnis | null>(null);
  const [paket, setPaket] = useState<Paket[]>([]);
  const [katalog, setKatalog] = useState<KatalogFitur[]>([]);

  useEffect(() => {
    fetchData();
    api.get("/super-admin/paket").then(({ data }) => {
      setPaket(data.paket);
      setKatalog(data.katalog_fitur);
    });
  }, []);

  function fetchData() {
    setLoading(true);
    api
      .get("/super-admin/bisnis")
      .then(({ data }) => setDaftar(data))
      .finally(() => setLoading(false));
  }

  async function handleUpdateStatus(b: Bisnis, status: Bisnis["status"]) {
    await api.put(`/super-admin/bisnis/${b.id}`, { status });
    fetchData();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Bisnis Terdaftar</h1>
          <p className="text-sm text-muted">Kelola semua cafe yang pakai sistem ini</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Tambah Bisnis
          </Button>
        </div>
      </div>

      <div className="grid animate-stagger grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!loading && daftar.length === 0 && (
          <Card className="col-span-full text-center text-sm text-muted">Belum ada bisnis terdaftar.</Card>
        )}
        {daftar.map((b) => (
          <Card key={b.id}>
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 text-espresso" />
                <div>
                  <h3 className="font-medium text-ink">{b.nama_bisnis}</h3>
                  <p className="text-xs text-muted">{b.email_owner}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle[b.status]}`}>
                {b.status}
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-muted">
              <p>{b.cabangs_count} cabang</p>
              <p>{b.users_count} akun</p>
              <p className="col-span-2">
                Paket {b.langganan.paket?.nama ?? "-"} · {labelLangganan[b.langganan.status]}
                {b.langganan.berakhir_at && ` · s/d ${formatTanggal(b.langganan.berakhir_at)}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="accent" onClick={() => setPengaturan(b)}>
                Langganan
              </Button>
              {b.status !== "aktif" && (
                <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(b, "aktif")}>
                  Aktifkan
                </Button>
              )}
              {b.status !== "nonaktif" && (
                <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(b, "nonaktif")}>
                  Nonaktifkan
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {showForm && (
        <BisnisFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchData(); }} />
      )}

      {pengaturan && (
        <LanggananModal
          bisnis={pengaturan}
          paket={paket}
          katalog={katalog}
          onClose={() => setPengaturan(null)}
          onSaved={() => { setPengaturan(null); fetchData(); }}
        />
      )}
    </div>
  );
}

function BisnisFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [namaBisnis, setNamaBisnis] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      await api.post("/super-admin/bisnis", {
        nama_bisnis: namaBisnis,
        admin_name: adminName,
        admin_email: adminEmail,
        admin_password: adminPassword,
      });
      setSuccess(true);
      setTimeout(onSaved, 700);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" ") : "Gagal membuat bisnis.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <Card className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Tambah Bisnis Baru</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-sm text-ink">Bisnis & akun admin berhasil dibuat.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Input label="Nama Bisnis" placeholder="Kopi Analogi" value={namaBisnis} onChange={(e) => setNamaBisnis(e.target.value)} required />

            <div className="mt-2 border-t border-border pt-3">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Akun Admin Pertama</p>
              <div className="flex flex-col gap-3">
                <Input label="Nama Admin" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
                <Input label="Email Admin" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                <Input label="Password Admin" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required minLength={8} />
              </div>
            </div>

            {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

            <Button onClick={handleSubmit} isLoading={isLoading} className="mt-2 w-full">
              Buat Bisnis
            </Button>
          </div>
        )}
      </Card>
    </Modal>
  );
}

type TriState = "" | "true" | "false";

function LanggananModal({
  bisnis,
  paket,
  katalog,
  onClose,
  onSaved,
}: {
  bisnis: Bisnis;
  paket: Paket[];
  katalog: KatalogFitur[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [paketId, setPaketId] = useState(String(bisnis.langganan.paket?.id ?? paket[0]?.id ?? ""));
  const [siklus, setSiklus] = useState<Siklus>(bisnis.langganan.siklus ?? "bulanan");
  const [berakhirAt, setBerakhirAt] = useState("");
  const [catatan, setCatatan] = useState("");

  const [fitur, setFitur] = useState<Record<string, TriState>>(() => {
    const awal: Record<string, TriState> = {};
    katalog.forEach((f) => {
      const v = bisnis.fitur_override?.[f.key];
      awal[f.key] = v === undefined ? "" : v ? "true" : "false";
    });
    return awal;
  });
  const [maxCabang, setMaxCabang] = useState(bisnis.batas_override?.max_cabang != null ? String(bisnis.batas_override.max_cabang) : "");
  const [maxPegawai, setMaxPegawai] = useState(bisnis.batas_override?.max_pegawai != null ? String(bisnis.batas_override.max_pegawai) : "");

  const [loading, setLoading] = useState<"langganan" | "fitur" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function simpanLangganan() {
    setError(null);
    setLoading("langganan");
    try {
      await api.put(`/super-admin/bisnis/${bisnis.id}/langganan`, {
        paket_id: Number(paketId),
        siklus,
        berakhir_at: berakhirAt || null,
        catatan: catatan || null,
      });
      onSaved();
    } catch (err) {
      setError(pesanError(err, "Gagal mengatur langganan."));
    } finally {
      setLoading(null);
    }
  }

  async function simpanFitur() {
    setError(null);
    setLoading("fitur");
    const fiturPayload: Record<string, boolean | null> = {};
    Object.entries(fitur).forEach(([k, v]) => {
      fiturPayload[k] = v === "" ? null : v === "true";
    });
    try {
      await api.put(`/super-admin/bisnis/${bisnis.id}/fitur`, {
        fitur_override: fiturPayload,
        batas_override: {
          max_cabang: maxCabang === "" ? null : Number(maxCabang),
          max_pegawai: maxPegawai === "" ? null : Number(maxPegawai),
        },
      });
      onSaved();
    } catch (err) {
      setError(pesanError(err, "Gagal menyimpan pengaturan fitur."));
    } finally {
      setLoading(null);
    }
  }

  const selectClass =
    "rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20";

  return (
    <Modal onClose={onClose}>
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink">{bisnis.nama_bisnis}</h2>
            <p className="text-xs text-muted">Atur langganan & fitur bisnis ini</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Langganan</p>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Paket</label>
              <select className={selectClass} value={paketId} onChange={(e) => setPaketId(e.target.value)}>
                {paket.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}{p.is_active ? "" : " (nonaktif)"}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Siklus</label>
              <select className={selectClass} value={siklus} onChange={(e) => setSiklus(e.target.value as Siklus)}>
                <option value="bulanan">Bulanan</option>
                <option value="tahunan">Tahunan</option>
              </select>
            </div>
          </div>
          <Input label="Timpa tanggal berakhir (opsional)" type="date" value={berakhirAt} onChange={(e) => setBerakhirAt(e.target.value)} />
          <Input label="Catatan (opsional)" placeholder="Bayar cash, perpanjang trial, dll" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          <p className="text-xs text-muted">
            Paket sama yang masih berjalan akan disambung. Ganti paket atau langganan sudah habis: mulai dari hari ini.
          </p>
          <Button onClick={simpanLangganan} isLoading={loading === "langganan"} disabled={!paketId || loading !== null}>
            Terapkan langganan
          </Button>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Pengaturan khusus bisnis ini</p>
          <p className="mb-3 text-xs text-muted">Menimpa bawaan paket. Pilih "Ikuti paket" untuk menghapus pengecualian.</p>
          <div className="flex flex-col gap-2">
            {katalog.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">{f.label}</span>
                <select
                  className={`${selectClass} w-36`}
                  value={fitur[f.key] ?? ""}
                  onChange={(e) => setFitur((prev) => ({ ...prev, [f.key]: e.target.value as TriState }))}
                >
                  <option value="">Ikuti paket</option>
                  <option value="true">Paksa aktif</option>
                  <option value="false">Paksa mati</option>
                </select>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input label="Batas cabang" type="number" min={1} placeholder="ikuti paket" value={maxCabang} onChange={(e) => setMaxCabang(e.target.value)} />
            <Input label="Batas pegawai" type="number" min={1} placeholder="ikuti paket" value={maxPegawai} onChange={(e) => setMaxPegawai(e.target.value)} />
          </div>
          <Button variant="secondary" className="mt-3 w-full" onClick={simpanFitur} isLoading={loading === "fitur"} disabled={loading !== null}>
            Simpan pengaturan khusus
          </Button>
        </div>

        {error && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      </Card>
    </Modal>
  );
}
