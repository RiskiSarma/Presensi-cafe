<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\DicatatAktivitas;
use Illuminate\Database\Eloquent\Model;

class PengajuanIzin extends Model
{
    use HasFactory;
    use DicatatAktivitas;

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

    public function namaSubjekLog(): string
    {
        return 'Pengajuan izin';
    }

    public function labelLog(): string
    {
        return ($this->pegawaiProfil?->user?->name ?? 'pegawai') . ' (' . $this->jenis . ')';
    }

    public function bisnisIdLog(): ?int
    {
        return $this->pegawaiProfil?->cabang?->bisnis_id;
    }
}
