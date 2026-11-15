<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FaceRecognitionService
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.face_recognition.url'), '/');
    }

    /**
     * Kirim foto ke Python service untuk diubah jadi embedding vector.
     * Dipakai saat admin mendaftarkan wajah pegawai baru.
     *
     * @return array{success: bool, embedding: array|null, message: string|null}
     */
    public function generateEmbedding(UploadedFile $foto): array
    {
        try {
            $response = Http::attach(
                'foto', file_get_contents($foto->getRealPath()), $foto->getClientOriginalName()
            )->post("{$this->baseUrl}/generate-embedding");

            if (! $response->successful()) {
                return [
                    'success' => false,
                    'embedding' => null,
                    'message' => $response->json('message') ?? 'Gagal memproses wajah.',
                ];
            }

            return [
                'success' => true,
                'embedding' => $response->json('embedding'),
                'message' => null,
            ];
        } catch (\Throwable $e) {
            Log::error('FaceRecognitionService::generateEmbedding gagal', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'embedding' => null,
                'message' => 'Face recognition service tidak dapat dihubungi.',
            ];
        }
    }

    /**
     * Verifikasi 1:1 — dipakai untuk presensi via MOBILE.
     * Pegawai sudah login, jadi tinggal cocokkan foto capture vs embedding miliknya sendiri.
     *
     * @return array{success: bool, match: bool, confidence: float, message: string|null}
     */
    public function verifyOneToOne(UploadedFile $fotoCapture, array $embeddingTersimpan, float $threshold = 70.0): array
    {
        try {
            $response = Http::attach(
                'foto', file_get_contents($fotoCapture->getRealPath()), $fotoCapture->getClientOriginalName()
            )->post("{$this->baseUrl}/verify", [
                'embedding' => json_encode($embeddingTersimpan),
                'threshold' => $threshold,
            ]);

            if (! $response->successful()) {
                return [
                    'success' => false,
                    'match' => false,
                    'confidence' => 0,
                    'message' => $response->json('message') ?? 'Verifikasi wajah gagal.',
                ];
            }

            return [
                'success' => true,
                'match' => (bool) $response->json('match'),
                'confidence' => (float) $response->json('confidence'),
                'message' => null,
            ];
        } catch (\Throwable $e) {
            Log::error('FaceRecognitionService::verifyOneToOne gagal', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'match' => false,
                'confidence' => 0,
                'message' => 'Face recognition service tidak dapat dihubungi.',
            ];
        }
    }

    /**
     * Identifikasi 1:N — dipakai untuk presensi via KIOSK.
     * Belum tahu ini siapa, jadi foto capture dicocokkan ke SEMUA embedding aktif.
     *
     * @param  array<int, array{pegawai_profil_id: int, embedding: array}>  $kandidat
     * @return array{success: bool, pegawai_profil_id: int|null, confidence: float, message: string|null}
     */
    public function identifyFromCandidates(UploadedFile $fotoCapture, array $kandidat, float $threshold = 70.0): array
    {
        try {
            $response = Http::attach(
                'foto', file_get_contents($fotoCapture->getRealPath()), $fotoCapture->getClientOriginalName()
            )->post("{$this->baseUrl}/identify", [
                'kandidat' => json_encode($kandidat),
                'threshold' => $threshold,
            ]);

            if (! $response->successful()) {
                return [
                    'success' => false,
                    'pegawai_profil_id' => null,
                    'confidence' => 0,
                    'message' => $response->json('message') ?? 'Wajah tidak dikenali.',
                ];
            }

            $pegawaiId = $response->json('pegawai_profil_id');

            return [
                'success' => true,
                'pegawai_profil_id' => $pegawaiId,
                'confidence' => (float) $response->json('confidence'),
                'message' => $pegawaiId === null ? 'Wajah tidak dikenali atau di bawah ambang batas.' : null,
            ];
        } catch (\Throwable $e) {
            Log::error('FaceRecognitionService::identifyFromCandidates gagal', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'pegawai_profil_id' => null,
                'confidence' => 0,
                'message' => 'Face recognition service tidak dapat dihubungi.',
            ];
        }
    }

    /**
     * Cek kedipan mata dari rangkaian frame (urut waktu).
     *
     * @param  array<int,\Illuminate\Http\UploadedFile>  $frames
     */
    public function cekLiveness(array $frames): array
    {
        try {
            $request = Http::asMultipart()->timeout(30);
            foreach (array_values($frames) as $i => $frame) {
                $request = $request->attach('fotos', file_get_contents($frame->getRealPath()), "frame{$i}.jpg");
            }

            $response = $request->post("{$this->baseUrl}/liveness");

            if (! $response->successful()) {
                return ['success' => false, 'live' => false, 'konsisten' => true, 'message' => 'Verifikasi kedipan gagal diproses.'];
            }

            return [
                'success' => true,
                'live' => (bool) $response->json('live'),
                'konsisten' => (bool) $response->json('konsisten', true),
                'message' => $response->json('message'),
            ];
        } catch (\Throwable $e) {
            Log::error('FaceRecognitionService::cekLiveness gagal', ['error' => $e->getMessage()]);

            return ['success' => false, 'live' => false, 'konsisten' => true, 'message' => 'Face recognition service tidak dapat dihubungi.'];
        }
    }
}
