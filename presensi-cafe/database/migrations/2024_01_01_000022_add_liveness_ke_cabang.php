<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cabangs', function (Blueprint $table) {
            // Kalau aktif, pegawai wajib berkedip saat presensi (anti foto/layar HP)
            $table->boolean('liveness_aktif')->default(false)->after('radius_meter');
        });
    }

    public function down(): void
    {
        Schema::table('cabangs', function (Blueprint $table) {
            $table->dropColumn('liveness_aktif');
        });
    }
};
