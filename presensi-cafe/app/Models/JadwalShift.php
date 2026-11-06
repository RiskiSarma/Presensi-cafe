<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JadwalShift extends Model
{
    use HasFactory;

    protected $fillable = [
        'pegawai_profil_id',
        'shift_id',
        'tanggal',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }

    public function pegawaiProfil()
    {
        return $this->belongsTo(PegawaiProfil::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function presensi()
    {
        return $this->hasOne(Presensi::class);
    }
}
