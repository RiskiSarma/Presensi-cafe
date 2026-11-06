"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { LogIn, LogOut, Coffee, Loader2, CheckCircle2, XCircle, Settings, KeyRound, AlertTriangle, ArrowLeft } from "lucide-react";
import { kioskApi, KIOSK_TOKEN_KEY } from "@/lib/api";
import CameraCapture, { CameraCaptureHandle } from "@/components/CameraCapture";
import ReceiptCard from "@/components/ui/ReceiptCard";
import Button from "@/components/ui/Button";
import CoffeeBeanPattern from "@/components/ui/CoffeeBeanPattern";

type Mode = "idle" | "scanning" | "submitting" | "success" | "error";
type JenisPresensi = "masuk" | "pulang";

interface HasilPresensi {
  nama: string;
  jabatan: string;
  jam: string;
  status: string;
}

export default function KioskPage() {
  const [token, setToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(KIOSK_TOKEN_KEY));
    setChecked(true);
  }, []);

  // Dipanggil otomatis kalau API balas 401 (token dicabut/di-generate ulang admin)
  // - BEDA dari ganti cabang manual (gak perlu confirm dialog, ini bukan aksi user)
  const invalidateToken = useCallback((reason: string) => {
    localStorage.removeItem(KIOSK_TOKEN_KEY);
    setInvalidReason(reason);
    setToken(null);
  }, []);

  if (!checked) return null;

  if (!token) {
    return <KioskSetup reason={invalidReason} onSaved={(t) => { setInvalidReason(null); setToken(t); }} />;
  }

  return (
    <KioskMain
      onGantiCabang={() => {
        localStorage.removeItem(KIOSK_TOKEN_KEY);
        setToken(null);
      }}
      onTokenInvalid={invalidateToken}
    />
  );
}

function KioskSetup({ reason, onSaved }: { reason: string | null; onSaved: (token: string) => void }) {
  const [inputToken, setInputToken] = useState("");

  function handleSimpan() {
    if (!inputToken.trim()) return;
    localStorage.setItem(KIOSK_TOKEN_KEY, inputToken.trim());
    onSaved(inputToken.trim());
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-kiosk-bg px-6 text-kiosk-text">
      <Link
        href="/login"
        className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-kiosk-border bg-kiosk-surface/80 px-4 py-2 text-sm text-kiosk-text/80 backdrop-blur transition-colors hover:border-espresso-light hover:text-kiosk-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kiosk-surface">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold">Setup Kiosk</h1>

        {reason && (
          <p className="flex animate-fade-in items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-left text-xs text-danger">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {reason}
          </p>
        )}

        <p className="text-sm text-kiosk-text/60">
          Tablet ini belum dikaitkan ke cabang mana pun. Tempel token kiosk cabang ini (lihat di dashboard admin →
          menu Cabang) untuk memulai.
        </p>
        <input
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          placeholder="Tempel kiosk token di sini"
          className="w-full rounded-lg border border-kiosk-border bg-kiosk-surface px-3.5 py-2.5 text-sm text-kiosk-text placeholder:text-kiosk-text/40 focus:border-espresso focus:outline-none"
        />
        <Button onClick={handleSimpan} disabled={!inputToken.trim()} className="w-full">
          Simpan & Mulai
        </Button>
      </div>
    </div>
  );
}

function KioskMain({
  onGantiCabang,
  onTokenInvalid,
}: {
  onGantiCabang: () => void;
  onTokenInvalid: (reason: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [jenis, setJenis] = useState<JenisPresensi | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [hasil, setHasil] = useState<HasilPresensi | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [jam, setJam] = useState(new Date());
  const cameraRef = useRef<CameraCaptureHandle>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setJam(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const kembaliKeIdle = useCallback(() => {
    setMode("idle");
    setJenis(null);
    setHasil(null);
    setErrorMsg(null);
    setCountdown(3);
  }, []);

  function mulaiScan(jenisPresensi: JenisPresensi) {
    setJenis(jenisPresensi);
    setMode("scanning");
    setCountdown(3);
  }

  function getLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Perangkat ini tidak mendukung GPS."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  useEffect(() => {
    if (mode !== "scanning") return;
    if (countdown === 0) {
      handleCapture();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, countdown]);

  async function handleCapture() {
    const blob = await cameraRef.current?.capture();
    if (!blob || !jenis) {
      setErrorMsg("Gagal mengambil gambar dari kamera. Coba lagi.");
      setMode("error");
      scheduleReset();
      return;
    }

    setMode("submitting");

    try {
      const position = await getLocation();

      const formData = new FormData();
      formData.append("foto", blob, "capture.jpg");
      formData.append("latitude", String(position.coords.latitude));
      formData.append("longitude", String(position.coords.longitude));

      const endpoint = jenis === "masuk" ? "/kiosk/presensi/check-in" : "/kiosk/presensi/check-out";
      const { data } = await kioskApi.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const presensi = data.data;
      setHasil({
        nama: presensi.pegawai_profil.user.name,
        jabatan: presensi.pegawai_profil.jabatan,
        jam: new Date(jenis === "masuk" ? presensi.jam_masuk : presensi.jam_pulang).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: presensi.status,
      });
      setMode("success");
      scheduleReset();
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token dicabut/di-generate ulang admin -> langsung lempar ke layar setup,
        // gak perlu nunggu user sadar sendiri kayak sebelumnya.
        onTokenInvalid("Token kiosk sudah tidak berlaku (kemungkinan di-generate ulang oleh admin). Hubungkan ulang tablet ini.");
        return;
      }

      if (err.code === 1) {
        setErrorMsg("Akses lokasi ditolak. Kiosk ini butuh izin GPS aktif untuk presensi.");
      } else if (err.code === 2 || err.code === 3) {
        setErrorMsg("Gagal mendapatkan lokasi tablet. Pastikan GPS/lokasi aktif, coba lagi.");
      } else {
        setErrorMsg(err.response?.data?.message ?? "Terjadi kesalahan. Coba lagi.");
      }
      setMode("error");
      scheduleReset();
    }
  }

  function scheduleReset() {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(kembaliKeIdle, 5000);
  }

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-kiosk-bg px-6 text-kiosk-text">
      <CoffeeBeanPattern className="text-cream" opacity={0.05} />
      <Link
        href="/login"
        className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-kiosk-border bg-kiosk-surface/80 px-4 py-2 text-sm text-kiosk-text/80 backdrop-blur transition-colors hover:border-espresso-light hover:text-kiosk-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>
      <div className="absolute left-1/3 top-0 h-96 w-96 -translate-x-1/2 rounded-blob bg-espresso/20 blur-[100px]" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-blob bg-forest-light/15 blur-[90px]" />
      <div className="absolute right-10 top-1/4 h-40 w-40 rounded-blob bg-latte/10 blur-[70px]" />

      <div className="absolute top-8 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-kiosk-text/60">
          <Coffee className="h-4 w-4" />
          <span className="text-sm">Presensi Cafe</span>
        </div>
        <span className="font-mono text-3xl tabular-nums">
          {jam.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <span className="text-sm text-kiosk-text/60">
          {jam.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      {mode === "idle" && (
        <div className="relative z-10 flex w-full max-w-md flex-col gap-4">
          <p className="mb-2 text-center text-kiosk-text/70">Silakan pilih jenis presensi</p>
          <button
            onClick={() => mulaiScan("masuk")}
            className="group flex items-center gap-4 rounded-card border border-kiosk-border bg-kiosk-surface/80 px-6 py-6 text-lg font-medium backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-espresso-light hover:shadow-warm-lg"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-espresso-gradient text-cream transition-transform duration-200 group-hover:scale-110">
              <LogIn className="h-5 w-5" />
            </span>
            Absen Masuk
          </button>
          <button
            onClick={() => mulaiScan("pulang")}
            className="group flex items-center gap-4 rounded-card border border-kiosk-border bg-kiosk-surface/80 px-6 py-6 text-lg font-medium backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-espresso-light hover:shadow-warm-lg"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-gradient text-cream transition-transform duration-200 group-hover:scale-110">
              <LogOut className="h-5 w-5" />
            </span>
            Absen Pulang
          </button>
        </div>
      )}

      {mode === "scanning" && (
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-4">
          <CameraCapture ref={cameraRef} variant="dark" />
          <p key={countdown} className="animate-scale-in font-mono text-5xl">{countdown > 0 ? countdown : "📸"}</p>
          <p className="text-sm text-kiosk-text/60">Posisikan wajah di dalam lingkaran</p>
        </div>
      )}

      {mode === "submitting" && (
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-espresso" />
          <p className="text-kiosk-text/70">Mencocokkan wajah…</p>
        </div>
      )}

      {mode === "success" && hasil && (
        <div className="relative z-10 flex flex-col items-center gap-4">
          <CheckCircle2 className="h-12 w-12 animate-scale-in text-success" />
          <ReceiptCard>
            <div className="flex flex-col gap-1 text-sm">
              <div className="mb-2 text-center text-xs uppercase tracking-widest text-muted">
                {jenis === "masuk" ? "Struk Absen Masuk" : "Struk Absen Pulang"}
              </div>
              <div className="flex justify-between border-b border-dashed border-border pb-2">
                <span className="text-muted">Nama</span>
                <span className="font-medium">{hasil.nama}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-border py-2">
                <span className="text-muted">Jabatan</span>
                <span className="capitalize">{hasil.jabatan}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-border py-2">
                <span className="text-muted">Jam</span>
                <span>{hasil.jam}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted">Status</span>
                <span className="capitalize">{hasil.status.replace("_", " ")}</span>
              </div>
            </div>
          </ReceiptCard>
        </div>
      )}

      {mode === "error" && (
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <XCircle className="h-12 w-12 animate-scale-in text-danger" />
          <p className="max-w-xs text-kiosk-text/80">{errorMsg}</p>
          <Button variant="secondary" onClick={kembaliKeIdle}>
            Coba Lagi
          </Button>
        </div>
      )}

      <button
        onClick={() => {
          if (confirm("Putuskan tablet ini dari cabang saat ini?")) onGantiCabang();
        }}
        className="absolute bottom-4 right-4 text-kiosk-text/20 hover:text-kiosk-text/50"
        aria-label="Ganti cabang"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}
