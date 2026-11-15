#!/usr/bin/env node
/**
 * Menampilkan menit keterlambatan di struk absen, layar kiosk, dan daftar presensi.
 * Jalankan dari folder frontend:  node scripts/terapkan-status-menit.mjs
 * (file asli dicadangkan di .backup-status/; aman dijalankan ulang)
 */
import fs from "node:fs";
import path from "node:path";

const IMPOR = 'import { labelStatusPresensi } from "@/lib/status-presensi";';

const aturan = [
  {
    file: "app/presensi/page.tsx",
    impor: true,
    ganti: [
      [/useState<\{ jam: string; status: string \} \| null>/, "useState<{ jam: string; status: string; menit: number } | null>"],
      [/status: presensi\.status,(\s*)\}\);(\s*)setResult\("success"\)/, 'status: presensi.status,\n        menit: presensi.menit_terlambat ?? 0,$1});$2setResult("success")'],
      [/\{successData\.status\.replace\("_", " "\)\}/, "{labelStatusPresensi(successData.status, successData.menit)}"],
    ],
  },
  {
    file: "app/kiosk/page.tsx",
    impor: true,
    ganti: [
      [/(interface HasilPresensi \{[^}]*?status: string;)/, "$1\n  menit?: number;"],
      [/status: presensi\.status,(\s*)\}\);(\s*)setMode\("success"\)/, 'status: presensi.status,\n        menit: presensi.menit_terlambat ?? 0,$1});$2setMode("success")'],
      [/\{hasil\.status\.replace\("_", " "\)\}/, "{labelStatusPresensi(hasil.status, hasil.menit)}"],
    ],
  },
  ...["app/admin/page.tsx", "app/admin/presensi/page.tsx", "app/pegawai/page.tsx"].map((file) => ({
    file,
    impor: false,
    ganti: [
      [/(interface (?:PresensiRow|Presensi) \{[\s\S]*?\n  status: string;)/, "$1\n  menit_terlambat?: number | null;"],
      [/<StatusBadge status=\{p\.status\} \/>/, "<StatusBadge status={p.status} menit={p.menit_terlambat} />"],
    ],
  })),
];

let masalah = 0;
for (const a of aturan) {
  const p = path.join(process.cwd(), a.file);
  if (!fs.existsSync(p)) {
    console.log(`- ${a.file}: TIDAK DITEMUKAN`);
    masalah++;
    continue;
  }
  let s = fs.readFileSync(p, "utf8");
  if (s.includes("menit_terlambat")) {
    console.log(`- ${a.file}: sudah diterapkan, dilewati`);
    continue;
  }
  const gagal = [];
  a.ganti.forEach(([cari, ganti], i) => {
    if (cari.test(s)) s = s.replace(cari, ganti);
    else gagal.push(i + 1);
  });
  if (a.impor && !s.includes("status-presensi")) {
    const impor = [...s.matchAll(/^import\b[^;]*?;$/gm)];
    const akhir = impor[impor.length - 1];
    s = s.slice(0, akhir.index + akhir[0].length) + "\n" + IMPOR + s.slice(akhir.index + akhir[0].length);
  }
  if (gagal.length) {
    console.log(`- ${a.file}: ada ${gagal.length} bagian TIDAK COCOK (nomor ${gagal.join(", ")}). File tidak diubah, tolong kirim file ini.`);
    masalah++;
    continue;
  }
  const cadangan = path.join(process.cwd(), ".backup-status", a.file);
  fs.mkdirSync(path.dirname(cadangan), { recursive: true });
  fs.copyFileSync(p, cadangan);
  fs.writeFileSync(p, s);
  console.log(`- ${a.file}: OK`);
}
console.log(masalah ? `\n${masalah} file perlu dicek manual.` : "\nSelesai, semua bagian cocok.");
