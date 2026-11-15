<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalShift;
use App\Models\KoreksiPresensi;
use App\Models\LogAktivitas;
use App\Models\PegawaiProfil;
use App\Models\Presensi;
use App\Services\LanggananService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class KoreksiPresensiController extends Controller
{
    private const NON_HADIR = ['tidak_hadir', 'izin', 'sakit', 'cuti'];

    /**
     * Admin menambah atau mengoreksi presensi pegawai (lupa absen, kamera rusak, salah catat).
     * Alasan wajib, dan kondisi sebelum/sesudah disimpan sebagai jejak audit.
     */
    public function store(Request $request, LanggananService $langganan)
    {
        $v = $request->validate([
            'pegawai_profil_id' => 'required|integer|exists:pegawai_profils,id',
            'tanggal' => 'required|date|before_or_equal:today',
            'status' => 'nullable|in:tepat_waktu,terlambat,pulang_cepat,tidak_hadir,izin,sakit,cuti',
            'jam_masuk' => 'nullable|date_format:H:i',
            'jam_pulang' => 'nullable|date_format:H:i',
            'alasan' => 'required|string|min:5|max:255',
        ], [
            'tanggal.before_or_equal' => 'Tanggal tidak boleh di masa depan.',
            'jam_masuk.date_format' => 'Format jam masuk harus JJ:MM.',
            'jam_pulang.date_format' => 'Format jam pulang harus JJ:MM.',
            'alasan.required' => 'Alasan koreksi wajib diisi.',
            'alasan.min' => 'Alasan koreksi minimal 5 karakter.',
        ]);

        $bisnis = $request->user()->bisnis;
        $pegawai = PegawaiProfil::with(['cabang', 'user'])->findOrFail($v['pegawai_profil_id']);
        abort_unless($pegawai->cabang?->bisnis_id === $bisnis->id, 403, 'Pegawai ini bukan bagian dari bisnis Anda.');

        $status = $v['status'] ?? null;
        $nonHadir = in_array($status, self::NON_HADIR, true);

        if (! $nonHadir && empty($v['jam_masuk'])) {
            return response()->json(['message' => 'Jam masuk wajib diisi untuk status hadir.'], 422);
        }

        $tgl = Carbon::parse($v['tanggal'])->startOfDay();
        $jadwal = JadwalShift::with('shift')
            ->where('pegawai_profil_id', $pegawai->id)
            ->whereDate('tanggal', $tgl)
            ->first();

        $masuk = null;
        $pulang = null;
        $lembur = null;

        if (! $nonHadir) {
            $masuk = $tgl->copy()->setTimeFromTimeString($v['jam_masuk'] . ':00');

            if (! empty($v['jam_pulang'])) {
                $pulang = $tgl->copy()->setTimeFromTimeString($v['jam_pulang'] . ':00');
                if ($pulang->lte($masuk)) {
                    $pulang->addDay(); // shift lewat tengah malam
                }
            }

            $statusManual = $status !== null;

            if ($jadwal) {
                $shift = $jadwal->shift;

                if (! $statusManual) {
                    $batas = $tgl->copy()->setTimeFromTimeString($shift->jam_mulai)->addMinutes($shift->toleransi_telat_menit);
                    $status = $masuk->gt($batas) ? 'terlambat' : 'tepat_waktu';
                }

                if ($pulang) {
                    $selesaiShift = $tgl->copy()->setTimeFromTimeString($shift->jam_selesai);
                    if ($selesaiShift->lte($tgl->copy()->setTimeFromTimeString($shift->jam_mulai))) {
                        $selesaiShift->addDay();
                    }

                    if ($pulang->lt($selesaiShift)) {
                        if (! $statusManual) {
                            $status = 'pulang_cepat';
                        }
                    } else {
                        $lewat = (int) round(($pulang->getTimestamp() - $selesaiShift->getTimestamp()) / 60);
                        if ($lewat > config('presensi.ambang_lembur_menit', 30) && $langganan->punyaFitur($bisnis, 'lembur')) {
                            $lembur = $lewat;
                        }
                    }
                }
            } else {
                $status ??= 'tepat_waktu';
            }
        }

        $presensi = DB::transaction(function () use ($v, $pegawai, $tgl, $jadwal, $nonHadir, $status, $masuk, $pulang, $lembur, $request) {
            $presensi = Presensi::firstOrNew([
                'pegawai_profil_id' => $pegawai->id,
                'tanggal' => $tgl->toDateString(),
            ]);

            $kolom = ['jam_masuk', 'jam_pulang', 'status', 'lembur_menit', 'jadwal_shift_id'];
            $sebelum = $presensi->exists ? $presensi->only($kolom) : null;

            $presensi->fill([
                'jadwal_shift_id' => $jadwal?->id,
                'jam_masuk' => $masuk,
                'jam_pulang' => $pulang,
                'status' => $status,
                'lembur_menit' => $lembur,
                'dikoreksi_oleh' => $request->user()->id,
                'dikoreksi_at' => now(),
                'alasan_koreksi' => $v['alasan'],
            ]);

            // Penanda jalur input untuk data yang belum pernah punya (data kamera lama tidak ditimpa)
            if (! $nonHadir) {
                $presensi->device_type_masuk ??= 'koreksi';
                if ($pulang) {
                    $presensi->device_type_pulang ??= 'koreksi';
                }
            }

            $presensi->save();

            KoreksiPresensi::create([
                'presensi_id' => $presensi->id,
                'user_id' => $request->user()->id,
                'sebelum' => $sebelum,
                'sesudah' => $presensi->only($kolom),
                'alasan' => $v['alasan'],
            ]);

            LogAktivitas::catat(
                $request->user()->bisnis_id,
                $request->user(),
                'koreksi',
                'Presensi',
                'Koreksi presensi ' . ($pegawai->user?->name ?? 'pegawai') . ' tanggal ' . $tgl->format('d M Y') . ': ' . $v['alasan'],
                ['sebelum' => $sebelum, 'sesudah' => $presensi->only($kolom)]
            );

            return $presensi;
        });

        return response()->json(
            $presensi->fresh()->load(['pegawaiProfil.user', 'pegawaiProfil.cabang', 'jadwalShift.shift']),
            $presensi->wasRecentlyCreated ? 201 : 200
        );
    }
}
