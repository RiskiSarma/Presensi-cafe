<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'bisnis_id',
        'nama_shift',
        'jam_mulai',
        'jam_selesai',
        'toleransi_telat_menit',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function bisnis()
    {
        return $this->belongsTo(Bisnis::class);
    }

    public function jadwalShifts()
    {
        return $this->hasMany(JadwalShift::class);
    }
}
