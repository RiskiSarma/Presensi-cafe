<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PegawaiProfil extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'cabang_id',
        'kode_pegawai',
        'jabatan',
        'no_telepon',
        'alamat',
        'tanggal_bergabung',
        'foto_profil',
        'status_aktif',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_bergabung' => 'date',
            'status_aktif' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cabang()
    {
        return $this->belongsTo(Cabang::class);
    }

    public function faceEmbeddings()
    {
        return $this->hasMany(FaceEmbedding::class);
    }

    public function faceEmbeddingAktif()
    {
        return $this->hasMany(FaceEmbedding::class)->where('is_active', true);
    }

    public function jadwalShifts()
    {
        return $this->hasMany(JadwalShift::class);
    }

    public function presensis()
    {
        return $this->hasMany(Presensi::class);
    }

    public function pengajuanIzins()
    {
        return $this->hasMany(PengajuanIzin::class);
    }
}
