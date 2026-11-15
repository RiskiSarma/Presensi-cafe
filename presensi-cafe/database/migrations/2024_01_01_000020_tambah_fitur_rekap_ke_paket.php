<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Fitur "Rekap Bulanan & Ekspor" tersedia di paket Pro dan Business (Starter tidak). */
    public function up(): void
    {
        foreach (['pro', 'business'] as $kode) {
            $paket = DB::table('paket')->where('kode', $kode)->first();
            if (! $paket) {
                continue;
            }

            $fitur = json_decode($paket->fitur, true) ?: [];
            if (! in_array('rekap', $fitur, true)) {
                $fitur[] = 'rekap';
                DB::table('paket')->where('id', $paket->id)->update(['fitur' => json_encode($fitur)]);
            }
        }
    }

    public function down(): void
    {
        // data saja, tidak dibalik
    }
};
