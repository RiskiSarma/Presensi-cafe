<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HariLibur;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class HariLiburController extends Controller
{
    public function index(Request $request)
    {
        $tahun = (int) $request->input('tahun', now()->year);

        return response()->json(
            HariLibur::where('bisnis_id', $request->user()->bisnis_id)
                ->whereYear('tanggal', $tahun)
                ->orderBy('tanggal')
                ->get()
        );
    }

    /** Tambah satu tanggal, atau rentang (mis. cuti bersama) lewat tanggal_selesai. */
    public function store(Request $request)
    {
        $v = $request->validate([
            'tanggal' => 'required|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal',
            'nama' => 'required|string|max:100',
        ], [
            'nama.required' => 'Nama hari libur wajib diisi.',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
        ]);

        $mulai = Carbon::parse($v['tanggal'])->startOfDay();
        $selesai = Carbon::parse($v['tanggal_selesai'] ?? $v['tanggal'])->startOfDay();

        if ($mulai->diffInDays($selesai) > 31) {
            return response()->json(['message' => 'Rentang libur maksimal 31 hari sekali input.'], 422);
        }

        $bisnisId = $request->user()->bisnis_id;
        $dibuat = 0;

        for ($tgl = $mulai->copy(); $tgl->lte($selesai); $tgl->addDay()) {
            $libur = HariLibur::updateOrCreate(
                ['bisnis_id' => $bisnisId, 'tanggal' => $tgl->toDateString()],
                ['nama' => $v['nama']]
            );
            $dibuat += $libur->wasRecentlyCreated ? 1 : 0;
        }

        LogAktivitas::catat($bisnisId, $request->user(), 'dibuat', 'Hari libur', "Hari libur \"{$v['nama']}\" ditambahkan ({$mulai->format('d M Y')}" . ($mulai->eq($selesai) ? '' : " - {$selesai->format('d M Y')}") . ')');

        return response()->json(['message' => 'Hari libur tersimpan.', 'ditambahkan' => $dibuat], 201);
    }

    public function destroy(Request $request, HariLibur $hariLibur)
    {
        abort_unless($hariLibur->bisnis_id === $request->user()->bisnis_id, 403, 'Anda tidak memiliki akses ke data ini.');

        LogAktivitas::catat($hariLibur->bisnis_id, $request->user(), 'dihapus', 'Hari libur', "Hari libur \"{$hariLibur->nama}\" ({$hariLibur->tanggal->format('d M Y')}) dihapus");
        $hariLibur->delete();

        return response()->json(['message' => 'Hari libur dihapus.']);
    }
}
