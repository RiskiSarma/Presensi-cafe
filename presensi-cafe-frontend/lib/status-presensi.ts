/** Teks status presensi yang ramah dibaca, lengkap dengan menit keterlambatan. */
export function labelStatusPresensi(status: string, menit?: number | null): string {
  const m = menit ?? 0;
  if (status === "terlambat") return m > 0 ? `Terlambat ${m} menit` : "Terlambat";
  if (status === "tepat_waktu") return m > 0 ? `Hadir, telat ${m} menit (dalam toleransi)` : "Tepat waktu";
  return status.replace(/_/g, " ");
}
