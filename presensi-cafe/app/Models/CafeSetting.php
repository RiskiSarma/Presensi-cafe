<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CafeSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_cabang',
        'alamat',
        'latitude',
        'longitude',
        'radius_meter',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    /**
     * Hitung jarak (dalam meter) dari titik lat/long tertentu ke lokasi cafe
     * menggunakan formula Haversine. Dipakai untuk validasi presensi via HP.
     */
    public function jarakDariCafe(float $lat, float $long): float
    {
        $earthRadius = 6371000; // meter

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
        return $this->jarakDariCafe($lat, $long) <= $this->radius_meter;
    }
}