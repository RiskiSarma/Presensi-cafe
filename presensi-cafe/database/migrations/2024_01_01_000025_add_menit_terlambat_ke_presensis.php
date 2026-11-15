<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presensis', function (Blueprint $table) {
            // Menit datang setelah jam mulai shift (0 = tidak telat). Null = data lama / tanpa jadwal.
            $table->unsignedSmallInteger('menit_terlambat')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('presensis', function (Blueprint $table) {
            $table->dropColumn('menit_terlambat');
        });
    }
};
