<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware; 
use App\Http\Middleware\EnsureUserRole;
use App\Http\Middleware\VerifyKioskToken;
use App\Http\Middleware\EnsureLanggananAktif;
use App\Http\Middleware\EnsureFitur;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => EnsureUserRole::class,
            'kiosk.token' => VerifyKioskToken::class,
            'langganan.aktif' => EnsureLanggananAktif::class,
            'fitur' => EnsureFitur::class,
        ]);
    })
    ->withExceptions(function (\Illuminate\Foundation\Configuration\Exceptions $exceptions) {
        // Semua permintaan API selalu dijawab JSON
        $exceptions->shouldRenderJsonWhen(fn (\Illuminate\Http\Request $request, \Throwable $e) => $request->is('api/*') || $request->expectsJson());

        // Error API dijawab dengan pesan umum berbahasa Indonesia: tanpa nama class, query SQL, path file, atau stack trace.
        // (Detail lengkap tetap tercatat di storage/logs/laravel.log.)
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if (! ($request->is('api/*') || $request->expectsJson())) {
                return null; // halaman web memakai resources/views/errors/*.blade.php
            }

            // Validasi (422) dan belum login (401) sudah punya format sendiri yang aman
            if ($e instanceof \Illuminate\Validation\ValidationException || $e instanceof \Illuminate\Auth\AuthenticationException) {
                return null;
            }

            $http = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
            $status = $http ? $e->getStatusCode() : 500;

            // Saat development (APP_DEBUG=true) error server dibiarkan lengkap supaya mudah dilacak.
            // DI PRODUCTION WAJIB APP_DEBUG=false.
            if ($status >= 500 && config('app.debug')) {
                return null;
            }

            $umum = [
                400 => 'Permintaan tidak valid.',
                403 => 'Anda tidak punya izin untuk melakukan ini.',
                404 => 'Data atau halaman yang dicari tidak ditemukan.',
                405 => 'Permintaan tidak diizinkan.',
                419 => 'Sesi Anda sudah kedaluwarsa. Muat ulang halaman lalu coba lagi.',
                429 => 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
                500 => 'Terjadi kesalahan di server kami. Silakan coba lagi nanti.',
                503 => 'Layanan sedang dalam pemeliharaan. Coba lagi beberapa saat lagi.',
            ];
            $pesan = $umum[$status] ?? ($status >= 500 ? $umum[500] : 'Permintaan tidak dapat diproses.');

            // abort(403, 'pesan') yang sengaja ditulis di controller boleh tampil; pesan bawaan framework tidak
            if ($status === 403 && $http) {
                $msg = $e->getMessage();
                if ($msg !== '' && $msg !== 'This action is unauthorized.') {
                    $pesan = $msg;
                }
            }

            return response()->json(['message' => $pesan], $status, $http ? $e->getHeaders() : []);
        });
    })->create();
