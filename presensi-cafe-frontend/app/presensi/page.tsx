"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogIn, LogOut, Loader2, CheckCircle2, XCircle, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";
import CameraCapture, { CameraCaptureHandle } from "@/components/CameraCapture";
import ReceiptCard from "@/components/ui/ReceiptCard";
import Button from "@/components/ui/Button";

type StatusHariIni = {
  jadwal_hari_ini: { shift: { nama_shift: string; jam_mulai: string; jam_selesai: string } } | null;
  presensi_hari_ini: { jam_masuk: string | null; jam_pulang: string | null; status: string } | null;
};

export default function PresensiMobilePage() {
  const { isLoading: authLoading } = useRequireRole("pegawai");
  const [status, setStatus] = useState<StatusHariIni | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ jam: string; status: string } | null>(null);
  const cameraRef = useRef<CameraCaptureHandle>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function fetchStatus() {
    setLoadingStatus(true);
    try {
      const { data } = await api.get("/presensi/status-hari-ini");
      setStatus(data);
    } finally {
      setLoadingStatus(false);
    }
  }

  const sudahMasuk = !!status?.presensi_hari_ini?.jam_masuk;
  const sudahPulang = !!status?.presensi_hari_ini?.jam_pulang;
  const jenis: "masuk" | "pulang" = sudahMasuk && !sudahPulang ? "pulang" : "masuk";
  const sudahSelesai = sudahMasuk && sudahPulang;

  function getLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Perangkat tidak mendukung GPS."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });
  }

  async function handleAbsen() {
    setResult(null);
    setErrorMsg(null);
    setScanning(true);
  }

  async function handleCaptureAndSubmit() {
    setSubmitting(true);
    try {
      const position = await getLocation();
      const blob = await cameraRef.current?.capture();

      if (!blob) {
        setErrorMsg("Gagal mengambil gambar dari kamera. Coba lagi.");
        setResult("error");
        setScanning(false);
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("foto", blob, "capture.jpg");
      formData.append("latitude", String(position.coords.latitude));
      formData.append("longitude", String(position.coords.longitude));

      const endpoint = jenis === "masuk" ? "/presensi/check-in" : "/presensi/check-out";
      const { data } = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const presensi = data.data;
      const jamField = jenis === "masuk" ? presensi.jam_masuk : presensi.jam_pulang;
      setSuccessData({
        jam: new Date(jamField).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        status: presensi.status,
      });
      setResult("success");
      fetchStatus();
    } catch (err: any) {
      if (err?.code === 1) {
        setErrorMsg("Akses lokasi ditolak. Aktifkan izin GPS untuk lanjut absen.");
      } else {
        setErrorMsg(err.response?.data?.message ?? "Terjadi kesalahan. Coba lagi.");
      }
      setResult("error");
    } finally {
      setScanning(false);
      setSubmitting(false);
    }
  }

  if (authLoading || loadingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-espresso" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-6">
      <div className="mx-auto max-w-sm">
        <Link href="/pegawai" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <h1 className="mb-1 text-lg font-semibold text-ink">Presensi Hari Ini</h1>
        <p className="mb-6 text-sm text-muted">
          {status?.jadwal_hari_ini
            ? `Jadwal: ${status.jadwal_hari_ini.shift.nama_shift} (${status.jadwal_hari_ini.shift.jam_mulai.slice(0, 5)} - ${status.jadwal_hari_ini.shift.jam_selesai.slice(0, 5)})`
            : "Tidak ada jadwal shift hari ini"}
        </p>

        {!scanning && result !== "success" && !sudahSelesai && (
          <Button onClick={handleAbsen} className="w-full" size="lg">
            {jenis === "masuk" ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
            {jenis === "masuk" ? "Absen Masuk" : "Absen Pulang"}
          </Button>
        )}

        {sudahSelesai && result !== "success" && (
          <div className="rounded-card border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
            Presensi hari ini sudah lengkap. Sampai jumpa besok!
          </div>
        )}

        {scanning && (
          <div className="flex flex-col items-center gap-4">
            <CameraCapture ref={cameraRef} variant="light" />
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5" />
              Lokasi akan diverifikasi otomatis saat foto diambil
            </p>
            <Button onClick={handleCaptureAndSubmit} isLoading={submitting} className="w-full" size="lg">
              Ambil Foto & Kirim
            </Button>
          </div>
        )}

        {result === "success" && successData && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <ReceiptCard>
              <div className="flex flex-col gap-1 text-sm">
                <div className="mb-2 text-center text-xs uppercase tracking-widest text-muted">
                  {jenis === "masuk" ? "Struk Absen Masuk" : "Struk Absen Pulang"}
                </div>
                <div className="flex justify-between border-b border-dashed border-border py-2">
                  <span className="text-muted">Jam</span>
                  <span>{successData.jam}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted">Status</span>
                  <span className="capitalize">{successData.status.replace("_", " ")}</span>
                </div>
              </div>
            </ReceiptCard>
            <Link href="/pegawai" className="text-sm text-espresso hover:underline">
              Kembali ke dashboard
            </Link>
          </div>
        )}

        {result === "error" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="h-10 w-10 text-danger" />
            <p className="text-sm text-muted">{errorMsg}</p>
            <Button variant="secondary" onClick={() => setResult(null)}>
              Coba Lagi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
