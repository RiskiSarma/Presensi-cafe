<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paket', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->unique();
            $table->string('nama', 100);
            $table->text('deskripsi')->nullable();
            $table->unsignedInteger('harga_bulanan');
            $table->unsignedInteger('harga_tahunan');
            // null = tanpa batas
            $table->unsignedInteger('max_cabang')->nullable();
            $table->unsignedInteger('max_pegawai')->nullable();
            // daftar key fitur yang aktif di paket ini, contoh: ["izin","kiosk"]
            $table->json('fitur');
            $table->unsignedSmallInteger('urutan')->default(0);
            $table->boolean('is_populer')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Satu baris = satu periode langganan. Riwayat disimpan, yang berlaku = berakhir_at paling akhir.
        Schema::create('langganans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bisnis_id')->constrained('bisnis')->cascadeOnDelete();
            $table->foreignId('paket_id')->constrained('paket')->restrictOnDelete();
            $table->string('siklus', 10)->default('bulanan'); // bulanan | tahunan
            $table->string('status', 20)->default('aktif');   // trial | aktif | dibatalkan
            $table->dateTime('mulai_at');
            $table->dateTime('berakhir_at');
            $table->unsignedBigInteger('pembayaran_id')->nullable();
            $table->string('catatan')->nullable();
            $table->timestamps();

            $table->index(['bisnis_id', 'berakhir_at']);
        });

        Schema::create('pembayaran_langganans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bisnis_id')->constrained('bisnis')->cascadeOnDelete();
            $table->foreignId('paket_id')->constrained('paket')->restrictOnDelete();
            $table->string('siklus', 10);
            $table->unsignedInteger('jumlah_dasar');
            $table->unsignedSmallInteger('kode_unik')->default(0);
            $table->unsignedInteger('jumlah_total');
            // menunggu_pembayaran | menunggu_konfirmasi | lunas | ditolak | dibatalkan
            $table->string('status', 30)->default('menunggu_pembayaran');
            $table->string('bukti_path')->nullable();
            $table->string('nama_pengirim')->nullable();
            $table->string('bank_pengirim', 50)->nullable();
            $table->dateTime('dibayar_at')->nullable();
            $table->dateTime('dikonfirmasi_at')->nullable();
            $table->foreignId('dikonfirmasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->string('alasan_tolak')->nullable();
            $table->timestamps();

            $table->index(['bisnis_id', 'status']);
        });

        Schema::table('bisnis', function (Blueprint $table) {
            // Override dari super admin: {"kiosk": true, "lembur": false}
            $table->json('fitur_override')->nullable();
            // Override batas: {"max_cabang": 5, "max_pegawai": 80}
            $table->json('batas_override')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('bisnis', function (Blueprint $table) {
            $table->dropColumn(['fitur_override', 'batas_override']);
        });
        Schema::dropIfExists('pembayaran_langganans');
        Schema::dropIfExists('langganans');
        Schema::dropIfExists('paket');
    }
};
