<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presensis', function (Blueprint $table) {
            $table->string('jenis_perangkat_masuk', 20)->nullable()->after('device_type_masuk');
            $table->string('jenis_perangkat_pulang', 20)->nullable()->after('device_type_pulang');
        });
    }

    public function down(): void
    {
        Schema::table('presensis', function (Blueprint $table) {
            $table->dropColumn(['jenis_perangkat_masuk', 'jenis_perangkat_pulang']);
        });
    }
};
