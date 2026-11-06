<?php
// Tambahkan array ini ke dalam config/services.php yang sudah ada (jangan replace seluruh file,
// cukup gabungkan key 'face_recognition' ke dalam array yang sudah ada)

return [

    // ... isi services.php bawaan Laravel yang lain (mailgun, postmark, dll) tetap di sini ...

    // Catatan: dulu ada key 'kiosk.token' di sini buat token statis global,
    // sekarang SUDAH TIDAK DIPAKAI - token kiosk sekarang per-cabang, disimpan
    // di kolom kiosk_token tabel cabangs (lihat CabangController & VerifyKioskToken).

    'face_recognition' => [
        'url' => env('FACE_RECOGNITION_SERVICE_URL', 'http://localhost:8001'),
    ],

];
