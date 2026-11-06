<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PengajuanIzin;
use App\Models\Presensi;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PengajuanIzinController extends Controller
{
    /**
     * Pegawai: ajukan izin/sakit/cuti
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'jenis' => 'required|in:izin,sakit,cuti',
            'tanggal_mulai' => 'required|date|after_or_equal:today',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'alasan' => 'required|string',
            'bukti_file' => 'nullable|file|max:5120',
        ]);

        $pegawai = $request->user()->pegawaiProfil;

        if ($request->hasFile('bukti_file')) {
            $validated['bukti_file'] = $request->file('bukti_file')->store('bukti-izin', 'public');
        }

        $pengajuan = $pegawai->pengajuanIzins()->create($validated);

        return response()->json($pengajuan, 201);
    }

    /**
     * Pegawai: lihat riwayat pengajuan izin miliknya
     */
    public function riwayatSaya(Request $request)
    {
        $pengajuan = $request->user()->pegawaiProfil->pengajuanIzins()
            ->latest()
            ->paginate(15);

        return response()->json($pengajuan);
    }

    /**
     * Admin: lihat semua pengajuan (default: yang pending dulu)
     */
    public function index(Request $request)
    {
        $query = PengajuanIzin::with('pegawaiProfil.user')
            ->whereHas('pegawaiProfil.cabang', fn ($q) => $q->where('bisnis_id', $request->user()->bisnis_id));

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->paginate(15));
    }

    /**
     * Admin: setujui pengajuan izin.
     * Otomatis membuat/update baris presensi pada rentang tanggal terkait
     * supaya tercatat sebagai izin/sakit/cuti (bukan "tidak_hadir").
     */
    public function approve(Request $request, PengajuanIzin $pengajuanIzin)
    {
        $request->validate(['catatan_admin' => 'nullable|string']);

        $pengajuanIzin->update([
            'status' => 'disetujui',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'catatan_admin' => $request->catatan_admin,
        ]);

        $tanggal = Carbon::parse($pengajuanIzin->tanggal_mulai);
        while ($tanggal->lte($pengajuanIzin->tanggal_selesai)) {
            Presensi::updateOrCreate(
                ['pegawai_profil_id' => $pengajuanIzin->pegawai_profil_id, 'tanggal' => $tanggal->toDateString()],
                ['status' => $pengajuanIzin->jenis]
            );
            $tanggal->addDay();
        }

        return response()->json($pengajuanIzin->fresh());
    }

    public function reject(Request $request, PengajuanIzin $pengajuanIzin)
    {
        $request->validate(['catatan_admin' => 'nullable|string']);

        $pengajuanIzin->update([
            'status' => 'ditolak',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'catatan_admin' => $request->catatan_admin,
        ]);

        return response()->json($pengajuanIzin->fresh());
    }
}
