<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HariLibur;
use App\Models\JadwalShift;
use App\Models\PegawaiProfil;
use App\Models\Presensi;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class RekapController extends Controller
{
    /** Rekap presensi per pegawai untuk satu bulan: hadir, terlambat, izin, alpha, jam kerja, lembur. */
    public function bulanan(Request $request)
    {
        $request->validate([
            'bulan' => ['nullable', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'cabang_id' => 'nullable|integer',
        ]);

        $bulan = $request->input('bulan', now()->format('Y-m'));
        $mulai = Carbon::createFromFormat('Y-m-d', $bulan . '-01')->startOfDay();
        $selesai = $mulai->copy()->endOfMonth();
        $rentang = [$mulai->toDateString(), $selesai->toDateString()];
        $bisnisId = $request->user()->bisnis_id;
        $hariIni = today();

        $milikBisnis = fn ($q) => $q->where('bisnis_id', $bisnisId);

        $presensis = Presensi::whereBetween('tanggal', $rentang)
            ->whereHas('pegawaiProfil.cabang', $milikBisnis)
            ->get()
            ->groupBy('pegawai_profil_id');

        $jadwals = JadwalShift::whereBetween('tanggal', $rentang)
            ->whereHas('pegawaiProfil.cabang', $milikBisnis)
            ->get()
            ->groupBy('pegawai_profil_id');

        // Pegawai aktif, ditambah pegawai nonaktif yang masih punya data di bulan ini
        $idAdaData = $presensis->keys()->merge($jadwals->keys())->unique()->all();

        $pegawaiList = PegawaiProfil::with(['user:id,name', 'cabang:id,nama_cabang'])
            ->whereHas('cabang', $milikBisnis)
            ->when($request->cabang_id, fn ($q, $id) => $q->where('cabang_id', $id))
            ->where(fn ($q) => $q->where('status_aktif', true)->orWhereIn('id', $idAdaData))
            ->get();

        $libur = HariLibur::where('bisnis_id', $bisnisId)
            ->whereBetween('tanggal', $rentang)
            ->get()
            ->map(fn ($h) => $h->tanggal->toDateString())
            ->all();

        $baris = $pegawaiList->map(function (PegawaiProfil $peg) use ($presensis, $jadwals, $hariIni, $libur) {
            $p = $presensis->get($peg->id, collect());
            $j = $jadwals->get($peg->id, collect());

            $hadirRows = $p->filter(fn ($r) => $r->jam_masuk !== null);

            $menitKerja = $hadirRows->sum(function ($r) {
                if (! $r->jam_pulang) {
                    return 0;
                }

                return max(0, (int) round(($r->jam_pulang->getTimestamp() - $r->jam_masuk->getTimestamp()) / 60));
            });

            // Alpha = hari terjadwal yang sudah lewat tanpa presensi/izin, ditambah yang ditandai "tidak hadir" manual
            $tertutup = $p->filter(fn ($r) => $r->jam_masuk !== null || in_array($r->status, ['izin', 'sakit', 'cuti'], true))
                ->map(fn ($r) => $r->tanggal->toDateString())
                ->all();

            $alphaJadwal = $j->filter(fn ($x) => $x->tanggal->lt($hariIni))
                ->map(fn ($x) => $x->tanggal->toDateString())
                ->reject(fn ($d) => in_array($d, $tertutup, true) || in_array($d, $libur, true));

            $tidakHadir = $p->where('status', 'tidak_hadir')->map(fn ($r) => $r->tanggal->toDateString());

            return [
                'pegawai_profil_id' => $peg->id,
                'nama' => $peg->user?->name,
                'jabatan' => $peg->jabatan,
                'cabang' => $peg->cabang?->nama_cabang,
                'status_aktif' => (bool) $peg->status_aktif,
                'hari_terjadwal' => $j->count(),
                'hadir' => $hadirRows->count(),
                'tepat_waktu' => $p->where('status', 'tepat_waktu')->count(),
                'terlambat' => $p->where('status', 'terlambat')->count(),
                'pulang_cepat' => $p->where('status', 'pulang_cepat')->count(),
                'izin' => $p->where('status', 'izin')->count(),
                'sakit' => $p->where('status', 'sakit')->count(),
                'cuti' => $p->where('status', 'cuti')->count(),
                'alpha' => $alphaJadwal->merge($tidakHadir)->unique()->count(),
                'menit_kerja' => (int) $menitKerja,
                'lembur_menit' => (int) $p->sum('lembur_menit'),
            ];
        })->sortBy('nama', SORT_NATURAL | SORT_FLAG_CASE)->values();

        $total = [];
        foreach (['hari_terjadwal', 'hadir', 'terlambat', 'pulang_cepat', 'izin', 'sakit', 'cuti', 'alpha', 'menit_kerja', 'lembur_menit'] as $k) {
            $total[$k] = (int) $baris->sum($k);
        }

        return response()->json([
            'bulan' => $bulan,
            'mulai' => $rentang[0],
            'selesai' => $rentang[1],
            'hari_libur' => count($libur),
            'total' => $total,
            'pegawai' => $baris,
        ]);
    }
}
