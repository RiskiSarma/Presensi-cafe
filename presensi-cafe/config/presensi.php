<?php

return [
    // Berapa menit toleransi setelah jam shift selesai sebelum dianggap "lembur".
    // Contoh: shift selesai 16:00, ambang 30 menit -> checkout jam 16:31 baru dicatat lembur.
    'ambang_lembur_menit' => (int) env('AMBANG_LEMBUR_MENIT', 30),

    // Jam pengiriman email ringkasan harian (terlambat & tidak hadir) ke pemilik cafe. Format 24 jam HH:MM.
    'ringkasan_harian_jam' => env('RINGKASAN_HARIAN_JAM', '21:00'),
];
