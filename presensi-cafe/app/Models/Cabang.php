<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cabang extends Model
{
    use HasFactory;

    protected $fillable = [
        'bisnis_id',
        'nama_cabang',
        'alamat',
        'latitude',
        'longitude',
        'radius_meter',
        'kiosk_token',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function bisnis()
    {
        return $this->belongsTo(Bisnis::class);
    }

    public function pegawaiProfils()
    {
        return $this->hasMany(PegawaiProfil::class);
    }

    public function jarakDariCabang(float $lat, float $long): float
    {
        $earthRadius = 6371000;

        $latFrom = deg2rad($this->latitude);
        $lonFrom = deg2rad($this->longitude);
        $latTo = deg2rad($lat);
        $lonTo = deg2rad($long);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $a = sin($latDelta / 2) ** 2 + cos($latFrom) * cos($latTo) * sin($lonDelta / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public function dalamRadius(float $lat, float $long): bool
    {
        return $this->jarakDariCabang($lat, $long) <= $this->radius_meter;
    }
}
