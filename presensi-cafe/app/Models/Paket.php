<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paket extends Model
{
    protected $table = 'paket';

    protected $fillable = [
        'kode',
        'nama',
        'deskripsi',
        'harga_bulanan',
        'harga_tahunan',
        'max_cabang',
        'max_pegawai',
        'fitur',
        'urutan',
        'is_populer',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'fitur' => 'array',
            'harga_bulanan' => 'integer',
            'harga_tahunan' => 'integer',
            'max_cabang' => 'integer',
            'max_pegawai' => 'integer',
            'is_populer' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function langganans()
    {
        return $this->hasMany(Langganan::class);
    }

    public function harga(string $siklus): int
    {
        return $siklus === 'tahunan' ? $this->harga_tahunan : $this->harga_bulanan;
    }
}
