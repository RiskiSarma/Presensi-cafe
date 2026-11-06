<?php

return [
    // Berapa menit toleransi setelah jam shift selesai sebelum dianggap "lembur".
    // Contoh: shift selesai 16:00, ambang 30 menit -> checkout jam 16:31 baru dicatat lembur.
    'ambang_lembur_menit' => (int) env('AMBANG_LEMBUR_MENIT', 30),
];
