"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import { pesanError } from "@/lib/format";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";

/** Tombol "Batalkan" tagihan langganan, lengkap dengan modal konfirmasinya. */
export default function BatalkanTagihan({
  tagihanId,
  onDone,
  onError,
}: {
  tagihanId: number;
  onDone: () => void;
  onError: (pesan: string) => void;
}) {
  const [buka, setBuka] = useState(false);
  const [proses, setProses] = useState(false);

  async function batalkan() {
    setProses(true);
    try {
      await api.delete(`/langganan/pembayaran/${tagihanId}`);
      setBuka(false);
      onDone();
    } catch (err) {
      setBuka(false);
      onError(pesanError(err, "Gagal membatalkan tagihan."));
    } finally {
      setProses(false);
    }
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setBuka(true)}>
        Batalkan
      </Button>

      {/* Portal ke <body> supaya tidak terpengaruh animasi/transform kartu induknya */}
      {buka &&
        createPortal(
          <ConfirmModal
            judul="Batalkan tagihan ini?"
            pesan="Tagihan akan dibatalkan dan nomor pembayarannya tidak berlaku lagi. Anda bisa membuat tagihan baru kapan saja dari daftar paket."
            labelYa="Ya, batalkan tagihan"
            labelTidak="Tidak, kembali"
            bahaya
            isLoading={proses}
            onConfirm={batalkan}
            onClose={() => setBuka(false)}
          />,
          document.body
        )}
    </>
  );
}