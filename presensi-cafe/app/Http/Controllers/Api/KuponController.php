<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kupon;
use App\Models\Paket;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Khusus super admin: kelola kode promo untuk langganan. */
class KuponController extends Controller
{
    public function index()
    {
        return response()->json([
            'kupon' => Kupon::latest()->get(),
            'paket' => Paket::orderBy('urutan')->get(['id', 'kode', 'nama']),
        ]);
    }

    public function store(Request $request)
    {
        $request->merge(['kode' => Str::upper(trim((string) $request->input('kode')))]);
        $data = $request->validate($this->aturan());

        return response()->json(Kupon::create($data), 201);
    }

    public function update(Request $request, Kupon $kupon)
    {
        $request->merge(['kode' => Str::upper(trim((string) $request->input('kode', $kupon->kode)))]);
        $kupon->update($request->validate($this->aturan($kupon)));

        return response()->json($kupon->fresh());
    }

    public function destroy(Kupon $kupon)
    {
        $kupon->delete(); // pembayaran lama tetap menyimpan kode & diskonnya (kupon_id jadi null)

        return response()->json(['message' => 'Kupon dihapus.']);
    }

    protected function aturan(?Kupon $kupon = null): array
    {
        $kodePaket = Paket::pluck('kode')->all();

        return [
            'kode' => ['required', 'string', 'max:30', 'alpha_dash', Rule::unique('kupons', 'kode')->ignore($kupon?->id)],
            'deskripsi' => 'nullable|string|max:255',
            'tipe' => 'required|in:persen,nominal',
            'nilai' => ['required', 'integer', 'min:1', $this->tipeIs('persen') ? 'max:100' : 'max:100000000'],
            'maks_pemakaian' => 'required|integer|min:1',
            'paket_target' => ['required', Rule::in(array_merge(['all'], $kodePaket))],
            'berakhir_at' => 'nullable|date',
            'is_active' => 'sometimes|boolean',
        ];
    }

    protected function tipeIs(string $tipe): bool
    {
        return request('tipe') === $tipe;
    }
}
