<?php

namespace App\Console\Commands;

use App\Models\Bisnis;
use App\Models\Paket;
use App\Services\LanggananService;
use Illuminate\Console\Command;

class BackfillLangganan extends Command
{
    protected $signature = 'langganan:backfill {--hari= : Lama langganan awal dalam hari (default: LANGGANAN_TRIAL_HARI)}';

    protected $description = 'Beri langganan awal untuk bisnis lama yang belum punya langganan sama sekali';

    public function handle(LanggananService $service): int
    {
        $hari = (int) ($this->option('hari') ?: config('langganan.trial_hari', 14));

        $paket = Paket::where('kode', config('langganan.trial_paket'))->first();
        if (! $paket) {
            $this->error('Paket belum ada. Jalankan dulu: php artisan db:seed --class=PaketSeeder');

            return self::FAILURE;
        }

        $jumlah = 0;

        Bisnis::doesntHave('langganans')->where('status', '!=', 'nonaktif')->each(function (Bisnis $b) use ($service, $hari, $paket, &$jumlah) {
            $l = $service->mulaiTrial($b);
            // Bisnis yang sebelumnya sudah berstatus 'aktif' dianggap pelanggan berjalan, bukan trial
            $l->update([
                'status' => $b->status === 'aktif' ? 'aktif' : 'trial',
                'berakhir_at' => now()->addDays($hari),
                'catatan' => 'Langganan awal hasil backfill',
            ]);
            $this->line("- {$b->nama_bisnis}: paket {$paket->nama}, {$hari} hari");
            $jumlah++;
        });

        $this->info("Selesai. {$jumlah} bisnis diberi langganan awal.");

        return self::SUCCESS;
    }
}
