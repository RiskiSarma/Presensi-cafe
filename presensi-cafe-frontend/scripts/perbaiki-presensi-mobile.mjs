#!/usr/bin/env node
/**
 * Halaman presensi mobile: cari lokasi GPS PARALEL dengan pengambilan foto.
 * Sebelumnya GPS dicari dulu (bisa 2-10 detik) baru kamera mengambil foto, jadi saat foto diambil
 * pegawai sudah berpaling atau bergerak, dan wajah gagal dikenali. Rekaman kedip mata juga baru mulai
 * setelah jeda yang tidak terduga.
 *
 * Jalankan dari folder frontend:  node scripts/perbaiki-presensi-mobile.mjs
 */
import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "app/presensi/page.tsx");
if (!fs.existsSync(file)) {
  console.log("app/presensi/page.tsx tidak ditemukan. Jalankan dari folder frontend.");
  process.exit(1);
}

let s = fs.readFileSync(file, "utf8");
if (s.includes("posisiPromise")) {
  console.log("Sudah diterapkan, dilewati.");
  process.exit(0);
}

const a = "const position = await getLocation();";
const b = "const formData = new FormData();";
if (s.split(a).length !== 2 || s.split(b).length !== 2) {
  console.log("Pola kode tidak cocok (file sudah berbeda dari yang saya kenal). Tidak ada yang diubah, tolong kirim file ini.");
  process.exit(1);
}

s = s.replace(a, "const posisiPromise = getLocation();\n      posisiPromise.catch(() => undefined); // GPS dicari paralel supaya foto langsung diambil");
s = s.replace(b, "const position = await posisiPromise;\n      const formData = new FormData();");

fs.mkdirSync(path.join(process.cwd(), ".backup-presensi"), { recursive: true });
fs.copyFileSync(file, path.join(process.cwd(), ".backup-presensi/page.tsx"));
fs.writeFileSync(file, s);
console.log("OK: app/presensi/page.tsx diperbaiki (cadangan di .backup-presensi/).");
