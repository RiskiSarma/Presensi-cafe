<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Services\LanggananService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CabangController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Cabang::withCount('pegawaiProfils')
                ->where('bisnis_id', $request->user()->bisnis_id)
                ->latest()
                ->get()
        );
    }

    public function store(Request $request, LanggananService $langganan)
    {
        if ($pesan = $langganan->cekBatas($request->user()->bisnis, 'cabang')) {
            return response()->json(['message' => $pesan, 'kode' => 'BATAS_PAKET'], 403);
        }

        $validated = $request->validate([
            'nama_cabang' => 'required|string|max:255',
            'alamat' => 'nullable|string',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius_meter' => 'required|integer|min:10',
        ]);

        $validated['kiosk_token'] = Str::random(48);
        $validated['is_active'] = true;
        $validated['bisnis_id'] = $request->user()->bisnis_id;

        $cabang = Cabang::create($validated);

        return response()->json($cabang, 201);
    }

    public function show(Request $request, Cabang $cabang)
    {
        $this->pastikanMilikBisnisSendiri($request, $cabang);

        return response()->json($cabang);
    }

    public function update(Request $request, Cabang $cabang, LanggananService $langganan)
    {
        $this->pastikanMilikBisnisSendiri($request, $cabang);

        $validated = $request->validate([
            'nama_cabang' => 'sometimes|string|max:255',
            'alamat' => 'nullable|string',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'radius_meter' => 'sometimes|integer|min:10',
            'is_active' => 'sometimes|boolean',
        ]);

        // Mengaktifkan kembali cabang yang nonaktif dihitung sebagai menambah 1 cabang
        if (filter_var($validated['is_active'] ?? false, FILTER_VALIDATE_BOOLEAN) && ! $cabang->is_active) {
            if ($pesan = $langganan->cekBatas($request->user()->bisnis, 'cabang')) {
                return response()->json(['message' => $pesan, 'kode' => 'BATAS_PAKET'], 403);
            }
        }

        $cabang->update($validated);

        return response()->json($cabang->fresh());
    }

    public function regenerateToken(Request $request, Cabang $cabang)
    {
        $this->pastikanMilikBisnisSendiri($request, $cabang);

        $cabang->update(['kiosk_token' => Str::random(48)]);

        return response()->json($cabang->fresh());
    }

    public function destroy(Request $request, Cabang $cabang)
    {
        $this->pastikanMilikBisnisSendiri($request, $cabang);

        if ($cabang->pegawaiProfils()->exists()) {
            return response()->json([
                'message' => 'Cabang tidak bisa dihapus karena masih ada pegawai terdaftar di sini. Pindahkan pegawai dulu.',
            ], 422);
        }

        $cabang->delete();

        return response()->json(['message' => 'Cabang dihapus.']);
    }

    /**
     * Cegah admin bisnis A mengutak-atik data cabang milik bisnis B
     * cuma dengan tebak-tebak ID lewat URL.
     */
    protected function pastikanMilikBisnisSendiri(Request $request, Cabang $cabang): void
    {
        abort_unless($cabang->bisnis_id === $request->user()->bisnis_id, 403, 'Anda tidak memiliki akses ke cabang ini.');
    }
}
