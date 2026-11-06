<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('cafe_settings', 'cabangs');

        Schema::table('cabangs', function (Blueprint $table) {
            $table->string('kiosk_token', 64)->unique()->nullable()->after('radius_meter');
            $table->boolean('is_active')->default(true)->after('kiosk_token');
        });

        \Illuminate\Support\Facades\DB::table('cabangs')->whereNull('kiosk_token')->get()->each(function ($row) {
            \Illuminate\Support\Facades\DB::table('cabangs')->where('id', $row->id)->update([
                'kiosk_token' => Str::random(48),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('cabangs', function (Blueprint $table) {
            $table->dropColumn(['kiosk_token', 'is_active']);
        });

        Schema::rename('cabangs', 'cafe_settings');
    }
};
