<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jadwal shift pegawai per tanggal. Admin yang mengatur ini.
     * Satu pegawai hanya boleh punya 1 jadwal per tanggal (unique constraint).
     */
    public function up(): void
    {
        Schema::create('jadwal_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_profil_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shift_id')->constrained()->cascadeOnDelete();
            $table->date('tanggal');
            $table->text('catatan')->nullable(); // misal: "gantiin shift Budi"
            $table->timestamps();

            $table->unique(['pegawai_profil_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jadwal_shifts');
    }
};
