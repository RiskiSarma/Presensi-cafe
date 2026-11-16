"use client";

import { AlertTriangle } from "lucide-react";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

/**
 * Modal konfirmasi pengganti window.confirm() bawaan browser.
 * Tertutup kalau klik area gelap di luar kotak atau tekan Esc (kecuali saat sedang memproses).
 */
export default function ConfirmModal({
  judul,
  pesan,
  labelYa = "Ya, lanjutkan",
  labelTidak = "Kembali",
  bahaya = false,
  isLoading = false,
  onConfirm,
  onClose,
}: {
  judul: string;
  pesan: string;
  labelYa?: string;
  labelTidak?: string;
  bahaya?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={isLoading ? () => undefined : onClose}>
      <Card className="w-full max-w-sm">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              bahaya ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-ink">{judul}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{pesan}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {labelTidak}
          </Button>
          <Button variant={bahaya ? "danger" : "primary"} onClick={onConfirm} isLoading={isLoading}>
            {labelYa}
          </Button>
        </div>
      </Card>
    </Modal>
  );
}