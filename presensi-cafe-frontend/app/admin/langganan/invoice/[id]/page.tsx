"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatRupiah, formatTanggal, pesanError } from "@/lib/format";
import Button from "@/components/ui/Button";

interface Invoice {
  nomor: string;
  tanggal: string;
  bisnis: { nama: string; email: string };
  paket: string;
  siklus: string;
  periode_mulai: string | null;
  periode_berakhir: string | null;
  harga_asli: number;
  diskon: number;
  kode_kupon: string | null;
  kode_unik: number;
  jumlah_total: number;
  metode: string;
  jenis_pembayaran: string | null;
  penerbit: { nama: string; alamat: string; email: string };
}

const namaMetode = (i: Invoice) =>
  i.metode === "midtrans" ? `Pembayaran online${i.jenis_pembayaran ? ` (${i.jenis_pembayaran})` : ""}` : i.metode === "kupon" ? "Kupon (gratis)" : "Transfer bank";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/langganan/pembayaran/${id}/invoice`)
      .then(({ data }) => setInv(data))
      .catch((err) => setError(pesanError(err, "Invoice tidak ditemukan.")));
  }, [id]);

  if (error) {
    return (
      <div className="p-8">
        <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        <Link href="/admin/langganan" className="text-sm text-espresso-dark underline">
          Kembali ke Langganan
        </Link>
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-espresso" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/admin/langganan" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Cetak / Simpan PDF
        </Button>
      </div>

      <div className="mx-auto max-w-2xl rounded-card border border-border bg-white p-8 text-black shadow-warm print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-start justify-between border-b-2 border-black pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide">INVOICE</h1>
            <p className="mt-1 text-sm font-semibold">{inv.nomor}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">{inv.penerbit.nama}</p>
            {inv.penerbit.alamat && <p>{inv.penerbit.alamat}</p>}
            {inv.penerbit.email && <p>{inv.penerbit.email}</p>}
          </div>
        </div>

        <div className="my-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase text-gray-500">Ditagihkan kepada</p>
            <p className="font-semibold">{inv.bisnis.nama}</p>
            <p>{inv.bisnis.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-500">Tanggal pembayaran</p>
            <p className="font-semibold">{formatTanggal(inv.tanggal)}</p>
            <p className="mt-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-bold uppercase text-green-800">Lunas</p>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border border-gray-300 px-3 py-2">Deskripsi</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2">
                Langganan Presensi Cafe, paket <strong>{inv.paket}</strong> ({inv.siklus})
                {inv.periode_mulai && inv.periode_berakhir && (
                  <span className="block text-xs text-gray-600">
                    Periode {formatTanggal(inv.periode_mulai)} s/d {formatTanggal(inv.periode_berakhir)}
                  </span>
                )}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right">{formatRupiah(inv.harga_asli)}</td>
            </tr>
            {inv.diskon > 0 && (
              <tr>
                <td className="border border-gray-300 px-3 py-2">Diskon kupon {inv.kode_kupon}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">- {formatRupiah(inv.diskon)}</td>
              </tr>
            )}
            {inv.kode_unik > 0 && (
              <tr>
                <td className="border border-gray-300 px-3 py-2">Kode unik transfer</td>
                <td className="border border-gray-300 px-3 py-2 text-right">{formatRupiah(inv.kode_unik)}</td>
              </tr>
            )}
            <tr className="bg-gray-100 font-bold">
              <td className="border border-gray-300 px-3 py-2 text-right">TOTAL DIBAYAR</td>
              <td className="border border-gray-300 px-3 py-2 text-right">{formatRupiah(inv.jumlah_total)}</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-4 text-sm">Metode pembayaran: {namaMetode(inv)}</p>
        <p className="mt-8 text-xs text-gray-500">Dokumen ini dibuat otomatis oleh sistem dan sah tanpa tanda tangan.</p>
      </div>
    </div>
  );
}
