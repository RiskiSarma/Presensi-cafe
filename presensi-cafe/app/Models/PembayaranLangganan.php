<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class PembayaranLangganan extends Model
{
    protected $fillable = [
        'bisnis_id',
        'paket_id',
        'siklus',
        'metode',
        'midtrans_order_id',
        'snap_token',
        'midtrans_transaction_id',
        'midtrans_payment_type',
        'jumlah_dasar',
        'kode_unik',
        'jumlah_total',
        'status',
        'bukti_path',
        'nama_pengirim',
        'bank_pengirim',
        'dibayar_at',
        'dikonfirmasi_at',
        'dikonfirmasi_oleh',
        'alasan_tolak',
    ];

    protected $appends = ['bukti_url'];

    protected function casts(): array
    {
        return [
            'jumlah_dasar' => 'integer',
            'kode_unik' => 'integer',
            'jumlah_total' => 'integer',
            'dibayar_at' => 'datetime',
            'dikonfirmasi_at' => 'datetime',
        ];
    }

    public function getBuktiUrlAttribute(): ?string
    {
        return $this->bukti_path ? Storage::disk('public')->url($this->bukti_path) : null;
    }

    public function bisnis()
    {
        return $this->belongsTo(Bisnis::class);
    }

    public function paket()
    {
        return $this->belongsTo(Paket::class);
    }

    public function terbuka(): bool
    {
        return in_array($this->status, ['menunggu_pembayaran', 'menunggu_konfirmasi'], true);
    }
}
