import Link from "next/link";
import { Lock, CreditCard } from "lucide-react";
import Card from "./Card";

export function AksesDitutup({ judul, pesan, tampilkanTombol = true }: { judul: string; pesan: string; tampilkanTombol?: boolean }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft">
          <Lock className="h-5 w-5 text-danger" />
        </span>
        <h2 className="font-semibold text-ink">{judul}</h2>
        <p className="mt-1 text-sm text-muted">{pesan}</p>
        {tampilkanTombol && (
          <Link
            href="/admin/langganan"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-espresso-gradient px-4 py-2.5 text-sm font-medium text-white shadow-warm"
          >
            <CreditCard className="h-4 w-4" />
            Lihat paket & bayar
          </Link>
        )}
      </Card>
    </div>
  );
}

export function FiturTerkunci({ nama }: { nama: string }) {
  return (
    <AksesDitutup
      judul={`${nama} belum tersedia di paket Anda`}
      pesan="Upgrade ke paket yang menyertakan fitur ini untuk mulai memakainya."
    />
  );
}
