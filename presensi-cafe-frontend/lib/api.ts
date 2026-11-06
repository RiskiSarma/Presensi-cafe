import axios from "axios";

const PESAN_SERVER_ERROR = "Terjadi kesalahan di server kami. Silakan coba lagi nanti.";

// Error server (5xx) dari backend bisa memuat detail teknis saat mode debug. Apa pun isinya, pengguna
// hanya boleh melihat pesan umum, jadi isi response diganti sebelum sampai ke halaman mana pun.
function sembunyikanErrorServer(error: unknown) {
  const e = error as { response?: { status?: number; data?: unknown } };
  if (e?.response && (e.response.status ?? 0) >= 500) {
    e.response.data = { message: PESAN_SERVER_ERROR };
  }
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
});

// Setiap request otomatis dilampiri token Bearer dari localStorage (kalau ada)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Kalau token kadaluarsa/invalid, lempar balik ke halaman login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    sembunyikanErrorServer(error);
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }
    // Langganan habis: arahkan admin ke halaman pembayaran (halaman itu sendiri tidak ikut dialihkan)
    if (
      error.response?.status === 402 &&
      error.response?.data?.kode === "LANGGANAN_TIDAK_AKTIF" &&
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin") &&
      window.location.pathname !== "/admin/langganan"
    ) {
      window.location.href = "/admin/langganan";
    }
    return Promise.reject(error);
  }
);

// Token kiosk sekarang PER CABANG (bukan 1 token global lagi), jadi disimpan
// di localStorage tablet masing-masing lewat layar setup pertama kali di /kiosk.
export const KIOSK_TOKEN_KEY = "kiosk_token";

export const kioskApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
});

kioskApi.interceptors.response.use(
  (response) => response,
  (error) => {
    sembunyikanErrorServer(error);
    return Promise.reject(error);
  }
);

kioskApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(KIOSK_TOKEN_KEY);
    if (token) {
      config.headers["X-Kiosk-Token"] = token;
    }
  }
  return config;
});

export type Role = "super_admin" | "admin" | "pegawai";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  bisnis?: { id: number; nama_bisnis: string; status: string } | null;
  pegawai_profil?: {
    id: number;
    kode_pegawai: string;
    jabatan: string;
  };
}

// ---------- Langganan ----------

export type FiturKey = "kiosk" | "izin" | "lembur";
export type StatusLangganan = "trial" | "aktif" | "grace" | "kedaluwarsa" | "nonaktif" | "tanpa_langganan";
export type Siklus = "bulanan" | "tahunan";

export interface Paket {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string | null;
  harga_bulanan: number;
  harga_tahunan: number;
  max_cabang: number | null;
  max_pegawai: number | null;
  fitur: FiturKey[];
  urutan: number;
  is_populer: boolean;
  is_active: boolean;
  langganans_count?: number;
}

export interface KatalogFitur {
  key: FiturKey;
  label: string;
  deskripsi: string;
}

export interface Tagihan {
  id: number;
  siklus: Siklus;
  metode: "transfer" | "midtrans";
  snap_token: string | null;
  midtrans_payment_type: string | null;
  jumlah_dasar: number;
  kode_unik: number;
  jumlah_total: number;
  status: "menunggu_pembayaran" | "menunggu_konfirmasi" | "lunas" | "ditolak" | "dibatalkan";
  bukti_url: string | null;
  nama_pengirim: string | null;
  bank_pengirim: string | null;
  alasan_tolak: string | null;
  created_at: string;
  dikonfirmasi_at: string | null;
  paket?: { id: number; nama: string; kode: string };
  bisnis?: { id: number; nama_bisnis: string; email_owner: string };
}

export interface Rekening {
  bank: string;
  nomor: string;
  atas_nama: string;
}

export interface LanggananSaya {
  status: StatusLangganan;
  akses: boolean;
  paket: { id: number; kode: string; nama: string } | null;
  siklus: Siklus | null;
  mulai_at: string | null;
  berakhir_at: string | null;
  grace_berakhir_at: string | null;
  sisa_hari: number | null;
  adalah_trial: boolean;
  fitur: FiturKey[];
  batas: { cabang: number | null; pegawai: number | null };
  pemakaian: { cabang: number; pegawai: number };
  pembayaran_terbuka: Tagihan | null;
  rekening: Rekening;
  midtrans: { aktif: boolean; client_key: string | null; is_production: boolean };
}
