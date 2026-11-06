<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Presensi extends Model
{
    use HasFactory;

    protected $fillable = [
        'pegawai_profil_id',
        'jadwal_shift_id',
        'tanggal',
        'jam_masuk',
        'device_type_masuk',
        'jenis_perangkat_masuk',
        'latitude_masuk',
        'longitude_masuk',
        'foto_bukti_masuk',
        'confidence_score_masuk',
        'jam_pulang',
        'device_type_pulang',
        'jenis_perangkat_pulang',
        'latitude_pulang',
        'longitude_pulang',
        'foto_bukti_pulang',
        'confidence_score_pulang',
        'status',
        'lembur_menit',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'jam_masuk' => 'datetime',
            'jam_pulang' => 'datetime',
            'latitude_masuk' => 'float',
            'longitude_masuk' => 'float',
            'latitude_pulang' => 'float',
            'longitude_pulang' => 'float',
            'confidence_score_masuk' => 'float',
            'confidence_score_pulang' => 'float',
        ];
    }

    public function pegawaiProfil()
    {
        return $this->belongsTo(PegawaiProfil::class);
    }

    public function jadwalShift()
    {
        return $this->belongsTo(JadwalShift::class);
    }

    /**
     * Cek apakah pegawai sudah check-in tapi belum check-out
     */
    public function sedangBekerja(): bool
    {
        return $this->jam_masuk !== null && $this->jam_pulang === null;
    }
}
