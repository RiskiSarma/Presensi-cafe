<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KoreksiPresensi extends Model
{
    protected $fillable = ['presensi_id', 'user_id', 'sebelum', 'sesudah', 'alasan'];

    protected function casts(): array
    {
        return ['sebelum' => 'array', 'sesudah' => 'array'];
    }

    public function presensi()
    {
        return $this->belongsTo(Presensi::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
