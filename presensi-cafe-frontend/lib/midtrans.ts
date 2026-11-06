declare global {
  interface Window {
    snap?: { pay: (token: string, options: Record<string, unknown>) => void };
  }
}

export interface MidtransConfig {
  aktif: boolean;
  client_key: string | null;
  is_production: boolean;
}

let snapDimuat: Promise<void> | null = null;

function muatSnap(cfg: MidtransConfig): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Hanya bisa di browser"));
  if (window.snap) return Promise.resolve();
  if (snapDimuat) return snapDimuat;

  snapDimuat = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = cfg.is_production
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", cfg.client_key ?? "");
    script.onload = () => resolve();
    script.onerror = () => {
      snapDimuat = null;
      reject(new Error("Gagal memuat Midtrans. Periksa koneksi internet."));
    };
    document.body.appendChild(script);
  });

  return snapDimuat;
}

/** Buka popup pembayaran Midtrans. onSelesai dipanggil untuk semua hasil (sukses, pending, error, ditutup). */
export async function bayarDenganSnap(token: string, cfg: MidtransConfig, onSelesai: () => void) {
  await muatSnap(cfg);
  window.snap!.pay(token, {
    onSuccess: onSelesai,
    onPending: onSelesai,
    onError: onSelesai,
    onClose: onSelesai,
  });
}
