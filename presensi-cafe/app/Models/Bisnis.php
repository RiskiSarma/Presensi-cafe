<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bisnis extends Model
{
    use HasFactory;

    protected $table = 'bisnis';

    protected $fillable = [
        'nama_bisnis',
        'slug',
        'email_owner',
        'status',
        'fitur_override',
        'batas_override',
    ];

    protected function casts(): array
    {
        return [
            'fitur_override' => 'array',
            'batas_override' => 'array',
        ];
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function cabangs()
    {
        return $this->hasMany(Cabang::class);
    }

    public function shifts()
    {
        return $this->hasMany(Shift::class);
    }

    public function langganans()
    {
        return $this->hasMany(Langganan::class);
    }

    public function pembayaranLangganans()
    {
        return $this->hasMany(PembayaranLangganan::class);
    }
}
