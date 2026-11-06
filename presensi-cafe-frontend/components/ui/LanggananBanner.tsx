import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import type { LanggananSaya } from "@/lib/api";
import { formatTanggal } from "@/lib/format";

/** Pita pengingat di atas halaman admin. Return null kalau tidak perlu ditampilkan. */
export default function LanggananBanner({ data }: { data: LanggananSaya }) {
  let pesan: string | null = null;
  let gaya = "";
  let Ikon = Clock;

  if (data.status === "trial") {
    pesan = `Masa percobaan gratis: sisa ${Math.max(data.sisa_hari ?? 0, 0)} hari. Pilih paket supaya layanan tidak terputus.`;
    gaya = "bg-espresso-soft text-espresso-dark";
  } else if (data.status === "aktif" && (data.sisa_hari ?? 99) <= 7) {
    pesan = `Langganan paket ${data.paket?.nama} berakhir ${Math.max(data.sisa_hari ?? 0, 0)} hari lagi (${formatTanggal(data.berakhir_at)}).`;
    gaya = "bg-warning-soft text-warning";
  } else if (data.status === "grace") {
    pesan = `Langganan sudah berakhir. Layanan akan ditutup setelah ${formatTanggal(data.grace_berakhir_at)} jika belum diperpanjang.`;
    gaya = "bg-danger-soft text-danger";
    Ikon = AlertTriangle;
  }

  if (!pesan) return null;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm md:px-8 ${gaya}`}>
      <span className="flex items-center gap-2">
        <Ikon className="h-4 w-4 shrink-0" />
        {pesan}
      </span>
      <Link href="/admin/langganan" className="font-medium underline underline-offset-2">
        Kelola langganan
      </Link>
    </div>
  );
}
