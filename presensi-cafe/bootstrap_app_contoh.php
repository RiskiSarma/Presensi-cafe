<?php
// Ini BUKAN file baru yang berdiri sendiri — ini contoh bagian yang perlu
// kamu tambahkan ke file bootstrap/app.php yang sudah ada di project Laravel 12 kamu.
// Cari method ->withMiddleware(function (Middleware $middleware) { ... }) lalu tambahkan alias di bawah ini.

use App\Http\Middleware\EnsureUserRole;
use App\Http\Middleware\VerifyKioskToken;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php', // pastikan baris ini ada, kalau belum tambahkan
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => EnsureUserRole::class,
            'kiosk.token' => VerifyKioskToken::class,
        ]);
    })
    ->withExceptions(function ($exceptions) {
        //
    })->create();
