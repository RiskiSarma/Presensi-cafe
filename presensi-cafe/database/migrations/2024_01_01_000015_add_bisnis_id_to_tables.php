<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Tenant isolation: users, cabangs, shifts langsung punya bisnis_id.
     * pegawai_profils/presensis/dll TIDAK perlu bisnis_id langsung -
     * mereka ke-scope otomatis lewat cabang_id -> cabangs.bisnis_id.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('bisnis_id')->nullable()->after('id')->constrained('bisnis')->nullOnDelete();
        });

        Schema::table('cabangs', function (Blueprint $table) {
            $table->foreignId('bisnis_id')->nullable()->after('id')->constrained('bisnis')->nullOnDelete();
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->foreignId('bisnis_id')->nullable()->after('id')->constrained('bisnis')->nullOnDelete();
        });

        // role diubah dari enum ke varchar supaya bisa tambah 'super_admin' tanpa migration enum lagi
        DB::statement("ALTER TABLE users MODIFY role VARCHAR(20) NOT NULL DEFAULT 'pegawai'");
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bisnis_id');
        });
        Schema::table('cabangs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bisnis_id');
        });
        Schema::table('shifts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bisnis_id');
        });
        DB::statement("ALTER TABLE users MODIFY role ENUM('admin','pegawai') NOT NULL DEFAULT 'pegawai'");
    }
};
