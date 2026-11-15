<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TukarShift extends Model
{
    protected $fillable = [
        'pemohon_id', 'target_id', 'jadwal_pemohon_id', 'jadwal_target_id',
        'alasan', 'status', 'catatan_admin', 'diputuskan_oleh', 'diputuskan_at',
    ];

    protected function casts(): array
    {
        return ['diputuskan_at' => 'datetime'];
    }

    public function pemohon()
    {
        return $this->belongsTo(PegawaiProfil::class, 'pemohon_id');
    }

    public function target()
    {
        return $this->belongsTo(PegawaiProfil::class, 'target_id');
    }

    public function jadwalPemohon()
    {
        return $this->belongsTo(JadwalShift::class, 'jadwal_pemohon_id');
    }

    public function jadwalTarget()
    {
        return $this->belongsTo(JadwalShift::class, 'jadwal_target_id');
    }

    public function terbuka(): bool
    {
        return in_array($this->status, ['menunggu_rekan', 'menunggu_admin'], true);
    }
}
