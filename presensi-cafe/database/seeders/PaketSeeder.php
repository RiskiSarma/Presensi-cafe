<?php

namespace Database\Seeders;

use App\Models\Paket;
use Illuminate\Database\Seeder;

class PaketSeeder extends Seeder
{
    /**
     * Harga di bawah ini nilai AWAL saja. Setelah di-seed, ubah lewat menu Super Admin > Paket
     * (seeder ini tidak menimpa harga yang sudah kamu ubah, lihat firstOrCreate).
     * Harga tahunan = bayar 10 bulan (gratis 2 bulan), sama seperti KasirHub.
     * Acuan KasirHub: Pro Rp299.000, Business Rp799.000 per bulan; paket di sini sedikit di atasnya.
     */
    public function run(): void
    {
        $paket = [
            [
                'kode' => 'starter',
                'nama' => 'Starter',
                'deskripsi' => 'Uji coba gratis 14 hari. Setelah itu akun nonaktif sampai berlangganan.',
                'harga_bulanan' => 0,
                'harga_tahunan' => 0,
                'max_cabang' => 1,
                'max_pegawai' => 10,
                'fitur' => ['izin'],
                'urutan' => 1,
                'is_populer' => false,
            ],
            [
                'kode' => 'pro',
                'nama' => 'Pro',
                'deskripsi' => 'Untuk cafe berkembang: kiosk tablet, lembur otomatis, beberapa cabang.',
                'harga_bulanan' => 349000,
                'harga_tahunan' => 3490000,
                'max_cabang' => 3,
                'max_pegawai' => 50,
                'fitur' => ['izin', 'kiosk', 'lembur'],
                'urutan' => 2,
                'is_populer' => true,
            ],
            [
                'kode' => 'business',
                'nama' => 'Business',
                'deskripsi' => 'Untuk jaringan cafe dengan banyak cabang dan pegawai.',
                'harga_bulanan' => 899000,
                'harga_tahunan' => 8990000,
                'max_cabang' => 10,
                'max_pegawai' => 200,
                'fitur' => ['izin', 'kiosk', 'lembur'],
                'urutan' => 3,
                'is_populer' => false,
            ],
        ];

        foreach ($paket as $data) {
            Paket::firstOrCreate(['kode' => $data['kode']], $data + ['is_active' => true]);
        }
    }
}
