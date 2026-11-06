<?php

namespace App\Services;

use App\Models\PembayaranLangganan;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Midtrans Snap untuk pembayaran langganan (akun Midtrans milik platform, sama seperti KasirHub).
 * Memakai HTTP client Laravel langsung, jadi TIDAK perlu `composer require midtrans/midtrans-php`.
 */
class MidtransService
{
    public function aktif(): bool
    {
        return filled(config('midtrans.server_key')) && filled(config('midtrans.client_key'));
    }

    protected function snapBase(): string
    {
        return config('midtrans.is_production') ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
    }

    protected function apiBase(): string
    {
        return config('midtrans.is_production') ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
    }

    public function buatSnapToken(PembayaranLangganan $p, User $user): string
    {
        $orderId = 'SUB-' . $p->id . '-' . now()->timestamp;
        $namaItem = 'Paket ' . $p->paket->nama . ' - ' . ucfirst($p->siklus);

        $params = [
            'transaction_details' => ['order_id' => $orderId, 'gross_amount' => $p->jumlah_total],
            'item_details' => [[
                'id' => 'paket-' . $p->paket->kode,
                'price' => $p->jumlah_total,
                'quantity' => 1,
                'name' => mb_substr($namaItem, 0, 50),
            ]],
            'customer_details' => ['first_name' => $user->name, 'email' => $user->email],
            'enabled_payments' => ['gopay', 'shopeepay', 'qris', 'bca_va', 'bni_va', 'bri_va', 'permata_va', 'other_va'],
            'callbacks' => ['finish' => rtrim(config('langganan.frontend_url'), '/') . '/admin/langganan'],
        ];

        $res = Http::withBasicAuth(config('midtrans.server_key'), '')
            ->acceptJson()->asJson()->timeout(20)
            ->post($this->snapBase() . '/snap/v1/transactions', $params);

        if (! $res->successful() || ! $res->json('token')) {
            Log::error('Midtrans snap gagal', ['status' => $res->status(), 'body' => $res->body()]);
            throw new \RuntimeException('Gagal menghubungi Midtrans. Cek Server Key dan mode (sandbox/production).');
        }

        $p->update(['midtrans_order_id' => $orderId, 'snap_token' => $res->json('token')]);

        return $res->json('token');
    }

    /** Tanya status langsung ke Midtrans (dipakai tombol sinkron; berguna saat webhook tidak terjangkau, mis. localhost). */
    public function cekStatus(string $orderId): ?array
    {
        $res = Http::withBasicAuth(config('midtrans.server_key'), '')
            ->acceptJson()->timeout(15)
            ->get($this->apiBase() . '/v2/' . $orderId . '/status');

        return $res->successful() && $res->json('transaction_status') ? $res->json() : null;
    }

    public function signatureValid(array $d): bool
    {
        $hash = hash('sha512', ($d['order_id'] ?? '') . ($d['status_code'] ?? '') . ($d['gross_amount'] ?? '') . config('midtrans.server_key'));

        return hash_equals($hash, (string) ($d['signature_key'] ?? ''));
    }

    public function berhasil(array $d): bool
    {
        return in_array($d['transaction_status'] ?? '', ['capture', 'settlement'], true)
            && in_array($d['fraud_status'] ?? null, [null, 'accept'], true);
    }

    public function gagal(array $d): bool
    {
        return in_array($d['transaction_status'] ?? '', ['cancel', 'deny', 'expire', 'failure'], true);
    }

    /** Terapkan hasil notifikasi/status Midtrans ke tagihan. */
    public function proses(array $d): ?PembayaranLangganan
    {
        $p = PembayaranLangganan::where('midtrans_order_id', $d['order_id'] ?? '')->first();
        if (! $p) {
            return null;
        }

        // Nominal harus cocok dengan tagihan (cegah order_id dipakai untuk transaksi lain)
        if ((int) round((float) ($d['gross_amount'] ?? 0)) !== $p->jumlah_total) {
            Log::warning('Midtrans: nominal tidak cocok', ['order_id' => $p->midtrans_order_id]);

            return $p;
        }

        $p->update([
            'midtrans_transaction_id' => $d['transaction_id'] ?? $p->midtrans_transaction_id,
            'midtrans_payment_type' => $d['payment_type'] ?? $p->midtrans_payment_type,
        ]);

        if ($this->berhasil($d)) {
            app(LanggananService::class)->selesaikanPembayaran($p, null, 'Midtrans ' . ($d['payment_type'] ?? ''));
        } elseif ($this->gagal($d) && $p->status === 'menunggu_pembayaran') {
            $p->update(['status' => 'dibatalkan', 'alasan_tolak' => 'Midtrans: ' . $d['transaction_status']]);
        }

        return $p->fresh()->load('paket');
    }
}
