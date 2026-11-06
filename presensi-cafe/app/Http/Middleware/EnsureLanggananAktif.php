<?php

namespace App\Http\Middleware;

use App\Services\LanggananService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLanggananAktif
{
    public function __construct(protected LanggananService $langganan)
    {
    }

    /**
     * Blokir akses fitur kalau langganan bisnis sudah habis (lewat masa tenggang) atau bisnis di-suspend.
     * Dipakai untuk rute admin, pegawai, dan kiosk. Rute /langganan sengaja TIDAK dipasangi,
     * supaya admin tetap bisa membayar.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isSuperAdmin()) {
            return $next($request);
        }

        $bisnis = $this->langganan->bisnisDariRequest($request);

        if (! $bisnis) {
            return response()->json(['message' => 'Akun tidak terhubung ke bisnis manapun.'], 403);
        }

        $status = $this->langganan->status($bisnis);

        if ($status['akses']) {
            $request->attributes->set('bisnis', $bisnis);
            $request->attributes->set('status_langganan', $status['kode']);

            return $next($request);
        }

        $adalahAdmin = $user && $user->isAdmin();

        if ($status['kode'] === 'nonaktif') {
            $pesan = 'Akun bisnis ini sedang dinonaktifkan. Hubungi pengelola aplikasi.';
        } elseif ($adalahAdmin) {
            $pesan = $status['kode'] === 'tanpa_langganan'
                ? 'Bisnis Anda belum punya langganan aktif. Pilih paket di menu Langganan.'
                : 'Langganan Anda sudah berakhir. Perpanjang di menu Langganan untuk melanjutkan.';
        } else {
            $pesan = 'Layanan presensi cafe ini sedang tidak aktif. Silakan hubungi admin cafe.';
        }

        return response()->json([
            'message' => $pesan,
            'kode' => 'LANGGANAN_TIDAK_AKTIF',
            'status_langganan' => $status['kode'],
        ], $status['kode'] === 'nonaktif' ? 403 : 402);
    }
}
