<?php

return [
    // Lama masa percobaan gratis untuk bisnis baru (hari)
    'trial_hari' => (int) env('LANGGANAN_TRIAL_HARI', 14),

    // Paket untuk masa percobaan (kode paket). Sama seperti KasirHub: Starter = uji coba gratis.
    // Setelah trial habis akun langsung mati sampai berlangganan (tidak ada masa tenggang untuk trial).
    'trial_paket' => 'starter',

    // Masa tenggang HANYA untuk langganan berbayar yang baru berakhir: masih bisa dipakai, tapi muncul peringatan merah
    'grace_hari' => (int) env('LANGGANAN_GRACE_HARI', 3),

    // URL frontend (Next.js), dipakai di link email pengingat & redirect selesai bayar Midtrans
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

    // Kode unik 3 digit ditambahkan ke nominal transfer manual supaya pembayaran mudah dicocokkan di mutasi rekening.
    // Set false kalau tidak mau. (Midtrans tidak memakai kode unik.)
    'kode_unik' => (bool) env('LANGGANAN_KODE_UNIK', true),

    // Rekening tujuan transfer (pembayaran manual, dikonfirmasi super admin)
    'rekening' => [
        'bank' => env('LANGGANAN_BANK', 'BCA'),
        'nomor' => env('LANGGANAN_REKENING_NOMOR', '0000000000'),
        'atas_nama' => env('LANGGANAN_REKENING_NAMA', 'Isi di .env'),
    ],

    // Katalog fitur yang bisa di-toggle per paket / per bisnis.
    // Tambah fitur baru: daftarkan key di sini, lalu pasang middleware 'fitur:<key>' di route terkait.
    'fitur' => [
        'kiosk' => [
            'label' => 'Mode Kiosk Tablet',
            'deskripsi' => 'Presensi wajah lewat tablet di cafe, tanpa perlu HP pegawai.',
        ],
        'izin' => [
            'label' => 'Pengajuan Izin & Cuti',
            'deskripsi' => 'Pegawai ajukan izin/sakit/cuti, admin setujui atau tolak.',
        ],
        'lembur' => [
            'label' => 'Hitung Lembur Otomatis',
            'deskripsi' => 'Durasi lembur dicatat otomatis saat check-out.',
        ],
    ],
];
