export interface JadwalTukar {
  id: number;
  tanggal: string;
  shift: { nama_shift: string; jam_mulai: string; jam_selesai: string };
}

export interface TukarShift {
  id: number;
  status: string;
  alasan: string | null;
  catatan_admin: string | null;
  pemohon: { user: { name: string } };
  target: { user: { name: string } };
  jadwal_pemohon: JadwalTukar;
  jadwal_target: JadwalTukar;
}

export function labelJadwal(j: JadwalTukar): string {
  const tgl = new Date(j.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
  return `${tgl} · ${j.shift.nama_shift} ${j.shift.jam_mulai.slice(0, 5)}-${j.shift.jam_selesai.slice(0, 5)}`;
}
