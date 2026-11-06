<?php

namespace Database\Seeders;

use App\Models\Bisnis;
use App\Models\Cabang;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(PaketSeeder::class);

        // Super admin - kelola semua bisnis, TIDAK terikat bisnis_id manapun
        User::firstOrCreate(
            ['email' => 'superadmin@presensi.com'],
            [
                'bisnis_id' => null,
                'name' => 'Super Admin',
                'password' => Hash::make('password123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );

        // Bisnis contoh (Kopi Analogi) + admin-nya
        $bisnis = Bisnis::firstOrCreate(
            ['slug' => 'kopi-analogi'],
            [
                'nama_bisnis' => 'Kopi Analogi',
                'email_owner' => 'admin@cafe.com',
                'status' => 'aktif',
            ]
        );

        User::firstOrCreate(
            ['email' => 'admin@cafe.com'],
            [
                'bisnis_id' => $bisnis->id,
                'name' => 'Admin Cafe',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        // Bisnis contoh langsung punya langganan aktif supaya bisa dicoba tanpa bayar
        if (! $bisnis->langganans()->exists()) {
            app(\App\Services\LanggananService::class)->aktifkan(
                $bisnis,
                \App\Models\Paket::where('kode', 'business')->firstOrFail(),
                'tahunan',
                null,
                'Bisnis contoh (seeder)'
            );
        }

        Shift::firstOrCreate(
            ['bisnis_id' => $bisnis->id, 'nama_shift' => 'Shift Pagi'],
            ['jam_mulai' => '08:00:00', 'jam_selesai' => '16:00:00', 'toleransi_telat_menit' => 15, 'is_active' => true]
        );

        Shift::firstOrCreate(
            ['bisnis_id' => $bisnis->id, 'nama_shift' => 'Shift Sore'],
            ['jam_mulai' => '16:00:00', 'jam_selesai' => '23:00:00', 'toleransi_telat_menit' => 15, 'is_active' => true]
        );

        Cabang::firstOrCreate(
            ['bisnis_id' => $bisnis->id, 'nama_cabang' => 'Cabang Utama'],
            [
                'alamat' => 'Ganti dengan alamat cafe kamu',
                'latitude' => 0,
                'longitude' => 0,
                'radius_meter' => 100,
                'kiosk_token' => Str::random(48),
                'is_active' => true,
            ]
        );

        $this->command->info('Login super admin: superadmin@presensi.com / password123');
        $this->command->info('Login admin Kopi Analogi: admin@cafe.com / password123');
        $this->command->warn('Kiosk token cabang pertama: ' . Cabang::first()->kiosk_token);
    }
}
