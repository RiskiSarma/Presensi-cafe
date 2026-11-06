<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel setting cafe: nama, lokasi (lat/long), dan radius toleransi
     * untuk validasi GPS saat pegawai presensi lewat HP pribadi.
     * Didesain single-row / bisa multi-cabang (kolom nama_cabang).
     */
    public function up(): void
    {
        Schema::create('cafe_settings', function (Blueprint $table) {
            $table->id();
            $table->string('nama_cabang')->default('Cabang Utama');
            $table->string('alamat')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedInteger('radius_meter')->default(100); // toleransi radius presensi mobile
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cafe_settings');
    }
};
