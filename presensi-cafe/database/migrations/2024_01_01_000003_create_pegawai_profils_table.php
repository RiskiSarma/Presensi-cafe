<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Profil detail pegawai. Relasi 1-1 ke users.
     * Kolom `jabatan` menyimpan posisi kerja (kasir, waiters, barista, dll)
     * — ini HANYA atribut informasi, bukan level permission baru.
     * Level user tetap cuma 2: admin & pegawai (dari kolom role di users).
     */
    public function up(): void
    {
        Schema::create('pegawai_profils', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('kode_pegawai')->unique(); // misal: EMP-0001
            $table->string('jabatan'); // kasir, waiters, barista, cleaning service, dll
            $table->string('no_telepon')->nullable();
            $table->text('alamat')->nullable();
            $table->date('tanggal_bergabung')->nullable();
            $table->string('foto_profil')->nullable(); // path foto profil umum
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pegawai_profils');
    }
};
