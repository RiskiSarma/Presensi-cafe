<?php

namespace App\Console\Commands;

use App\Models\Bisnis;
use App\Models\HariLibur;
use App\Models\JadwalShift;
use App\Models\Presensi;
use App\Models\User;
use App\Notifications\RingkasanHarian as NotifikasiRingkasan;
use App\Services\LanggananService;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RingkasanHarian extends Command
{
    protected $signature = 'presensi:ringkasan-harian';

    protected $description = 'Kirim email ringkasan pegawai terlambat dan tidak hadir hari ini ke pemilik cafe';

    public function handle(LanggananService $service, WhatsAppService $wa): int
    {
        $hariIni = today();
        $terkirim = 0;

        foreach (Bisnis::all() as $bisnis) {
            if (! $service->status($bisnis)['akses']) {
                continue;
            }
            if (HariLibur::where('bisnis_id', $bisnis->id)->whereDate('tanggal', $hariIni)->exists()) {
                continue;
            }

            $milikBisnis = fn ($q) => $q->where('bisnis_id', $bisnis->id);

            $presensis = Presensi::with('pegawaiProfil.user')
                ->whereDate('tanggal', $hariIni)
                ->whereHas('pegawaiProfil.cabang', $milikBisnis)
                ->get();

            $terlambat = $presensis->where('status', 'terlambat')
                ->map(fn ($p) => ($p->pegawaiProfil->user->name ?? 'Pegawai') . ' (masuk ' . $p->jam_masuk?->format('H:i') . ')')
                ->values()->all();

            $adaCatatan = $presensis
                ->filter(fn ($p) => $p->jam_masuk !== null || in_array($p->status, ['izin', 'sakit', 'cuti'], true))
                ->pluck('pegawai_profil_id')->all();

            $belumHadir = JadwalShift::with(['pegawaiProfil.user', 'shift'])
                ->whereDate('tanggal', $hariIni)
                ->whereHas('pegawaiProfil', fn ($q) => $q->where('status_aktif', true)->whereHas('cabang', $milikBisnis))
                ->get()
                ->reject(fn ($j) => in_array($j->pegawai_profil_id, $adaCatatan, true))
                ->map(fn ($j) => ($j->pegawaiProfil->user->name ?? 'Pegawai') . ' (' . ($j->shift->nama_shift ?? 'shift') . ')')
                ->values()->all();

            if (! $terlambat && ! $belumHadir) {
                continue;
            }

            $penerima = User::where('bisnis_id', $bisnis->id)
                ->where('role', 'admin')->where('is_active', true)
                ->where(fn ($q) => $q->where('notif_harian', true)->orWhere('notif_wa', true))->get();

            $tanggalTeks = $hariIni->translatedFormat('d F Y');

            foreach ($penerima as $admin) {
                if($admin->notif_harian){
                try {
                    $admin->notify(new NotifikasiRingkasan($bisnis->nama_bisnis, $tanggalTeks, $terlambat, $belumHadir));
                    $terkirim++;
                } catch (\Throwable $e) {
                    Log::error("Gagal kirim ringkasan harian bisnis #{$bisnis->id}: " . $e->getMessage());
                }
            }

            // Salinan lewat WhatsApp kalau pemilik mengaktifkannya dan layanan tersambung
            if($admin->notif_wa && $admin->no_whatsapp && $wa->aktif()){
                $pesan = "*Ringkasan presensi {$bisnis->nama_bisnis}*\n{$tanggalTeks}\n";
                if ($terlambat) {
                    $pesan .= "\n*Pegawai Terlambat:*\n" . implode("\n", $terlambat);
                }
                if ($belumHadir) {
                    $pesan .= "\n\n*Pegawai Belum Hadir:*\n" . implode("\n", $belumHadir);
                }
                $pesan .= "\nBuka: " . rtrim(config('Langganan.frontend_url'), '/') . 'admin/presensi/';
                $wa->kirim($admin->no_whatsapp, $pesan);
            }
        }
    }

        $this->info("Selesai. {$terkirim} email ringkasan terkirim.");

        return self::SUCCESS;
    }
}
