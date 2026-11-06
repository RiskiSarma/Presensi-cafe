<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel inti presensi. Setiap pegawai punya 1 baris presensi per hari
     * yang diisi jam_masuk saat check-in, lalu jam_pulang saat check-out.
     *
     * device_type membedakan sumber presensi:
     * - kiosk  : dari tablet/kamera fixed di cafe (trusted device)
     * - mobile : dari HP pribadi pegawai (wajib validasi GPS)
     */
    public function up(): void
    {
        Schema::create('presensis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_profil_id')->constrained()->cascadeOnDelete();
            $table->foreignId('jadwal_shift_id')->nullable()->constrained()->nullOnDelete();
            $table->date('tanggal');

            // Check-in
            $table->dateTime('jam_masuk')->nullable();
            $table->enum('device_type_masuk', ['kiosk', 'mobile'])->nullable();
            $table->decimal('latitude_masuk', 10, 7)->nullable();
            $table->decimal('longitude_masuk', 10, 7)->nullable();
            $table->string('foto_bukti_masuk')->nullable();
            $table->decimal('confidence_score_masuk', 5, 2)->nullable(); // skor kecocokan wajah (%)

            // Check-out
            $table->dateTime('jam_pulang')->nullable();
            $table->enum('device_type_pulang', ['kiosk', 'mobile'])->nullable();
            $table->decimal('latitude_pulang', 10, 7)->nullable();
            $table->decimal('longitude_pulang', 10, 7)->nullable();
            $table->string('foto_bukti_pulang')->nullable();
            $table->decimal('confidence_score_pulang', 5, 2)->nullable();

            $table->enum('status', [
                'tepat_waktu',
                'terlambat',
                'pulang_cepat',
                'tidak_hadir',
                'izin',
                'sakit',
                'cuti',
            ])->default('tepat_waktu');

            $table->text('catatan')->nullable(); // catatan admin, misal alasan approval manual

            $table->timestamps();

            $table->unique(['pegawai_profil_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presensis');
    }
};
