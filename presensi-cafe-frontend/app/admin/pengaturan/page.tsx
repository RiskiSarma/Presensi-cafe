"use client";

import { useEffect, useState } from "react";
import { MapPin, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function PengaturanCafePage() {
  const [namaCabang, setNamaCabang] = useState("");
  const [alamat, setAlamat] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusMeter, setRadiusMeter] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/cafe-settings")
      .then(({ data }) => {
        if (data) {
          setNamaCabang(data.nama_cabang ?? "");
          setAlamat(data.alamat ?? "");
          setLatitude(String(data.latitude ?? ""));
          setLongitude(String(data.longitude ?? ""));
          setRadiusMeter(data.radius_meter ?? 100);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function ambilLokasiSaatIni() {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(String(pos.coords.latitude));
      setLongitude(String(pos.coords.longitude));
    });
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await api.put("/cafe-settings", {
        nama_cabang: namaCabang,
        alamat: alamat || null,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius_meter: radiusMeter,
      });
      setSuccess(true);
    } catch {
      setError("Gagal menyimpan pengaturan. Periksa kembali data yang diisi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted">Memuat…</div>;

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Pengaturan Lokasi Cafe</h1>
      <p className="mb-6 text-sm text-muted">
        Titik lokasi ini dipakai untuk validasi GPS saat pegawai presensi lewat HP pribadi.
      </p>

      <Card className="max-w-md">
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
          <p className="text-xs text-muted">
            Pegawai hanya bisa presensi lewat HP kalau posisinya dalam radius ini dari titik cafe.
          </p>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          {success && (
            <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Pengaturan disimpan.
            </p>
          )}

          <Button onClick={handleSubmit} isLoading={saving} className="mt-2 w-full">
            Simpan Pengaturan
          </Button>
        </div>
      </Card>
    </div>
  );
}
