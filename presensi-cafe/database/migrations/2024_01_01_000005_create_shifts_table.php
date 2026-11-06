<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Master data shift, misal: Shift Pagi (07:00-15:00), Shift Sore (15:00-23:00)
     */
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('nama_shift'); // Shift Pagi, Shift Sore, dll
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->unsignedInteger('toleransi_telat_menit')->default(15);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
