<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    public function aktif(): bool
    {
        return filled(config('whatsapp.token'));
    }

    /** 0812-3456-7890 / +62 812... / 62812... -> 62812... */
    public static function normalisasi(?string $nomor): ?string
    {
        $digit = preg_replace('/\D+/', '', (string) $nomor);
        if ($digit === '') {
            return null;
        }
        if (str_starts_with($digit, '0')) {
            $digit = '62' . substr($digit, 1);
        } elseif (str_starts_with($digit, '8')) {
            $digit = '62' . $digit;
        }

        return $digit;
    }

    /** Return true kalau diterima penyedia. Tidak pernah melempar error ke pemanggil. */
    public function kirim(string $nomor, string $pesan): bool
    {
        if (! $this->aktif()) {
            return false;
        }

        $target = self::normalisasi($nomor);
        if (! $target) {
            return false;
        }

        try {
            $res = Http::withHeaders(['Authorization' => config('whatsapp.token')])
                ->asForm()
                ->timeout(15)
                ->post(config('whatsapp.endpoint'), ['target' => $target, 'message' => $pesan]);

            if (! $res->successful() || $res->json('status') === false) {
                Log::warning('WhatsApp gagal terkirim', ['status' => $res->status(), 'body' => mb_substr($res->body(), 0, 300)]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('WhatsApp error: ' . $e->getMessage());

            return false;
        }
    }
}
