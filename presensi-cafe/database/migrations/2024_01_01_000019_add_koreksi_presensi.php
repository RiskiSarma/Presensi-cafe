<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presensis', function (Blueprint $table) {
            $table->foreignId('dikoreksi_oleh')->nullable()->after('catatan')->constrained('users')->nullOnDelete();
            $table->dateTime('dikoreksi_at')->nullable()->after('dikoreksi_oleh');
            $table->string('alasan_koreksi')->nullable()->after('dikoreksi_at');
        });

        // Jejak audit: setiap koreksi menyimpan kondisi sebelum & sesudah
        Schema::create('koreksi_presensis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('presensi_id')->constrained('presensis')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('sebelum')->nullable();
            $table->json('sesudah');
            $table->string('alasan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('koreksi_presensis');
        Schema::table('presensis', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dikoreksi_oleh');
            $table->dropColumn(['dikoreksi_at', 'alasan_koreksi']);
        });
    }
};
