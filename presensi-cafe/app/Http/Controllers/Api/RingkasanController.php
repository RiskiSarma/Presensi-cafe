<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bisnis;
use App\Models\PembayaranLangganan;
use App\Services\LanggananService;

/** Khusus super admin: angka kesehatan bisnis langganan (pelanggan, pendapatan, trial). */
class RingkasanController extends Controller
{
    public function index(LanggananService $service)
    {
        $hitung = ['trial' => 0, 'aktif' => 0, 'grace' => 0, 'kedaluwarsa' => 0, 'nonaktif' => 0, 'tanpa_langganan' => 0];
        $distribusi = [];
        $segera = [];
        $mrr = 0.0;

        foreach (Bisnis::all() as $b) {
            $st = $service->status($b);
            $l = $st['langganan'];
            $hitung[$st['kode']]++;

            if ($l && in_array($st['kode'], ['aktif', 'grace'], true)) {
                $mrr += $l->siklus === 'tahunan' ? $l->paket->harga_tahunan / 12 : $l->paket->harga_bulanan;
                $distribusi[$l->paket->nama] = ($distribusi[$l->paket->nama] ?? 0) + 1;
            }

            if ($l && in_array($st['kode'], ['trial', 'aktif'], true) && $st['sisa_hari'] <= 7) {
                $segera[] = [
                    'bisnis_id' => $b->id,
                    'nama_bisnis' => $b->nama_bisnis,
                    'email_owner' => $b->email_owner,
                    'jenis' => $st['kode'],
                    'paket' => $l->paket->nama,
                    'sisa_hari' => max($st['sisa_hari'], 0),
                    'berakhir_at' => $l->berakhir_at->toIso8601String(),
                ];
            }
        }

        usort($segera, fn ($a, $b) => $a['sisa_hari'] <=> $b['sisa_hari']);

        // Pendapatan 6 bulan terakhir (nominal yang benar-benar diterima, termasuk kode unik)
        $awal = now()->startOfMonth()->subMonths(5);
        $perBulan = [];
        for ($i = 0; $i < 6; $i++) {
            $kunci = $awal->copy()->addMonths($i)->format('Y-m');
            $perBulan[$kunci] = 0;
        }

        $lunas = PembayaranLangganan::where('status', 'lunas')
            ->whereNotNull('dikonfirmasi_at')
            ->where('dikonfirmasi_at', '>=', $awal)
            ->get(['jumlah_total', 'dikonfirmasi_at']);

        foreach ($lunas as $p) {
            $kunci = $p->dikonfirmasi_at->format('Y-m');
            if (array_key_exists($kunci, $perBulan)) {
                $perBulan[$kunci] += $p->jumlah_total;
            }
        }

        $grafik = [];
        foreach ($perBulan as $kunci => $jumlah) {
            $grafik[] = ['bulan' => $kunci, 'jumlah' => $jumlah];
        }

        $totalBisnis = Bisnis::count();
        $pernahBayar = PembayaranLangganan::where('status', 'lunas')->distinct()->count('bisnis_id');

        return response()->json([
            'total_bisnis' => $totalBisnis,
            'status' => $hitung,
            'mrr' => (int) round($mrr),
            'pendapatan_bulan_ini' => (int) end($perBulan),
            'pendapatan_total' => (int) PembayaranLangganan::where('status', 'lunas')->sum('jumlah_total'),
            'grafik' => $grafik,
            'distribusi_paket' => collect($distribusi)->map(fn ($n, $nama) => ['paket' => $nama, 'jumlah' => $n])->values(),
            'konversi' => [
                'pernah_bayar' => $pernahBayar,
                'total' => $totalBisnis,
                'persen' => $totalBisnis ? round($pernahBayar / $totalBisnis * 100) : 0,
            ],
            'menunggu_verifikasi' => PembayaranLangganan::where('status', 'menunggu_konfirmasi')->count(),
            'segera_berakhir' => $segera,
        ]);
    }
}
