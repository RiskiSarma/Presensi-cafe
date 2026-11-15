<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kupon extends Model
{
    protected $fillable = [
        'kode', 'deskripsi', 'tipe', 'nilai', 'maks_pemakaian', 'terpakai',
        'paket_target', 'berakhir_at', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'nilai' => 'integer',
            'maks_pemakaian' => 'integer',
            'terpakai' => 'integer',
            'berakhir_at' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /** Pesan alasan kalau kupon tidak bisa dipakai, null kalau boleh. $paket boleh null (cek umum). */
    public function alasanTidakValid(?Paket $paket, Bisnis $bisnis): ?string
    {
        if (! $this->is_active) {
            return 'Kupon ini sudah tidak aktif.';
        }
        if ($this->berakhir_at && $this->berakhir_at->endOfDay()->isPast()) {
            return 'Kupon ini sudah kedaluwarsa.';
        }
        if ($this->terpakai >= $this->maks_pemakaian) {
            return 'Kuota kupon ini sudah habis.';
        }
        if ($paket && $this->paket_target !== 'all' && $this->paket_target !== $paket->kode) {
            return 'Kupon ini tidak berlaku untuk paket yang Anda pilih.';
        }

        $sudahDipakai = PembayaranLangganan::where('bisnis_id', $bisnis->id)
            ->where('kupon_id', $this->id)
            ->where('status', 'lunas')
            ->exists();
        if ($sudahDipakai) {
            return 'Kupon ini sudah pernah Anda pakai.';
        }

        return null;
    }

    public function hitungDiskon(int $harga): int
    {
        $diskon = $this->tipe === 'persen' ? (int) round($harga * $this->nilai / 100) : $this->nilai;

        return max(0, min($diskon, $harga));
    }
}
