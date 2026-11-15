<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Models\JadwalShift;
use App\Models\PegawaiProfil;
use App\Models\Presensi;
use App\Services\FaceRecognitionService;
use App\Support\DeviceDetector;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PresensiController extends Controller
{
    protected float $ambangBatasConfidence = 55.0;

    public function checkInMobile(Request $request, FaceRecognitionService $faceService)
    {
        $request->validate([
            'foto' => 'required|image|max:5120',
            'frames' => 'nullable|array|max:30',
            'frames.*' => 'image|max:2048',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $pegawai = $request->user()->pegawaiProfil;
        if (! $pegawai) {
            return response()->json(['message' => 'Profil pegawai tidak ditemukan.'], 404);
        }

        $cekGps = $this->validasiGps($pegawai, $request->latitude, $request->longitude);
        if (! $cekGps['valid']) {
            return response()->json(['message' => $cekGps['message']], 422);
        }

        if ($tolak = $this->tolakJikaTidakHidup($request, $pegawai->cabang, $faceService)) {
            return $tolak;
        }

        $embeddingAktif = $pegawai->faceEmbeddingAktif()->latest()->first();
        if (! $embeddingAktif) {
            return response()->json(['message' => 'Wajah Anda belum terdaftar. Hubungi admin.'], 422);
        }

        $verifikasi = $faceService->verifyOneToOne($request->file('foto'), $embeddingAktif->embedding_vector, $this->ambangBatasConfidence);

        if (! $verifikasi['success'] || ! $verifikasi['match']) {
            return response()->json([
                'message' => $verifikasi['message'] ?? 'Wajah tidak cocok. Silakan coba lagi.',
                'confidence' => $verifikasi['confidence'],
            ], 422);
        }

        $jenisPerangkat = DeviceDetector::detect($request->userAgent());

        return $this->prosesCheckIn($pegawai, $request->file('foto'), 'mandiri', $jenisPerangkat, $verifikasi['confidence'], $request->latitude, $request->longitude);
    }

    public function checkOutMobile(Request $request, FaceRecognitionService $faceService)
    {
        $request->validate([
            'foto' => 'required|image|max:5120',
            'frames' => 'nullable|array|max:30',
            'frames.*' => 'image|max:2048',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $pegawai = $request->user()->pegawaiProfil;
        if (! $pegawai) {
            return response()->json(['message' => 'Profil pegawai tidak ditemukan.'], 404);
        }

        $cekGps = $this->validasiGps($pegawai, $request->latitude, $request->longitude);
        if (! $cekGps['valid']) {
            return response()->json(['message' => $cekGps['message']], 422);
        }

        if ($tolak = $this->tolakJikaTidakHidup($request, $pegawai->cabang, $faceService)) {
            return $tolak;
        }

        $embeddingAktif = $pegawai->faceEmbeddingAktif()->latest()->first();
        if (! $embeddingAktif) {
            return response()->json(['message' => 'Wajah Anda belum terdaftar. Hubungi admin.'], 422);
        }

        $verifikasi = $faceService->verifyOneToOne($request->file('foto'), $embeddingAktif->embedding_vector, $this->ambangBatasConfidence);

        if (! $verifikasi['success'] || ! $verifikasi['match']) {
            return response()->json([
                'message' => $verifikasi['message'] ?? 'Wajah tidak cocok. Silakan coba lagi.',
                'confidence' => $verifikasi['confidence'],
            ], 422);
        }

        $jenisPerangkat = DeviceDetector::detect($request->userAgent());

        return $this->prosesCheckOut($pegawai, $request->file('foto'), 'mandiri', $jenisPerangkat, $verifikasi['confidence'], $request->latitude, $request->longitude);
    }

    public function checkInKiosk(Request $request, FaceRecognitionService $faceService)
    {
        $request->validate([
            'foto' => 'required|image|max:5120',
            'frames' => 'nullable|array|max:30',
            'frames.*' => 'image|max:2048',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $cabang = $request->attributes->get('cabang');

        // Cek radius DULU sebelum proses wajah (lebih hemat, dan mencegah kiosk token
        // dipakai dari device pribadi pegawai di lokasi lain - bukan cuma trusted tablet).
        if (! $cabang || ! $cabang->dalamRadius($request->latitude, $request->longitude)) {
            $jarak = $cabang ? round($cabang->jarakDariCabang($request->latitude, $request->longitude)) : null;
            return response()->json([
                'message' => $jarak !== null
                    ? "Kiosk ini terdeteksi {$jarak}m dari cabang, di luar radius yang diizinkan ({$cabang->radius_meter}m)."
                    : 'Lokasi cabang tidak valid.',
            ], 422);
        }

        if ($tolak = $this->tolakJikaTidakHidup($request, $cabang, $faceService)) {
            return $tolak;
        }

        $identifikasi = $this->identifikasiWajah($request->file('foto'), $faceService, $cabang);
        if (! $identifikasi['success']) {
            return response()->json(['message' => $identifikasi['message']], 422);
        }

        $pegawai = PegawaiProfil::find($identifikasi['pegawai_profil_id']);
        $jenisPerangkat = DeviceDetector::detect($request->userAgent());

        return $this->prosesCheckIn($pegawai, $request->file('foto'), 'kiosk', $jenisPerangkat, $identifikasi['confidence'], $request->latitude, $request->longitude);
    }

    public function checkOutKiosk(Request $request, FaceRecognitionService $faceService)
    {
        $request->validate([
            'foto' => 'required|image|max:5120',
            'frames' => 'nullable|array|max:30',
            'frames.*' => 'image|max:2048',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $cabang = $request->attributes->get('cabang');

        if (! $cabang || ! $cabang->dalamRadius($request->latitude, $request->longitude)) {
            $jarak = $cabang ? round($cabang->jarakDariCabang($request->latitude, $request->longitude)) : null;
            return response()->json([
                'message' => $jarak !== null
                    ? "Kiosk ini terdeteksi {$jarak}m dari cabang, di luar radius yang diizinkan ({$cabang->radius_meter}m)."
                    : 'Lokasi cabang tidak valid.',
            ], 422);
        }

        if ($tolak = $this->tolakJikaTidakHidup($request, $cabang, $faceService)) {
            return $tolak;
        }

        $identifikasi = $this->identifikasiWajah($request->file('foto'), $faceService, $cabang);
        if (! $identifikasi['success']) {
            return response()->json(['message' => $identifikasi['message']], 422);
        }

        $pegawai = PegawaiProfil::find($identifikasi['pegawai_profil_id']);
        $jenisPerangkat = DeviceDetector::detect($request->userAgent());

        return $this->prosesCheckOut($pegawai, $request->file('foto'), 'kiosk', $jenisPerangkat, $identifikasi['confidence'], $request->latitude, $request->longitude);
    }

    /** Info cabang untuk tablet kiosk (apakah wajib kedip mata). */
    public function infoKiosk(Request $request)
    {
        $cabang = $request->attributes->get('cabang');

        return response()->json([
            'nama_cabang' => $cabang?->nama_cabang,
            'liveness_aktif' => (bool) $cabang?->liveness_aktif,
        ]);
    }

    public function riwayatSaya(Request $request)
    {
        $pegawai = $request->user()->pegawaiProfil;

        $riwayat = $pegawai->presensis()
            ->with('jadwalShift.shift')
            ->when($request->bulan, fn ($q) => $q->whereMonth('tanggal', $request->bulan))
            ->when($request->tahun, fn ($q) => $q->whereYear('tanggal', $request->tahun))
            ->orderByDesc('tanggal')
            ->paginate(min(max((int) $request->input('per_page', 31), 1), 500));

        return response()->json($riwayat);
    }

    public function statusHariIni(Request $request)
    {
        $pegawai = $request->user()->pegawaiProfil;

        $presensi = $pegawai->presensis()->whereDate('tanggal', today())->first();

        // Shift yang lewat tengah malam (mis. 16:00-00:00): setelah lewat jam 00:00 presensi kemarin
        // yang belum absen pulang masih terbuka, supaya tombol "Absen Pulang" tetap muncul.
        if (! $presensi) {
            $presensi = $pegawai->presensis()
                ->whereDate('tanggal', today()->subDay())
                ->whereNotNull('jam_masuk')
                ->whereNull('jam_pulang')
                ->first();
        }

        $jadwal = $pegawai->jadwalShifts()->with('shift')->whereDate('tanggal', $presensi?->tanggal ?? today())->first();

        return response()->json([
            'jadwal_hari_ini' => $jadwal,
            'presensi_hari_ini' => $presensi,
            'liveness_aktif' => (bool) $pegawai->cabang?->liveness_aktif,
        ]);
    }

    public function index(Request $request)
    {
        $query = Presensi::with(['pegawaiProfil.user', 'pegawaiProfil.cabang', 'jadwalShift.shift'])
            ->whereHas('pegawaiProfil.cabang', fn ($q) => $q->where('bisnis_id', $request->user()->bisnis_id));

        if ($request->tanggal_mulai && $request->tanggal_selesai) {
            $query->whereBetween('tanggal', [$request->tanggal_mulai, $request->tanggal_selesai]);
        }

        if ($request->pegawai_profil_id) {
            $query->where('pegawai_profil_id', $request->pegawai_profil_id);
        }

        if ($request->cabang_id) {
            $query->whereHas('pegawaiProfil', fn ($q) => $q->where('cabang_id', $request->cabang_id));
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderByDesc('tanggal')->paginate(31));
    }

    /**
     * Kalau cabang mewajibkan verifikasi kedip mata, tolak presensi tanpa rangkaian frame yang berkedip.
     * Return null kalau lolos / tidak diwajibkan.
     */
    protected function tolakJikaTidakHidup(Request $request, ?Cabang $cabang, FaceRecognitionService $faceService)
    {
        if (! $cabang?->liveness_aktif) {
            return null;
        }

        $frames = $request->file('frames');
        if (! is_array($frames) || count($frames) < 8) {
            return response()->json([
                'message' => 'Verifikasi kedipan diperlukan. Kedipkan mata satu kali saat kamera merekam.',
                'kode' => 'LIVENESS_DIBUTUHKAN',
            ], 422);
        }

        $hasil = $faceService->cekLiveness($frames);

        if (! $hasil['success']) {
            return response()->json(['message' => $hasil['message'] ?? 'Verifikasi kedipan gagal. Coba lagi.'], 422);
        }
        if (! $hasil['konsisten']) {
            return response()->json(['message' => 'Wajah berubah selama perekaman. Pastikan hanya satu orang di depan kamera.', 'kode' => 'LIVENESS_GAGAL'], 422);
        }
        if (! $hasil['live']) {
            return response()->json([
                'message' => $hasil['message'] ?? 'Kedipan mata tidak terdeteksi. Hadap kamera dengan cahaya cukup, kedipkan mata satu kali dengan jelas, lalu coba lagi.',
                'kode' => 'LIVENESS_GAGAL',
            ], 422);
        }

        return null;
    }

    protected function identifikasiWajah($foto, FaceRecognitionService $faceService, ?Cabang $cabang): array
    {
        if (! $cabang) {
            return ['success' => false, 'message' => 'Cabang kiosk tidak terdeteksi. Hubungi admin.'];
        }

        $kandidat = PegawaiProfil::where('status_aktif', true)
            ->where('cabang_id', $cabang->id)
            ->with('faceEmbeddingAktif')
            ->get()
            ->flatMap(fn ($p) => $p->faceEmbeddingAktif->map(fn ($e) => [
                'pegawai_profil_id' => $p->id,
                'embedding' => $e->embedding_vector,
            ]))
            ->values()
            ->toArray();

        if (empty($kandidat)) {
            return ['success' => false, 'message' => 'Belum ada data wajah pegawai yang terdaftar di cabang ini.'];
        }

        $hasil = $faceService->identifyFromCandidates($foto, $kandidat, $this->ambangBatasConfidence);

        if (! $hasil['success'] || ! $hasil['pegawai_profil_id']) {
            return ['success' => false, 'message' => $hasil['message'] ?? 'Wajah tidak dikenali.'];
        }

        return [
            'success' => true,
            'pegawai_profil_id' => $hasil['pegawai_profil_id'],
            'confidence' => $hasil['confidence'],
        ];
    }

    protected function validasiGps(PegawaiProfil $pegawai, float $lat, float $long): array
    {
        $cabang = $pegawai->cabang;

        if (! $cabang) {
            return ['valid' => false, 'message' => 'Cabang tempat Anda bekerja belum diatur. Hubungi admin.'];
        }

        if (! $cabang->dalamRadius($lat, $long)) {
            $jarak = round($cabang->jarakDariCabang($lat, $long));

            return ['valid' => false, 'message' => "Anda berada {$jarak}m dari cabang, di luar radius yang diizinkan ({$cabang->radius_meter}m)."];
        }

        return ['valid' => true, 'message' => null];
    }

    protected function prosesCheckIn(?PegawaiProfil $pegawai, $foto, string $deviceType, string $jenisPerangkat, float $confidence, ?float $lat, ?float $long)
    {
        if (! $pegawai) {
            return response()->json(['message' => 'Data pegawai tidak ditemukan.'], 404);
        }

        $sudahAda = Presensi::where('pegawai_profil_id', $pegawai->id)->whereDate('tanggal', today())->first();
        if ($sudahAda && $sudahAda->jam_masuk) {
            return response()->json(['message' => 'Anda sudah check-in hari ini.'], 422);
        }

        $jadwal = JadwalShift::where('pegawai_profil_id', $pegawai->id)->whereDate('tanggal', today())->with('shift')->first();
        $sekarang = now();

        $status = 'tepat_waktu';
        $menitTerlambat = null; // null = tidak ada jadwal, 0 = datang sebelum/tepat jam mulai

        if ($jadwal) {
            $shift = $jadwal->shift;
            $mulai = today()->setTimeFromTimeString($shift->jam_mulai);
            $selesai = today()->setTimeFromTimeString($shift->jam_selesai);
            if ($selesai->lte($mulai)) {
                $selesai->addDay(); // shift lewat tengah malam, mis. 16:00-00:00
            }

            // Shift sudah berakhir: tidak bisa check-in lagi (admin mengoreksi lewat Laporan Presensi)
            if ($sekarang->gte($selesai)) {
                return response()->json([
                    'message' => "Shift {$shift->nama_shift} sudah berakhir pukul {$selesai->format('H:i')}. Hubungi admin untuk koreksi presensi.",
                ], 422);
            }

            // Telat dihitung dari JAM MULAI shift. Lewat batas toleransi = "terlambat",
            // masih dalam toleransi = tetap "tepat_waktu" tapi menit telatnya tercatat dan ditampilkan.
            $menitTerlambat = $sekarang->gt($mulai)
                ? (int) floor(($sekarang->getTimestamp() - $mulai->getTimestamp()) / 60)
                : 0;

            if ($menitTerlambat > (int) $shift->toleransi_telat_menit) {
                $status = 'terlambat';
            }
        }

        $path = $foto->store('bukti-presensi', 'public');

        $presensi = Presensi::updateOrCreate(
            ['pegawai_profil_id' => $pegawai->id, 'tanggal' => today()],
            [
                'jadwal_shift_id' => $jadwal?->id,
                'jam_masuk' => $sekarang,
                'device_type_masuk' => $deviceType,
                'jenis_perangkat_masuk' => $jenisPerangkat,
                'latitude_masuk' => $lat,
                'longitude_masuk' => $long,
                'foto_bukti_masuk' => $path,
                'confidence_score_masuk' => $confidence,
                'status' => $status,
                'menit_terlambat' => $menitTerlambat,
            ]
        );

        $pesan = 'Check-in berhasil.';
        if ($menitTerlambat) {
            $pesan .= $status === 'terlambat'
                ? " Anda terlambat {$menitTerlambat} menit."
                : " Anda datang {$menitTerlambat} menit setelah jam mulai (masih dalam toleransi).";
        }

        return response()->json([
            'message' => $pesan,
            'data' => $presensi->load(['pegawaiProfil.user', 'jadwalShift.shift']),
        ], 201);
    }

    protected function prosesCheckOut(?PegawaiProfil $pegawai, $foto, string $deviceType, string $jenisPerangkat, float $confidence, ?float $lat, ?float $long)
    {
        if (! $pegawai) {
            return response()->json(['message' => 'Data pegawai tidak ditemukan.'], 404);
        }

        // Cari presensi yang masih terbuka (sudah masuk, belum pulang). Kemarin ikut dicari
        // supaya shift yang lewat tengah malam tetap bisa absen pulang setelah jam 00:00.
        $presensi = Presensi::where('pegawai_profil_id', $pegawai->id)
            ->whereNotNull('jam_masuk')
            ->whereNull('jam_pulang')
            ->whereDate('tanggal', '>=', today()->subDay())
            ->orderByDesc('tanggal')
            ->first();

        if (! $presensi) {
            $hariIni = Presensi::where('pegawai_profil_id', $pegawai->id)->whereDate('tanggal', today())->first();

            return response()->json([
                'message' => ($hariIni && $hariIni->jam_pulang) ? 'Anda sudah check-out hari ini.' : 'Anda belum check-in hari ini.',
            ], 422);
        }

        $status = $presensi->status;
        $lemburMenit = null;

        // Hitung lembur hanya kalau fitur 'lembur' tersedia di paket bisnis ini
        $bisnis = $pegawai->cabang?->bisnis;
        $lemburAktif = $bisnis && app(\App\Services\LanggananService::class)->punyaFitur($bisnis, 'lembur');

        if ($presensi->jadwalShift) {
            $shift = $presensi->jadwalShift->shift;
            $tanggalJadwal = $presensi->tanggal->copy()->startOfDay();
            $mulai = $tanggalJadwal->copy()->setTimeFromTimeString($shift->jam_mulai);
            $jamSelesaiShift = $tanggalJadwal->copy()->setTimeFromTimeString($shift->jam_selesai);
            if ($jamSelesaiShift->lte($mulai)) {
                $jamSelesaiShift->addDay(); // shift lewat tengah malam
            }
            $sekarang = now();

            if ($sekarang->lt($jamSelesaiShift)) {
                $status = 'pulang_cepat';
            } else {
                $menitLewat = (int) round(($sekarang->getTimestamp() - $jamSelesaiShift->getTimestamp()) / 60);
                $ambangLembur = config('presensi.ambang_lembur_menit', 30);

                if ($lemburAktif && $menitLewat > $ambangLembur) {
                    $lemburMenit = $menitLewat;
                }
            }
        }

        $path = $foto->store('bukti-presensi', 'public');

        $presensi->update([
            'jam_pulang' => now(),
            'device_type_pulang' => $deviceType,
            'jenis_perangkat_pulang' => $jenisPerangkat,
            'latitude_pulang' => $lat,
            'longitude_pulang' => $long,
            'foto_bukti_pulang' => $path,
            'confidence_score_pulang' => $confidence,
            'status' => $status,
            'lembur_menit' => $lemburMenit,
        ]);

        return response()->json([
            'message' => 'Check-out berhasil.',
            'data' => $presensi->fresh()->load(['pegawaiProfil.user', 'jadwalShift.shift']),
        ]);
    }
}
