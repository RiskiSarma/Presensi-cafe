<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PengajuanIzin extends Model
{
    use HasFactory;

    protected $fillable = [
        'pegawai_profil_id',
        'jenis',
        'tanggal_mulai',
        'tanggal_selesai',
        'alasan',
        'bukti_file',
        'status',
        'approved_by',
        'approved_at',
        'catatan_admin',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    public function pegawaiProfil()
    {
        return $this->belongsTo(PegawaiProfil::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
