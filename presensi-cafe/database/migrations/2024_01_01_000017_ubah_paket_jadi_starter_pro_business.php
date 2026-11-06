<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Penyesuaian data paket supaya sama seperti KasirHub: Starter (uji coba gratis) / Pro / Business.
     * Hanya mengubah nama & kode; harga yang sudah Anda atur di menu Paket tidak disentuh.
     */
    public function up(): void
    {
        $this->ganti('bisnis', 'pro', 'Pro');
        $this->ganti('premium', 'business', 'Business');

        DB::table('paket')->where('kode', 'starter')->update([
            'deskripsi' => 'Uji coba gratis 14 hari. Setelah itu akun nonaktif sampai berlangganan.',
            'harga_bulanan' => 0,
            'harga_tahunan' => 0,
            'max_cabang' => 1,
            'max_pegawai' => 10,
            'fitur' => json_encode(['izin']),
            'is_populer' => false,
        ]);
    }

    protected function ganti(string $kodeLama, string $kodeBaru, string $namaBaru): void
    {
        if (DB::table('paket')->where('kode', $kodeLama)->exists() && ! DB::table('paket')->where('kode', $kodeBaru)->exists()) {
            DB::table('paket')->where('kode', $kodeLama)->update(['kode' => $kodeBaru, 'nama' => $namaBaru]);
        }
    }

    public function down(): void
    {
        // data saja, tidak dibalik
    }
};
