<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi ini WAJIB ada supaya Next.js (jalan di domain/port beda,
    | misal localhost:3000) diizinkan browser buat manggil API Laravel
    | (localhost:8000). Tanpa ini, semua request dari frontend bakal
    | diblokir browser dengan error "blocked by CORS policy".
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // GANTI sesuai domain frontend kamu waktu production nanti.
    // Untuk development, localhost:3000 (Next.js default) sudah cukup.
    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // false karena kita pakai Bearer token (Sanctum API token), bukan cookie session
    'supports_credentials' => false,

];
