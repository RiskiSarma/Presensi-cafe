<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tukar_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pemohon_id')->constrained('pegawai_profils')->cascadeOnDelete();
            $table->foreignId('target_id')->constrained('pegawai_profils')->cascadeOnDelete();
            $table->foreignId('jadwal_pemohon_id')->constrained('jadwal_shifts')->cascadeOnDelete();
            $table->foreignId('jadwal_target_id')->constrained('jadwal_shifts')->cascadeOnDelete();
            $table->string('alasan')->nullable();
            // menunggu_rekan | ditolak_rekan | menunggu_admin | disetujui | ditolak_admin | dibatalkan
            $table->string('status', 20)->default('menunggu_rekan');
            $table->string('catatan_admin')->nullable();
            $table->foreignId('diputuskan_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('diputuskan_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });

        // Fitur "Tukar Shift" tersedia di paket Pro dan Business
        foreach (['pro', 'business'] as $kode) {
            $paket = DB::table('paket')->where('kode', $kode)->first();
            if (! $paket) {
                continue;
            }
            $fitur = json_decode($paket->fitur, true) ?: [];
            if (! in_array('tukar_shift', $fitur, true)) {
                $fitur[] = 'tukar_shift';
                DB::table('paket')->where('id', $paket->id)->update(['fitur' => json_encode($fitur)]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tukar_shifts');
    }
};
