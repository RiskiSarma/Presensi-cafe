#!/usr/bin/env node
/**
 * Mengganti ikon cangkir kopi (Coffee) dan Layers di seluruh frontend dengan logo brand.
 *
 * Jalankan dari folder frontend (yang berisi package.json):
 *   node scripts/ganti-logo.mjs --dry     -> hanya melihat apa yang akan diganti
 *   node scripts/ganti-logo.mjs           -> ganti sungguhan (file asli dicadangkan di .backup-logo/)
 *
 * Aman dijalankan berulang: file yang sudah diganti dilewati.
 */
import fs from "node:fs";
import path from "node:path";

const akar = process.cwd();
const dry = process.argv.includes("--dry");
const folderCadangan = path.join(akar, ".backup-logo");
const IMPOR_LOGO = 'import { LogoMark } from "@/components/ui/Logo";';

function* cariTsx(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* cariTsx(p);
    else if (e.name.endsWith(".tsx")) yield p;
  }
}

/** Naikkan angka ukuran Tailwind satu tingkat: h-5 -> h-6 (supaya logo sedikit lebih besar dari ikon garis). */
function naikkan(cls) {
  return cls
    .split(/\s+/)
    .filter((c) => /^[hw]-\d+$/.test(c))
    .map((c) => c.replace(/-(\d+)/, (_, n) => `-${Math.min(parseInt(n, 10) + 1, 16)}`))
    .join(" ");
}

function ubahFile(src) {
  const reIkon = /<(Coffee|Layers)\b([^>]*?)\/>/g;
  const cocok = [...src.matchAll(reIkon)];
  if (!cocok.length) return null;

  let out = src;
  let jumlah = 0;

  for (const m of cocok.reverse()) {
    const className = (m[2].match(/className="([^"]*)"/) || [])[1] ?? "";
    const mulaiPotongan = Math.max(0, m.index - 900);
    const sebelum = out.slice(mulaiPotongan, m.index);
    const induk = sebelum.match(/<(span|div|Link|a|button)\b((?:[^<>]|=>)*?)>(\s*)$/);

    let pengganti;
    let awal = m.index;
    let tagBaru = null;

    const kelasInduk = induk ? (induk[2].match(/className="([^"]*)"/) || [])[1] : undefined;
    const modeKotak = kelasInduk !== undefined && /\bbg-/.test(kelasInduk) && /\bh-\d+/.test(kelasInduk) && /\bw-\d+/.test(kelasInduk);

    if (modeKotak) {
      // Ikon berada di dalam kotak berlatar (emas/krem transparan): kotak dijadikan putih, logo mengisi kotak
      const kelasBaru = kelasInduk
        .replace(/\bbg-(?:bistro|espresso|forest)-gradient\b/g, "bg-white ring-1 ring-black/5")
        .replace(/\bbg-cream\/\d+\b/g, "bg-white ring-1 ring-black/5")
        .replace(/\btext-cream\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const tagAsli = "<" + induk[1] + induk[2] + ">";
      tagBaru = tagAsli.replace(`className="${kelasInduk}"`, `className="${kelasBaru}"`);
      awal = mulaiPotongan + induk.index;
      pengganti = tagBaru + induk[3] + '<LogoMark className="h-full w-full p-1" />';
    } else {
      const ukuran = naikkan(className) || "h-6 w-6";
      pengganti = `<LogoMark className="${ukuran}" />`;
    }

    out = out.slice(0, awal) + pengganti + out.slice(m.index + m[0].length);
    jumlah++;
  }

  // Tambahkan impor LogoMark setelah impor terakhir
  if (!out.includes("components/ui/Logo")) {
    const impor = [...out.matchAll(/^import\b[^;]*?;$/gm)];
    const akhir = impor[impor.length - 1];
    const posisi = akhir ? akhir.index + akhir[0].length : 0;
    out = out.slice(0, posisi) + "\n" + IMPOR_LOGO + out.slice(posisi);
  }

  // Buang Coffee / Layers dari impor lucide-react kalau sudah tidak dipakai
  for (const nama of ["Coffee", "Layers"]) {
    const reImporLucide = /import\s*\{([^}]*)\}\s*from\s*["']lucide-react["'];?/;
    const mi = out.match(reImporLucide);
    if (!mi) continue;
    const tanpaImpor = out.replace(mi[0], "");
    if (new RegExp(`\\b${nama}\\b`).test(tanpaImpor)) continue; // masih dipakai di tempat lain
    const sisa = mi[1].split(",").map((s) => s.trim()).filter((s) => s && s !== nama);
    const baru = sisa.length ? `import { ${sisa.join(", ")} } from "lucide-react";` : "";
    out = out.replace(mi[0], baru);
  }

  return { hasil: out, jumlah };
}

let totalFile = 0;
let totalGanti = 0;
const dilewati = [];

for (const folder of ["app", "components"]) {
  for (const file of cariTsx(path.join(akar, folder))) {
    const rel = path.relative(akar, file);
    if (rel.replace(/\\/g, "/") === "components/ui/Logo.tsx") continue;
    const src = fs.readFileSync(file, "utf8");
    if (src.includes("components/ui/Logo")) {
      if (/<(Coffee|Layers)\b/.test(src)) dilewati.push(rel + "  (sudah memakai Logo, tapi masih ada ikon lama, cek manual)");
      continue;
    }
    const r = ubahFile(src);
    if (!r) continue;
    totalFile++;
    totalGanti += r.jumlah;
    console.log(`${dry ? "[dry] " : ""}${rel}: ${r.jumlah} ikon diganti`);
    if (!dry) {
      const cadangan = path.join(folderCadangan, rel);
      fs.mkdirSync(path.dirname(cadangan), { recursive: true });
      fs.copyFileSync(file, cadangan);
      fs.writeFileSync(file, r.hasil);
    }
  }
}

console.log(`\nSelesai: ${totalGanti} ikon di ${totalFile} file${dry ? " (simulasi, belum ada yang diubah)" : ""}.`);
if (dilewati.length) console.log("Perlu dicek manual:\n - " + dilewati.join("\n - "));
if (!dry && totalFile) console.log("File asli dicadangkan di folder .backup-logo/ (hapus kalau sudah yakin).");
