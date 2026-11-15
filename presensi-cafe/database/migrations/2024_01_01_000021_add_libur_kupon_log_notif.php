<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hari_libur', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bisnis_id')->constrained('bisnis')->cascadeOnDelete();
            $table->date('tanggal');
            $table->string('nama', 100);
            $table->timestamps();

            $table->unique(['bisnis_id', 'tanggal']);
        });

        Schema::create('kupons', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->unique();
            $table->string('deskripsi')->nullable();
            $table->string('tipe', 10)->default('persen'); // persen | nominal
            $table->unsignedInteger('nilai');
            $table->unsignedInteger('maks_pemakaian')->default(1);
            $table->unsignedInteger('terpakai')->default(0);
            $table->string('paket_target', 30)->default('all'); // 'all' atau kode paket
            $table->date('berakhir_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('pembayaran_langganans', function (Blueprint $table) {
            $table->foreignId('kupon_id')->nullable()->constrained('kupons')->nullOnDelete();
            $table->string('kode_kupon', 30)->nullable();
            $table->unsignedInteger('harga_asli')->nullable();
            $table->unsignedInteger('diskon')->default(0);
        });

        Schema::create('log_aktivitas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bisnis_id')->nullable()->constrained('bisnis')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('aksi', 20);       // dibuat | diubah | dihapus | koreksi | langganan
            $table->string('subjek', 40);     // Pegawai, Cabang, Shift, Presensi, ...
            $table->string('deskripsi');
            $table->json('perubahan')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            $table->index(['bisnis_id', 'created_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notif_harian')->default(true);
        });

        // Akun yang sudah ada dianggap terverifikasi supaya tidak tiba-tiba muncul peringatan
        DB::table('users')->whereNull('email_verified_at')->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notif_harian');
        });
        Schema::dropIfExists('log_aktivitas');
        Schema::table('pembayaran_langganans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('kupon_id');
            $table->dropColumn(['kode_kupon', 'harga_asli', 'diskon']);
        });
        Schema::dropIfExists('kupons');
        Schema::dropIfExists('hari_libur');
    }
};
