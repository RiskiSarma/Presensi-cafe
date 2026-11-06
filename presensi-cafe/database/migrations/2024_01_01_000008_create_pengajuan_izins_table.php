<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pengajuan izin/sakit/cuti oleh pegawai, perlu approval admin.
     * Kalau disetujui, sistem akan otomatis update/insert status
     * di tabel presensis pada tanggal terkait.
     */
    public function up(): void
    {
        Schema::create('pengajuan_izins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_profil_id')->constrained()->cascadeOnDelete();
            $table->enum('jenis', ['izin', 'sakit', 'cuti']);
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->text('alasan');
            $table->string('bukti_file')->nullable(); // misal surat dokter

            $table->enum('status', ['pending', 'disetujui', 'ditolak'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->text('catatan_admin')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_izins');
    }
};
