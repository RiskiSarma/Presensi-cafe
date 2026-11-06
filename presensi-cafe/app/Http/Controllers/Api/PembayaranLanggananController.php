<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PembayaranLangganan;
use App\Services\LanggananService;
use Illuminate\Http\Request;

/** Khusus super admin: verifikasi pembayaran langganan yang masuk. */
class PembayaranLanggananController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            PembayaranLangganan::with(['bisnis:id,nama_bisnis,email_owner', 'paket:id,nama,kode'])
                ->when($request->status, fn ($q) => $q->where('status', $request->status))
                ->latest()
                ->limit(100)
                ->get()
                ->makeHidden('snap_token')
        );
    }

    public function konfirmasi(Request $request, PembayaranLangganan $pembayaran, LanggananService $service)
    {
        $langganan = $service->selesaikanPembayaran($pembayaran, $request->user()->id);

        if (! $langganan) {
            return response()->json(['message' => 'Pembayaran ini sudah diproses sebelumnya.'], 422);
        }

        return response()->json($pembayaran->fresh()->load(['bisnis:id,nama_bisnis', 'paket:id,nama']));
    }

    public function tolak(Request $request, PembayaranLangganan $pembayaran)
    {
        $validated = $request->validate(['alasan' => 'required|string|max:255']);

        if (! $pembayaran->terbuka()) {
            return response()->json(['message' => 'Pembayaran ini sudah diproses sebelumnya.'], 422);
        }

        $pembayaran->update([
            'status' => 'ditolak',
            'alasan_tolak' => $validated['alasan'],
            'dikonfirmasi_at' => now(),
            'dikonfirmasi_oleh' => $request->user()->id,
        ]);

        return response()->json($pembayaran->fresh());
    }
}
