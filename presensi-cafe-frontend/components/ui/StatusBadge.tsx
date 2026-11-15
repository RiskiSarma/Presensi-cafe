const statusConfig: Record<string, { label: string; className: string }> = {
  tepat_waktu: { label: "Tepat Waktu", className: "bg-success-soft text-success" },
  terlambat: { label: "Terlambat", className: "bg-warning-soft text-warning" },
  pulang_cepat: { label: "Pulang Cepat", className: "bg-warning-soft text-warning" },
  tidak_hadir: { label: "Tidak Hadir", className: "bg-danger-soft text-danger" },
  izin: { label: "Izin", className: "bg-espresso-soft text-espresso-dark" },
  sakit: { label: "Sakit", className: "bg-espresso-soft text-espresso-dark" },
  cuti: { label: "Cuti", className: "bg-espresso-soft text-espresso-dark" },
  pending: { label: "Menunggu", className: "bg-warning-soft text-warning" },
  disetujui: { label: "Disetujui", className: "bg-success-soft text-success" },
  ditolak: { label: "Ditolak", className: "bg-danger-soft text-danger" },
};

const dotColor: Record<string, string> = {
  tepat_waktu: "bg-success",
  terlambat: "bg-warning",
  pulang_cepat: "bg-warning",
  tidak_hadir: "bg-danger",
  izin: "bg-espresso",
  sakit: "bg-espresso",
  cuti: "bg-espresso",
  pending: "bg-warning",
  disetujui: "bg-success",
  ditolak: "bg-danger",
};

/** `menit` (opsional) = menit keterlambatan dari jam mulai shift, dipakai untuk status presensi. */
export default function StatusBadge({ status, menit }: { status: string; menit?: number | null }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-paper text-muted" };

  let label = config.label;
  if (menit && menit > 0) {
    if (status === "terlambat") label = `Terlambat ${menit} mnt`;
    else if (status === "tepat_waktu") label = `Hadir · telat ${menit} mnt`;
  }

  return (
    <span className={`inline-flex animate-fade-in items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor[status] ?? "bg-muted"}`} />
      {label}
    </span>
  );
}
