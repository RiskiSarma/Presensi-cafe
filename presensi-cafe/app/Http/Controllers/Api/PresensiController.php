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
    protected float $ambangBatasConfidence = 70.0;

    public function checkInMobile(Request $request, FaceRecognitionService $faceService)
    {
        $request->validate([
            'foto' => 'required|image|max:5120',
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

        $identifikasi = $this->identifikasiWajah($request->file('foto'), $faceService, $cabang);
        if (! $identifikasi['success']) {
            return response()->json(['message' => $identifikasi['message']], 422);
        }

        $pegawai = PegawaiProfil::find($identifikasi['pegawai_profil_id']);
        $jenisPerangkat = DeviceDetector::detect($request->userAgent());

        return $this->prosesCheckOut($pegawai, $request->file('foto'), 'kiosk', $jenisPerangkat, $identifikasi['confidence'], $request->latitude, $request->longitude);
    }

    public function riwayatSaya(Request $request)
    {
        $pegawai = $request->user()->pegawaiProfil;

        $riwayat = $pegawai->presensis()
            ->with('jadwalShift.shift')
            ->when($request->bulan, fn ($q) => $q->whereMonth('tanggal', $request->bulan))
            ->when($request->tahun, fn ($q) => $q->whereYear('tanggal', $request->tahun))
            ->orderByDesc('tanggal')
            ->paginate(31);

        return response()->json($riwayat);
    }

    public function statusHariIni(Request $request)
    {
        $pegawai = $request->user()->pegawaiProfil;

        $presensi = $pegawai->presensis()->whereDate('tanggal', today())->first();
        $jadwal = $pegawai->jadwalShifts()->with('shift')->whereDate('tanggal', today())->first();

        return response()->json([
            'jadwal_hari_ini' => $jadwal,
            'presensi_hari_ini' => $presensi,
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

        $status = 'tepat_waktu';
        if ($jadwal) {
            $batasToleransi = Carbon::parse($jadwal->shift->jam_mulai)->addMinutes($jadwal->shift->toleransi_telat_menit);
            if (now()->format('H:i:s') > $batasToleransi->format('H:i:s')) {
                $status = 'terlambat';
            }
        }

        $path = $foto->store('bukti-presensi', 'public');

        $presensi = Presensi::updateOrCreate(
            ['pegawai_profil_id' => $pegawai->id, 'tanggal' => today()],
            [
                'jadwal_shift_id' => $jadwal?->id,
                'jam_masuk' => now(),
                'device_type_masuk' => $deviceType,
                'jenis_perangkat_masuk' => $jenisPerangkat,
                'latitude_masuk' => $lat,
                'longitude_masuk' => $long,
                'foto_bukti_masuk' => $path,
                'confidence_score_masuk' => $confidence,
                'status' => $status,
            ]
        );

        return response()->json([
            'message' => 'Check-in berhasil.',
            'data' => $presensi->load(['pegawaiProfil.user', 'jadwalShift.shift']),
        ], 201);
    }

    protected function prosesCheckOut(?PegawaiProfil $pegawai, $foto, string $deviceType, string $jenisPerangkat, float $confidence, ?float $lat, ?float $long)
    {
        if (! $pegawai) {
            return response()->json(['message' => 'Data pegawai tidak ditemukan.'], 404);
        }

        $presensi = Presensi::where('pegawai_profil_id', $pegawai->id)->whereDate('tanggal', today())->first();

        if (! $presensi || ! $presensi->jam_masuk) {
            return response()->json(['message' => 'Anda belum check-in hari ini.'], 422);
        }

        if ($presensi->jam_pulang) {
            return response()->json(['message' => 'Anda sudah check-out hari ini.'], 422);
        }

        $status = $presensi->status;
        $lemburMenit = null;

        // Hitung lembur hanya kalau fitur 'lembur' tersedia di paket bisnis ini
        $bisnis = $pegawai->cabang?->bisnis;
        $lemburAktif = $bisnis && app(\App\Services\LanggananService::class)->punyaFitur($bisnis, 'lembur');

        if ($presensi->jadwalShift) {
            $jamSelesaiShift = today()->setTimeFromTimeString($presensi->jadwalShift->shift->jam_selesai);
            $sekarang = now();

            if ($sekarang->lt($jamSelesaiShift)) {
                $status = 'pulang_cepat';
            } else {
                $menitLewat = $jamSelesaiShift->diffInMinutes($sekarang);
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
