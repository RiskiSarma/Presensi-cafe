<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE presensis MODIFY device_type_masuk VARCHAR(20) NULL");
        DB::statement("ALTER TABLE presensis MODIFY device_type_pulang VARCHAR(20) NULL");

        DB::table('presensis')->where('device_type_masuk', 'mobile')->update(['device_type_masuk' => 'mandiri']);
        DB::table('presensis')->where('device_type_pulang', 'mobile')->update(['device_type_pulang' => 'mandiri']);
    }

    public function down(): void
    {
        DB::table('presensis')->where('device_type_masuk', 'mandiri')->update(['device_type_masuk' => 'mobile']);
        DB::table('presensis')->where('device_type_pulang', 'mandiri')->update(['device_type_pulang' => 'mobile']);

        DB::statement("ALTER TABLE presensis MODIFY device_type_masuk ENUM('kiosk','mobile') NULL");
        DB::statement("ALTER TABLE presensis MODIFY device_type_pulang ENUM('kiosk','mobile') NULL");
    }
};
