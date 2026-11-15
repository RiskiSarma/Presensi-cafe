"use client";

import { useState } from "react";
import { MailWarning } from "lucide-react";
import { api } from "@/lib/api";
import { pesanError } from "@/lib/format";

/** Pengingat untuk memverifikasi email. Tidak memblokir apa pun, hanya mengingatkan. */
export default function VerifikasiEmailBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<"diam" | "kirim" | "terkirim" | "gagal">("diam");
  const [pesan, setPesan] = useState("");

  async function kirimUlang() {
    setStatus("kirim");
    try {
      const { data } = await api.post("/email/kirim-ulang");
      setPesan(data.message);
      setStatus("terkirim");
    } catch (err) {
      setPesan(pesanError(err, "Gagal mengirim email."));
      setStatus("gagal");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-warning-soft px-4 py-2.5 text-sm text-warning md:px-8">
      <span className="flex items-center gap-2">
        <MailWarning className="h-4 w-4 shrink-0" />
        {status === "terkirim" || status === "gagal" ? pesan : `Email ${email} belum diverifikasi. Cek kotak masuk Anda.`}
      </span>
      {status !== "terkirim" && (
        <button onClick={kirimUlang} disabled={status === "kirim"} className="font-medium underline underline-offset-2 disabled:opacity-60">
          {status === "kirim" ? "Mengirim..." : "Kirim ulang"}
        </button>
      )}
    </div>
  );
}
