<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalShift;
use Illuminate\Http\Request;

class JadwalShiftController extends Controller
{
    /**
     * Lihat jadwal (admin: semua pegawai, bisa difilter; pegawai: hanya miliknya)
     */
    public function index(Request $request)
    {
        $query = JadwalShift::with(['pegawaiProfil.user', 'shift']);

        if ($request->user()->isPegawai()) {
            $query->where('pegawai_profil_id', $request->user()->pegawaiProfil->id);
        } else {
            $query->whereHas('pegawaiProfil.cabang', fn ($q) => $q->where('bisnis_id', $request->user()->bisnis_id));
            if ($request->pegawai_profil_id) {
                $query->where('pegawai_profil_id', $request->pegawai_profil_id);
            }
        }

        if ($request->tanggal_mulai && $request->tanggal_selesai) {
            $query->whereBetween('tanggal', [$request->tanggal_mulai, $request->tanggal_selesai]);
        }

        return response()->json($query->orderBy('tanggal')->paginate(31));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pegawai_profil_id' => 'required|exists:pegawai_profils,id',
            'shift_id' => 'required|exists:shifts,id',
            'tanggal' => 'required|date',
            'catatan' => 'nullable|string',
        ]);

        $pegawaiValid = \App\Models\PegawaiProfil::where('id', $validated['pegawai_profil_id'])
            ->whereHas('cabang', fn ($q) => $q->where('bisnis_id', $request->user()->bisnis_id))
            ->exists();
        abort_unless($pegawaiValid, 422, 'Pegawai tidak valid untuk bisnis Anda.');

        $jadwal = JadwalShift::updateOrCreate(
            ['pegawai_profil_id' => $validated['pegawai_profil_id'], 'tanggal' => $validated['tanggal']],
            $validated
        );

        return response()->json($jadwal->load(['pegawaiProfil.user', 'shift']), 201);
    }

    /**
     * Buat jadwal untuk banyak pegawai & tanggal sekaligus (bulk),
     * berguna buat admin nyusun jadwal mingguan/bulanan sekali input.
     */
    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'jadwal' => 'required|array|min:1',
            'jadwal.*.pegawai_profil_id' => 'required|exists:pegawai_profils,id',
            'jadwal.*.shift_id' => 'required|exists:shifts,id',
            'jadwal.*.tanggal' => 'required|date',
            'jadwal.*.catatan' => 'nullable|string',
        ]);

        $hasil = collect($validated['jadwal'])->map(
            fn ($item) => JadwalShift::updateOrCreate(
                ['pegawai_profil_id' => $item['pegawai_profil_id'], 'tanggal' => $item['tanggal']],
                $item
            )
        );

        return response()->json($hasil, 201);
    }

    public function update(Request $request, JadwalShift $jadwalShift)
    {
        $validated = $request->validate([
            'shift_id' => 'sometimes|exists:shifts,id',
            'tanggal' => 'sometimes|date',
            'catatan' => 'nullable|string',
        ]);

        $jadwalShift->update($validated);

        return response()->json($jadwalShift->load(['pegawaiProfil.user', 'shift']));
    }

    public function destroy(JadwalShift $jadwalShift)
    {
        $jadwalShift->delete();

        return response()->json(['message' => 'Jadwal dihapus.']);
    }
}
