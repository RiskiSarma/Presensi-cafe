<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paket;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Khusus super admin: kelola paket langganan (harga, batas, fitur). */
class PaketController extends Controller
{
    public function index()
    {
        return response()->json([
            'paket' => Paket::withCount('langganans')->orderBy('urutan')->get(),
            'katalog_fitur' => LanggananController::katalogFitur(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->aturan());
        $validated['fitur'] = array_values($validated['fitur'] ?? []);

        return response()->json(Paket::create($validated), 201);
    }

    public function update(Request $request, Paket $paket)
    {
        $validated = $request->validate($this->aturan($paket));

        if (array_key_exists('fitur', $validated)) {
            $validated['fitur'] = array_values($validated['fitur'] ?? []);
        }

        $paket->update($validated);

        return response()->json($paket->fresh());
    }

    public function destroy(Paket $paket)
    {
        if ($paket->langganans()->exists() || \App\Models\PembayaranLangganan::where('paket_id', $paket->id)->exists()) {
            return response()->json([
                'message' => 'Paket sudah pernah dipakai, tidak bisa dihapus. Nonaktifkan saja supaya tidak dijual lagi.',
            ], 422);
        }

        $paket->delete();

        return response()->json(['message' => 'Paket dihapus.']);
    }

    protected function aturan(?Paket $paket = null): array
    {
        $ada = $paket ? 'sometimes|' : '';

        return [
            'kode' => [$paket ? 'sometimes' : 'required', 'string', 'max:30', 'alpha_dash', Rule::unique('paket', 'kode')->ignore($paket?->id)],
            'nama' => $ada . 'required|string|max:100',
            'deskripsi' => 'nullable|string|max:500',
            'harga_bulanan' => $ada . 'required|integer|min:0',
            'harga_tahunan' => $ada . 'required|integer|min:0',
            'max_cabang' => 'nullable|integer|min:1',
            'max_pegawai' => 'nullable|integer|min:1',
            'fitur' => 'sometimes|array',
            'fitur.*' => ['string', Rule::in(array_keys(config('langganan.fitur')))],
            'urutan' => 'sometimes|integer|min:0',
            'is_populer' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
