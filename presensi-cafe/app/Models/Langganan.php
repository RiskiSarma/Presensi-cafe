<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Langganan extends Model
{
    protected $fillable = [
        'bisnis_id',
        'paket_id',
        'siklus',
        'status',
        'mulai_at',
        'berakhir_at',
        'pembayaran_id',
        'catatan',
        'reminder_3d_sent_at',
        'reminder_1d_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'mulai_at' => 'datetime',
            'berakhir_at' => 'datetime',
            'reminder_3d_sent_at' => 'datetime',
            'reminder_1d_sent_at' => 'datetime',
        ];
    }

    public function bisnis()
    {
        return $this->belongsTo(Bisnis::class);
    }

    public function paket()
    {
        return $this->belongsTo(Paket::class);
    }
}
