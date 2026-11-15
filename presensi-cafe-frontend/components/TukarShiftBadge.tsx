const label: Record<string, { teks: string; kelas: string }> = {
  menunggu_rekan: { teks: "Menunggu rekan", kelas: "bg-warning-soft text-warning" },
  ditolak_rekan: { teks: "Ditolak rekan", kelas: "bg-danger-soft text-danger" },
  menunggu_admin: { teks: "Menunggu admin", kelas: "bg-warning-soft text-warning" },
  disetujui: { teks: "Disetujui", kelas: "bg-success-soft text-success" },
  ditolak_admin: { teks: "Ditolak admin", kelas: "bg-danger-soft text-danger" },
  dibatalkan: { teks: "Dibatalkan", kelas: "bg-paper text-muted" },
};

export default function TukarShiftBadge({ status }: { status: string }) {
  const l = label[status] ?? { teks: status, kelas: "bg-paper text-muted" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${l.kelas}`}>{l.teks}</span>;
}
