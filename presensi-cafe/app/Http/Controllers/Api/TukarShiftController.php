<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalShift;
use App\Models\LogAktivitas;
use App\Models\PegawaiProfil;
use App\Models\TukarShift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Tukar shift antar pegawai satu cabang: pemohon mengajukan -> rekan setuju -> admin menyetujui -> jadwal ditukar.
 */
class TukarShiftController extends Controller
{
    private const RELASI = [
        'pemohon.user:id,name',
        'target.user:id,name',
        'jadwalPemohon.shift',
        'jadwalTarget.shift',
    ];

    // ------------------------------------------------------------------
    // Sisi pegawai
    // ------------------------------------------------------------------

    /** Daftar permintaan yang saya kirim dan yang masuk ke saya. */
    public function saya(Request $request)
    {
        $me = $request->user()->pegawaiProfil;

        return response()->json([
            'masuk' => TukarShift::with(self::RELASI)->where('target_id', $me->id)->latest()->limit(30)->get(),
            'keluar' => TukarShift::with(self::RELASI)->where('pemohon_id', $me->id)->latest()->limit(30)->get(),
        ]);
    }

    /** Jadwal saya yang bisa ditukar + daftar rekan satu cabang. */
    public function opsi(Request $request)
    {
        $me = $request->user()->pegawaiProfil;

        return response()->json([
            'jadwal_saya' => $this->jadwalBisaDitukar($me->id),
            'rekan' => PegawaiProfil::with('user:id,name')
                ->where('cabang_id', $me->cabang_id)
                ->where('status_aktif', true)
                ->where('id', '!=', $me->id)
                ->get()
                ->map(fn ($p) => ['id' => $p->id, 'nama' => $p->user?->name, 'jabatan' => $p->jabatan])
                ->sortBy('nama')->values(),
        ]);
    }

    public function jadwalRekan(Request $request, PegawaiProfil $pegawai)
    {
        $me = $request->user()->pegawaiProfil;
        abort_unless($pegawai->cabang_id === $me->cabang_id && $pegawai->id !== $me->id, 403, 'Anda hanya bisa bertukar shift dengan rekan satu cabang.');

        return response()->json($this->jadwalBisaDitukar($pegawai->id));
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'jadwal_pemohon_id' => 'required|integer|exists:jadwal_shifts,id',
            'jadwal_target_id' => 'required|integer|exists:jadwal_shifts,id',
            'alasan' => 'nullable|string|max:255',
        ]);

        $me = $request->user()->pegawaiProfil;
        $jp = JadwalShift::with('pegawaiProfil')->findOrFail($v['jadwal_pemohon_id']);
        $jt = JadwalShift::with('pegawaiProfil')->findOrFail($v['jadwal_target_id']);

        if ($jp->pegawai_profil_id !== $me->id) {
            return response()->json(['message' => 'Shift yang ingin ditukar harus milik Anda.'], 403);
        }
        if ($pesan = $this->masalahPertukaran($jp, $jt)) {
            return response()->json(['message' => $pesan], 422);
        }

        $sudahAda = TukarShift::whereIn('status', ['menunggu_rekan', 'menunggu_admin'])
            ->where(fn ($q) => $q->whereIn('jadwal_pemohon_id', [$jp->id, $jt->id])->orWhereIn('jadwal_target_id', [$jp->id, $jt->id]))
            ->exists();
        if ($sudahAda) {
            return response()->json(['message' => 'Salah satu shift ini sedang dalam pengajuan tukar lain.'], 422);
        }

        $tukar = TukarShift::create([
            'pemohon_id' => $me->id,
            'target_id' => $jt->pegawai_profil_id,
            'jadwal_pemohon_id' => $jp->id,
            'jadwal_target_id' => $jt->id,
            'alasan' => $v['alasan'] ?? null,
            'status' => 'menunggu_rekan',
        ]);

        return response()->json($tukar->load(self::RELASI), 201);
    }

    /** Rekan yang diajak menjawab setuju atau tolak. */
    public function jawab(Request $request, TukarShift $tukarShift)
    {
        $v = $request->validate(['setuju' => 'required|boolean']);
        $me = $request->user()->pegawaiProfil;

        abort_unless($tukarShift->target_id === $me->id, 403, 'Permintaan ini bukan untuk Anda.');

        if ($tukarShift->status !== 'menunggu_rekan') {
            return response()->json(['message' => 'Permintaan ini sudah tidak menunggu jawaban Anda.'], 422);
        }

        $tukarShift->update(['status' => $v['setuju'] ? 'menunggu_admin' : 'ditolak_rekan']);

        return response()->json($tukarShift->fresh()->load(self::RELASI));
    }

    public function batalkan(Request $request, TukarShift $tukarShift)
    {
        $me = $request->user()->pegawaiProfil;
        abort_unless($tukarShift->pemohon_id === $me->id, 403, 'Anda hanya bisa membatalkan permintaan milik sendiri.');

        if (! $tukarShift->terbuka()) {
            return response()->json(['message' => 'Permintaan ini sudah diproses.'], 422);
        }

        $tukarShift->update(['status' => 'dibatalkan']);

        return response()->json(['message' => 'Permintaan dibatalkan.']);
    }

    // ------------------------------------------------------------------
    // Sisi admin
    // ------------------------------------------------------------------

    public function indexAdmin(Request $request)
    {
        $status = $request->input('status', 'menunggu_admin');

        return response()->json(
            TukarShift::with(self::RELASI)
                ->whereHas('pemohon.cabang', fn ($q) => $q->where('bisnis_id', $request->user()->bisnis_id))
                ->when($status !== 'semua', fn ($q) => $q->where('status', $status))
                ->latest()
                ->limit(100)
                ->get()
        );
    }

    public function putuskan(Request $request, TukarShift $tukarShift)
    {
        $v = $request->validate([
            'setuju' => 'required|boolean',
            'catatan' => 'nullable|string|max:255',
        ]);

        $tukarShift->load(['pemohon.cabang', 'pemohon.user', 'target.user', 'jadwalPemohon', 'jadwalTarget']);
        abort_unless($tukarShift->pemohon->cabang?->bisnis_id === $request->user()->bisnis_id, 403, 'Anda tidak memiliki akses ke data ini.');

        if ($tukarShift->status !== 'menunggu_admin') {
            return response()->json(['message' => 'Permintaan ini tidak sedang menunggu keputusan admin.'], 422);
        }

        $nama = ($tukarShift->pemohon->user->name ?? 'Pegawai') . ' ⇄ ' . ($tukarShift->target->user->name ?? 'Pegawai');

        if (! $v['setuju']) {
            $tukarShift->update([
                'status' => 'ditolak_admin',
                'catatan_admin' => $v['catatan'] ?? null,
                'diputuskan_oleh' => $request->user()->id,
                'diputuskan_at' => now(),
            ]);
            LogAktivitas::catat($request->user()->bisnis_id, $request->user(), 'diubah', 'Tukar shift', "Tukar shift {$nama} ditolak");

            return response()->json($tukarShift->fresh()->load(self::RELASI));
        }

        $jp = $tukarShift->jadwalPemohon;
        $jt = $tukarShift->jadwalTarget;

        // Jadwal bisa berubah sejak diajukan, jadi validasi ulang sebelum menukar
        if (! $jp || ! $jt) {
            return response()->json(['message' => 'Salah satu jadwal sudah dihapus. Tolak permintaan ini.'], 422);
        }
        if ($jp->pegawai_profil_id !== $tukarShift->pemohon_id || $jt->pegawai_profil_id !== $tukarShift->target_id) {
            return response()->json(['message' => 'Jadwal sudah berubah sejak diajukan. Tolak permintaan ini dan minta diajukan ulang.'], 422);
        }
        if ($pesan = $this->masalahPertukaran($jp, $jt)) {
            return response()->json(['message' => $pesan], 422);
        }

        DB::transaction(function () use ($jp, $jt, $tukarShift, $v, $request) {
            if ($jp->tanggal->eq($jt->tanggal)) {
                // Hari sama: tukar jenis shift-nya (kombinasi pegawai+tanggal harus tetap unik)
                [$shiftA, $shiftB] = [$jp->shift_id, $jt->shift_id];
                $jp->update(['shift_id' => $shiftB, 'catatan' => 'Tukar shift disetujui']);
                $jt->update(['shift_id' => $shiftA, 'catatan' => 'Tukar shift disetujui']);
            } else {
                // Hari berbeda: kepemilikan jadwalnya yang bertukar
                [$a, $b] = [$jp->pegawai_profil_id, $jt->pegawai_profil_id];
                $jp->update(['pegawai_profil_id' => $b, 'catatan' => 'Tukar shift disetujui']);
                $jt->update(['pegawai_profil_id' => $a, 'catatan' => 'Tukar shift disetujui']);
            }

            $tukarShift->update([
                'status' => 'disetujui',
                'catatan_admin' => $v['catatan'] ?? null,
                'diputuskan_oleh' => $request->user()->id,
                'diputuskan_at' => now(),
            ]);
        });

        LogAktivitas::catat($request->user()->bisnis_id, $request->user(), 'diubah', 'Tukar shift', "Tukar shift {$nama} disetujui ({$jp->tanggal->format('d M')} ⇄ {$jt->tanggal->format('d M')})");

        return response()->json($tukarShift->fresh()->load(self::RELASI));
    }

    // ------------------------------------------------------------------
    // Aturan
    // ------------------------------------------------------------------

    /** Jadwal mulai besok ke depan yang belum ada presensinya dan tidak sedang diajukan tukar. */
    protected function jadwalBisaDitukar(int $pegawaiId)
    {
        $terpakai = TukarShift::whereIn('status', ['menunggu_rekan', 'menunggu_admin'])
            ->get(['jadwal_pemohon_id', 'jadwal_target_id'])
            ->flatMap(fn ($t) => [$t->jadwal_pemohon_id, $t->jadwal_target_id])
            ->all();

        return JadwalShift::with('shift')
            ->where('pegawai_profil_id', $pegawaiId)
            ->whereDate('tanggal', '>', today())
            ->whereDoesntHave('presensi')
            ->whereNotIn('id', $terpakai)
            ->orderBy('tanggal')
            ->limit(60)
            ->get();
    }

    /** Null kalau pertukaran boleh, selain itu pesan alasannya. */
    protected function masalahPertukaran(JadwalShift $jp, JadwalShift $jt): ?string
    {
        $jp->loadMissing('pegawaiProfil');
        $jt->loadMissing('pegawaiProfil');

        if ($jp->pegawai_profil_id === $jt->pegawai_profil_id) {
            return 'Pilih shift milik rekan, bukan milik Anda sendiri.';
        }
        if ($jp->pegawaiProfil->cabang_id !== $jt->pegawaiProfil->cabang_id) {
            return 'Tukar shift hanya bisa antar pegawai di cabang yang sama.';
        }
        if ($jp->tanggal->lte(today()) || $jt->tanggal->lte(today())) {
            return 'Shift yang sudah lewat atau berlangsung hari ini tidak bisa ditukar.';
        }
        if ($jp->presensi()->exists() || $jt->presensi()->exists()) {
            return 'Salah satu shift sudah memiliki catatan presensi.';
        }

        if ($jp->tanggal->eq($jt->tanggal)) {
            if ($jp->shift_id === $jt->shift_id) {
                return 'Kedua pegawai sudah di shift yang sama pada hari itu.';
            }

            return null;
        }

        // Hari berbeda: pastikan tidak ada bentrok jadwal di hari yang akan diterima masing-masing
        $bentrokRekan = JadwalShift::where('pegawai_profil_id', $jt->pegawai_profil_id)->whereDate('tanggal', $jp->tanggal)->exists();
        $bentrokPemohon = JadwalShift::where('pegawai_profil_id', $jp->pegawai_profil_id)->whereDate('tanggal', $jt->tanggal)->exists();

        if ($bentrokRekan || $bentrokPemohon) {
            return 'Salah satu pegawai sudah punya shift lain di tanggal yang akan diterimanya. Pilih tanggal yang sama atau jadwal yang tidak bentrok.';
        }

        return null;
    }
}
