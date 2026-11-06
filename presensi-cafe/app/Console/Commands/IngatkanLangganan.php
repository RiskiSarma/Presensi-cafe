<?php

namespace App\Console\Commands;

use App\Models\Langganan;
use App\Models\User;
use App\Notifications\LanggananAkanBerakhir;
use App\Services\LanggananService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class IngatkanLangganan extends Command
{
    protected $signature = 'langganan:ingatkan';

    protected $description = 'Kirim email pengingat H-3 dan H-1 sebelum trial/langganan berakhir';

    public function handle(LanggananService $service): int
    {
        $terkirim = 0;

        $daftar = Langganan::with(['bisnis', 'paket'])
            ->whereIn('status', ['trial', 'aktif'])
            ->where('berakhir_at', '>', now())
            ->where('berakhir_at', '<=', now()->addDays(4))
            ->get();

        foreach ($daftar as $l) {
            if (! $l->bisnis || $l->bisnis->status === 'nonaktif') {
                continue;
            }

            // Lewati kalau sudah ada periode yang lebih baru (sudah diperpanjang)
            if ($service->langgananTerkini($l->bisnis)?->id !== $l->id) {
                continue;
            }

            $sisa = (int) round(($l->berakhir_at->copy()->startOfDay()->getTimestamp() - now()->startOfDay()->getTimestamp()) / 86400);

            if ($sisa === 3 && ! $l->reminder_3d_sent_at) {
                $terkirim += $this->kirim($l, 3, 'reminder_3d_sent_at');
            } elseif ($sisa === 1 && ! $l->reminder_1d_sent_at) {
                $terkirim += $this->kirim($l, 1, 'reminder_1d_sent_at');
            }
        }

        $this->info("Selesai. {$terkirim} pengingat terkirim.");

        return self::SUCCESS;
    }

    protected function kirim(Langganan $l, int $sisa, string $kolom): int
    {
        $admins = User::where('bisnis_id', $l->bisnis_id)->where('role', 'admin')->where('is_active', true)->get();
        $ok = 0;

        foreach ($admins as $admin) {
            try {
                $admin->notify(new LanggananAkanBerakhir($l, $sisa));
                $ok++;
            } catch (\Throwable $e) {
                Log::error("Gagal kirim pengingat langganan bisnis #{$l->bisnis_id}: " . $e->getMessage());
            }
        }

        if ($ok > 0) {
            $l->update([$kolom => now()]);
        }

        return $ok;
    }
}
