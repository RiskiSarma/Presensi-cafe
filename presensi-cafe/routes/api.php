<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BisnisController;
use App\Http\Controllers\Api\CabangController;
use App\Http\Controllers\Api\JadwalShiftController;
use App\Http\Controllers\Api\LanggananController;
use App\Http\Controllers\Api\MidtransNotificationController;
use App\Http\Controllers\Api\PaketController;
use App\Http\Controllers\Api\PembayaranLanggananController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\PegawaiController;
use App\Http\Controllers\Api\PengajuanIzinController;
use App\Http\Controllers\Api\PresensiController;
use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\ShiftController;
use Illuminate\Support\Facades\Route;

// ==========================
// Publik (tanpa login)
// ==========================
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [RegisterController::class, 'register'])->middleware('throttle:6,1');
Route::post('/forgot-password', [PasswordResetController::class, 'kirimLink'])->middleware('throttle:5,1');
Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:6,1');
Route::get('/paket', [LanggananController::class, 'daftarPaket']);
Route::post('/midtrans/notification', [MidtransNotificationController::class, 'handle']);

// ==========================
// Kiosk (proteksi token device, bukan login user)
// ==========================
Route::middleware(['kiosk.token', 'langganan.aktif', 'fitur:kiosk'])->prefix('kiosk')->group(function () {
    Route::post('/presensi/check-in', [PresensiController::class, 'checkInKiosk']);
    Route::post('/presensi/check-out', [PresensiController::class, 'checkOutKiosk']);
});

// ==========================
// Butuh login (semua role)
// ==========================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profil', [AuthController::class, 'updateProfil']);

    // ---------- Khusus PEGAWAI ----------
    Route::middleware(['role:pegawai', 'langganan.aktif'])->group(function () {
        Route::post('/presensi/check-in', [PresensiController::class, 'checkInMobile']);
        Route::post('/presensi/check-out', [PresensiController::class, 'checkOutMobile']);
        Route::get('/presensi/status-hari-ini', [PresensiController::class, 'statusHariIni']);
        Route::get('/presensi/riwayat-saya', [PresensiController::class, 'riwayatSaya']);

        Route::get('/jadwal-shift-saya', [JadwalShiftController::class, 'index']);

        Route::middleware('fitur:izin')->group(function () {
            Route::post('/pengajuan-izin', [PengajuanIzinController::class, 'store']);
            Route::get('/pengajuan-izin/riwayat-saya', [PengajuanIzinController::class, 'riwayatSaya']);
        });
    });

    // ---------- Khusus ADMIN ----------
    Route::middleware('role:admin')->group(function () {
        // Langganan: SENGAJA di luar 'langganan.aktif' supaya admin yang masa aktifnya habis tetap bisa bayar
        Route::get('/langganan/saya', [LanggananController::class, 'saya']);
        Route::get('/langganan/riwayat', [LanggananController::class, 'riwayat']);
        Route::post('/langganan/checkout', [LanggananController::class, 'checkout']);
        Route::post('/langganan/pembayaran/{pembayaran}/bukti', [LanggananController::class, 'uploadBukti']);
        Route::post('/langganan/pembayaran/{pembayaran}/sinkron', [LanggananController::class, 'sinkron']);
        Route::delete('/langganan/pembayaran/{pembayaran}', [LanggananController::class, 'batalkan']);
    });

    Route::middleware(['role:admin', 'langganan.aktif'])->group(function () {
        Route::apiResource('pegawai', PegawaiController::class);
        Route::post('/pegawai/{pegawai}/daftar-wajah', [PegawaiController::class, 'daftarWajah']);

        Route::apiResource('shifts', ShiftController::class);

        Route::get('/jadwal-shift', [JadwalShiftController::class, 'index']);
        Route::post('/jadwal-shift', [JadwalShiftController::class, 'store']);
        Route::post('/jadwal-shift/bulk', [JadwalShiftController::class, 'storeBulk']);
        Route::put('/jadwal-shift/{jadwalShift}', [JadwalShiftController::class, 'update']);
        Route::delete('/jadwal-shift/{jadwalShift}', [JadwalShiftController::class, 'destroy']);

        Route::get('/presensi', [PresensiController::class, 'index']);

        Route::middleware('fitur:izin')->group(function () {
            Route::get('/pengajuan-izin', [PengajuanIzinController::class, 'index']);
            Route::put('/pengajuan-izin/{pengajuanIzin}/approve', [PengajuanIzinController::class, 'approve']);
            Route::put('/pengajuan-izin/{pengajuanIzin}/reject', [PengajuanIzinController::class, 'reject']);
        });

        Route::get('/cabang', [CabangController::class, 'index']);
        Route::post('/cabang', [CabangController::class, 'store']);
        Route::get('/cabang/{cabang}', [CabangController::class, 'show']);
        Route::put('/cabang/{cabang}', [CabangController::class, 'update']);
        Route::delete('/cabang/{cabang}', [CabangController::class, 'destroy']);
        Route::post('/cabang/{cabang}/regenerate-token', [CabangController::class, 'regenerateToken']);
    });

    // ---------- Khusus SUPER ADMIN ----------
    Route::middleware('role:super_admin')->prefix('super-admin')->group(function () {
        Route::get('/bisnis', [BisnisController::class, 'index']);
        Route::post('/bisnis', [BisnisController::class, 'store']);
        Route::put('/bisnis/{bisnis}', [BisnisController::class, 'update']);
        Route::delete('/bisnis/{bisnis}', [BisnisController::class, 'destroy']);
        Route::put('/bisnis/{bisnis}/langganan', [BisnisController::class, 'aturLangganan']);
        Route::put('/bisnis/{bisnis}/fitur', [BisnisController::class, 'aturFitur']);

        Route::get('/paket', [PaketController::class, 'index']);
        Route::post('/paket', [PaketController::class, 'store']);
        Route::put('/paket/{paket}', [PaketController::class, 'update']);
        Route::delete('/paket/{paket}', [PaketController::class, 'destroy']);

        Route::get('/pembayaran', [PembayaranLanggananController::class, 'index']);
        Route::put('/pembayaran/{pembayaran}/konfirmasi', [PembayaranLanggananController::class, 'konfirmasi']);
        Route::put('/pembayaran/{pembayaran}/tolak', [PembayaranLanggananController::class, 'tolak']);
    });
});
