"use client";

import { useEffect, useState } from "react";
import { Download, Printer, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { pesanError } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface BarisRekap {
  pegawai_profil_id: number;
  nama: string;
  jabatan: string;
  cabang: string | null;
  status_aktif: boolean;
  hari_terjadwal: number;
  hadir: number;
  tepat_waktu: number;
  terlambat: number;
  pulang_cepat: number;
  izin: number;
  sakit: number;
  cuti: number;
  alpha: number;
  menit_kerja: number;
  lembur_menit: number;
}

interface HasilRekap {
  bulan: string;
  hari_libur: number;
  total: Record<string, number>;
  pegawai: BarisRekap[];
}

interface CabangOpsi {
  id: number;
  nama_cabang: string;
}

const namaBulan = (bulan: string) =>
  new Date(`${bulan}-01T00:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

const jam = (menit: number) => `${Math.floor(menit / 60)}j ${menit % 60}m`;

export default function AdminRekapPage() {
  const { user } = useAuth();
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7));
  const [cabangId, setCabangId] = useState("");
  const [cabangList, setCabangList] = useState<CabangOpsi[]>([]);
  const [hasil, setHasil] = useState<HasilRekap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mengunduh, setMengunduh] = useState(false);

  useEffect(() => {
    api.get("/cabang").then(({ data }) => setCabangList(data));
  }, []);

  useEffect(() => {
    if (!bulan) return;
    setLoading(true);
    setError(null);
    api
      .get("/rekap/bulanan", { params: { bulan, cabang_id: cabangId || undefined } })
      .then(({ data }) => setHasil(data))
      .catch((err) => setError(pesanError(err, "Gagal memuat rekap.")))
      .finally(() => setLoading(false));
  }, [bulan, cabangId]);

  const namaCabangTerpilih = cabangList.find((c) => String(c.id) === cabangId)?.nama_cabang ?? "Semua cabang";

  /** File Excel (.xlsx) berformat: judul, header berwarna, kolom lebar pas, jam kerja bisa dijumlah. */
  async function unduhExcel() {
    if (!hasil) return;
    setMengunduh(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Rekap Presensi", {
        views: [{ state: "frozen", xSplit: 2, ySplit: 6 }],
        pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
      });

      const kolom = [
        { h: "No", w: 5 },
        { h: "Nama", w: 26 },
        { h: "Jabatan", w: 14 },
        { h: "Cabang", w: 18 },
        { h: "Hari Terjadwal", w: 11 },
        { h: "Hadir", w: 8 },
        { h: "Tepat Waktu", w: 11 },
        { h: "Terlambat", w: 10 },
        { h: "Pulang Cepat", w: 11 },
        { h: "Izin", w: 7 },
        { h: "Sakit", w: 7 },
        { h: "Cuti", w: 7 },
        { h: "Alpha", w: 8 },
        { h: "Jam Kerja", w: 12 },
        { h: "Lembur", w: 12 },
      ];
      ws.columns = kolom.map((k) => ({ width: k.w }));
      const akhir = kolom.length;

      ws.mergeCells(1, 1, 1, akhir);
      ws.getCell("A1").value = "REKAP PRESENSI PEGAWAI";
      ws.getCell("A1").font = { bold: true, size: 15, color: { argb: "FF2F4A2A" } };
      ws.getCell("A2").value = user?.bisnis?.nama_bisnis ?? "";
      ws.getCell("A2").font = { bold: true, size: 12 };
      ws.getCell("A3").value = `Periode: ${namaBulan(hasil.bulan)}   |   Cabang: ${namaCabangTerpilih}`;
      ws.getCell("A4").value = `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}   |   Hari libur di bulan ini: ${hasil.hari_libur}`;
      ws.getCell("A3").font = { size: 11 };
      ws.getCell("A4").font = { size: 10, color: { argb: "FF6B6459" } };

      const garis = { style: "thin" as const, color: { argb: "FFD9D3C7" } };
      const border = { top: garis, left: garis, bottom: garis, right: garis };

      const header = ws.getRow(6);
      kolom.forEach((k, i) => {
        const c = header.getCell(i + 1);
        c.value = k.h;
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A5F3D" } };
        c.alignment = { horizontal: i < 4 ? "left" : "center", vertical: "middle", wrapText: true };
        c.border = border;
      });
      header.height = 32;

      const menitKeHari = (m: number) => m / 1440; // Excel menyimpan waktu sebagai pecahan hari

      hasil.pegawai.forEach((p, idx) => {
        const r = ws.getRow(7 + idx);
        const nilai = [
          idx + 1, p.nama + (p.status_aktif ? "" : " (nonaktif)"), p.jabatan, p.cabang ?? "-",
          p.hari_terjadwal, p.hadir, p.tepat_waktu, p.terlambat, p.pulang_cepat,
          p.izin, p.sakit, p.cuti, p.alpha, menitKeHari(p.menit_kerja), menitKeHari(p.lembur_menit),
        ];
        nilai.forEach((v, i) => {
          const c = r.getCell(i + 1);
          c.value = v;
          c.border = border;
          c.alignment = { horizontal: i >= 1 && i < 4 ? "left" : "center", vertical: "middle" };
          if (idx % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F4EE" } };
          if (i >= 13) c.numFmt = "[h]:mm";
        });
        if (p.alpha > 0) r.getCell(13).font = { bold: true, color: { argb: "FFB3261E" } };
        if (p.terlambat > 0) r.getCell(8).font = { color: { argb: "FFB26A00" } };
      });

      // Baris total dengan rumus SUM, supaya ikut menyesuaikan kalau Anda mengedit angka
      const awalData = 7;
      const akhirData = 6 + hasil.pegawai.length;
      const barisTotal = ws.getRow(akhirData + 1);
      barisTotal.getCell(2).value = "TOTAL";
      for (let col = 5; col <= akhir; col++) {
        const huruf = ws.getColumn(col).letter;
        const kunci = ["hari_terjadwal", "hadir", "tepat_waktu", "terlambat", "pulang_cepat", "izin", "sakit", "cuti", "alpha", "menit_kerja", "lembur_menit"][col - 5];
        const totalMenit = kunci === "menit_kerja" || kunci === "lembur_menit";
        const hitung = hasil.pegawai.reduce((n, p) => n + (p[kunci as keyof BarisRekap] as number), 0);
        barisTotal.getCell(col).value = {
          formula: hasil.pegawai.length ? `SUM(${huruf}${awalData}:${huruf}${akhirData})` : "0",
          result: totalMenit ? menitKeHari(hitung) : hitung,
        };
        if (totalMenit) barisTotal.getCell(col).numFmt = "[h]:mm";
      }
      for (let col = 1; col <= akhir; col++) {
        const c = barisTotal.getCell(col);
        c.font = { bold: true };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEADFC2" } };
        c.border = border;
        c.alignment = { horizontal: col <= 4 ? "left" : "center", vertical: "middle" };
      }

      const catatan = ws.getRow(akhirData + 3);
      catatan.getCell(1).value =
        "Catatan: Alpha = hari terjadwal yang sudah lewat tanpa presensi atau izin (hari libur tidak dihitung), ditambah hari yang ditandai tidak hadir. Jam Kerja dihitung dari jam masuk sampai pulang.";
      catatan.getCell(1).font = { italic: true, size: 9, color: { argb: "FF6B6459" } };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap-presensi-${hasil.bulan}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Gagal membuat file Excel. Coba lagi.");
    } finally {
      setMengunduh(false);
    }
  }

  const total = hasil?.total;

  return (
    <div className="p-4 md:p-8">
      {/* ========== TAMPILAN LAYAR (tidak ikut tercetak) ========== */}
      <div className="print:hidden">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-ink">Rekap Bulanan</h1>
          <p className="text-sm text-muted">Ringkasan kehadiran, keterlambatan, dan lembur tiap pegawai</p>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Input type="month" label="Bulan" value={bulan} onChange={(e) => setBulan(e.target.value)} max={new Date().toISOString().slice(0, 7)} />
          {cabangList.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Cabang</label>
              <select
                value={cabangId}
                onChange={(e) => setCabangId(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20"
              >
                <option value="">Semua cabang</option>
                {cabangList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama_cabang}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={unduhExcel} isLoading={mengunduh} disabled={!hasil || hasil.pegawai.length === 0}>
              <Download className="h-4 w-4" />
              Unduh Excel
            </Button>
            <Button variant="secondary" onClick={() => window.print()} disabled={!hasil || hasil.pegawai.length === 0}>
              <Printer className="h-4 w-4" />
              Cetak / PDF
            </Button>
          </div>
        </div>

        {error && <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-espresso" />
          </div>
        )}

        {!loading && hasil && total && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kartu label="Total hadir" nilai={`${total.hadir} hari`} />
              <Kartu label="Terlambat" nilai={`${total.terlambat} kali`} />
              <Kartu label="Alpha" nilai={`${total.alpha} hari`} peringatan={total.alpha > 0} />
              <Kartu label="Total lembur" nilai={jam(total.lembur_menit)} />
            </div>

            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Pegawai</th>
                    <th className="px-3 py-3 text-center font-medium">Jadwal</th>
                    <th className="px-3 py-3 text-center font-medium">Hadir</th>
                    <th className="px-3 py-3 text-center font-medium">Terlambat</th>
                    <th className="px-3 py-3 text-center font-medium">Pulang cepat</th>
                    <th className="px-3 py-3 text-center font-medium">Izin</th>
                    <th className="px-3 py-3 text-center font-medium">Sakit</th>
                    <th className="px-3 py-3 text-center font-medium">Cuti</th>
                    <th className="px-3 py-3 text-center font-medium">Alpha</th>
                    <th className="px-3 py-3 text-right font-medium">Jam kerja</th>
                    <th className="px-4 py-3 text-right font-medium">Lembur</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.pegawai.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-muted">
                        Belum ada data pegawai atau presensi di bulan ini.
                      </td>
                    </tr>
                  )}
                  {hasil.pegawai.map((p) => (
                    <tr key={p.pegawai_profil_id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-ink">
                        {p.nama}
                        {!p.status_aktif && <span className="ml-1.5 text-xs text-muted">(nonaktif)</span>}
                        <p className="text-xs capitalize text-muted">
                          {p.jabatan}
                          {p.cabang ? ` · ${p.cabang}` : ""}
                        </p>
                      </td>
                      <Sel nilai={p.hari_terjadwal} />
                      <Sel nilai={p.hadir} tebal />
                      <Sel nilai={p.terlambat} sorot={p.terlambat > 0 ? "text-warning" : ""} />
                      <Sel nilai={p.pulang_cepat} />
                      <Sel nilai={p.izin} />
                      <Sel nilai={p.sakit} />
                      <Sel nilai={p.cuti} />
                      <Sel nilai={p.alpha} sorot={p.alpha > 0 ? "text-danger font-semibold" : ""} />
                      <td className="px-3 py-3 text-right font-mono text-ink">{jam(p.menit_kerja)}</td>
                      <td className="px-4 py-3 text-right font-mono text-ink">{p.lembur_menit ? jam(p.lembur_menit) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <p className="mt-3 text-xs leading-relaxed text-muted">
              Alpha = hari terjadwal yang sudah lewat tanpa presensi atau izin (hari libur tidak dihitung), ditambah hari yang ditandai &quot;tidak hadir&quot;. Jam
              kerja dihitung dari jam masuk sampai pulang.
              {hasil.hari_libur > 0 && ` Bulan ini ada ${hasil.hari_libur} hari libur.`}
            </p>
          </>
        )}
      </div>

      {/* ========== DOKUMEN CETAK (hanya muncul saat Cetak / PDF) ========== */}
      {hasil && (
        <div className="print-landscape hidden text-black print:block">
          <div className="mb-3 border-b-2 border-black pb-2">
            <h1 className="text-xl font-bold uppercase tracking-wide">Rekap Presensi Pegawai</h1>
            <p className="text-sm font-semibold">{user?.bisnis?.nama_bisnis}</p>
            <p className="text-xs">
              Periode: {namaBulan(hasil.bulan)} &nbsp;|&nbsp; Cabang: {namaCabangTerpilih} &nbsp;|&nbsp; Dicetak:{" "}
              {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-gray-200">
                {["No", "Nama", "Jabatan", "Jadwal", "Hadir", "Telat", "Plg Cepat", "Izin", "Sakit", "Cuti", "Alpha", "Jam Kerja", "Lembur"].map((h, i) => (
                  <th key={h} className={`border border-black px-1.5 py-1 ${i < 3 ? "text-left" : "text-center"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hasil.pegawai.map((p, i) => (
                <tr key={p.pegawai_profil_id}>
                  <td className="border border-black px-1.5 py-1 text-center">{i + 1}</td>
                  <td className="border border-black px-1.5 py-1">{p.nama}</td>
                  <td className="border border-black px-1.5 py-1 capitalize">{p.jabatan}</td>
                  {[p.hari_terjadwal, p.hadir, p.terlambat, p.pulang_cepat, p.izin, p.sakit, p.cuti, p.alpha].map((n, k) => (
                    <td key={k} className="border border-black px-1.5 py-1 text-center">
                      {n || "-"}
                    </td>
                  ))}
                  <td className="border border-black px-1.5 py-1 text-center">{jam(p.menit_kerja)}</td>
                  <td className="border border-black px-1.5 py-1 text-center">{p.lembur_menit ? jam(p.lembur_menit) : "-"}</td>
                </tr>
              ))}
              {total && (
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={3} className="border border-black px-1.5 py-1 text-right">
                    TOTAL
                  </td>
                  {[total.hari_terjadwal, total.hadir, total.terlambat, total.pulang_cepat, total.izin, total.sakit, total.cuti, total.alpha].map((n, k) => (
                    <td key={k} className="border border-black px-1.5 py-1 text-center">
                      {n}
                    </td>
                  ))}
                  <td className="border border-black px-1.5 py-1 text-center">{jam(total.menit_kerja)}</td>
                  <td className="border border-black px-1.5 py-1 text-center">{jam(total.lembur_menit)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="mt-2 text-[10px]">
            Alpha = hari terjadwal yang sudah lewat tanpa presensi atau izin (hari libur tidak dihitung). Jam kerja dihitung dari jam masuk sampai pulang.
          </p>

          <div className="mt-10 flex justify-end gap-24 pr-10 text-xs">
            <div className="text-center">
              <p>Dibuat oleh,</p>
              <div className="h-16" />
              <p className="border-t border-black px-6 pt-1">Admin</p>
            </div>
            <div className="text-center">
              <p>Mengetahui,</p>
              <div className="h-16" />
              <p className="border-t border-black px-6 pt-1">Pemilik</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kartu({ label, nilai, peringatan }: { label: string; nilai: string; peringatan?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${peringatan ? "text-danger" : "text-ink"}`}>{nilai}</p>
    </Card>
  );
}

function Sel({ nilai, tebal, sorot }: { nilai: number; tebal?: boolean; sorot?: string }) {
  return <td className={`px-3 py-3 text-center ${sorot || "text-ink"} ${tebal ? "font-semibold" : ""}`}>{nilai || "-"}</td>;
}
