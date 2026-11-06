<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Pengingat email H-3 & H-1 sebelum trial/langganan berakhir.
// Di server: cron `* * * * * php artisan schedule:run`. Di Laragon/dev: `php artisan schedule:work`.
\Illuminate\Support\Facades\Schedule::command('langganan:ingatkan')->dailyAt('08:00');
