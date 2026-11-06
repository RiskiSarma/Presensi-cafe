<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FaceEmbedding extends Model
{
    use HasFactory;

    protected $fillable = [
        'pegawai_profil_id',
        'embedding_vector',
        'foto_referensi',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'embedding_vector' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function pegawaiProfil()
    {
        return $this->belongsTo(PegawaiProfil::class);
    }
}
