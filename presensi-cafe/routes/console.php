<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Pengingat email H-3 & H-1 sebelum trial/langganan berakhir.
// Di server: cron `* * * * * php artisan schedule:run`. Di Laragon/dev: `php artisan schedule:work`.
\Illuminate\Support\Facades\Schedule::command('langganan:ingatkan')->dailyAt('08:00');

// Ringkasan harian (terlambat & tidak hadir) ke pemilik cafe. Jamnya diatur RINGKASAN_HARIAN_JAM di .env.
\Illuminate\Support\Facades\Schedule::command('presensi:ringkasan-harian')->dailyAt(config('presensi.ringkasan_harian_jam', '21:00'));
