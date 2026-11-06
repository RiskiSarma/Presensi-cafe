<?php

namespace App\Services;

use App\Models\Bisnis;
use App\Models\Cabang;
use App\Models\Langganan;
use App\Models\Paket;
use App\Models\PegawaiProfil;
use App\Models\PembayaranLangganan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LanggananService
{
    // ------------------------------------------------------------------
    // Status & akses
    // ------------------------------------------------------------------

    public function langgananTerkini(Bisnis $bisnis): ?Langganan
    {
        return Langganan::with('paket')
            ->where('bisnis_id', $bisnis->id)
            ->whereIn('status', ['trial', 'aktif'])
            ->orderByDesc('berakhir_at')
            ->first();
    }

    /**
     * Status turunan dari tanggal (tidak butuh cron):
     * trial/aktif -> grace (masa tenggang) -> kedaluwarsa. Plus nonaktif (di-suspend super admin).
     *
     * @return array{kode:string, akses:bool, langganan:?Langganan, sisa_hari:?int, grace_berakhir_at:?\Carbon\Carbon}
     */
    public function status(Bisnis $bisnis): array
    {
        $langganan = $this->langgananTerkini($bisnis);
        $sisaHari = null;
        $graceBerakhir = null;

        if ($langganan) {
            $sisaHari = (int) ceil(($langganan->berakhir_at->getTimestamp() - now()->getTimestamp()) / 86400);
            $graceBerakhir = $langganan->berakhir_at->copy()->addDays((int) config('langganan.grace_hari', 3));
        }

        if ($bisnis->status === 'nonaktif') {
            $kode = 'nonaktif';
            $akses = false;
        } elseif (! $langganan) {
            $kode = 'tanpa_langganan';
            $akses = false;
        } elseif (now()->lte($langganan->berakhir_at)) {
            $kode = $langganan->status === 'trial' ? 'trial' : 'aktif';
            $akses = true;
        } elseif ($langganan->status === 'aktif' && now()->lte($graceBerakhir)) {
            // Masa tenggang hanya untuk langganan berbayar. Trial habis = langsung mati.
            $kode = 'grace';
            $akses = true;
        } else {
            $kode = 'kedaluwarsa';
            $akses = false;
        }

        return [
            'kode' => $kode,
            'akses' => $akses,
            'langganan' => $langganan,
            'sisa_hari' => $sisaHari,
            'grace_berakhir_at' => $graceBerakhir,
        ];
    }

    public function bisnisDariRequest(Request $request): ?Bisnis
    {
        // Rute kiosk: bisnis ditentukan dari cabang pemilik token (di-set oleh VerifyKioskToken)
        $cabang = $request->attributes->get('cabang');
        if ($cabang) {
            return $cabang->bisnis;
        }

        return $request->user()?->bisnis;
    }

    // ------------------------------------------------------------------
    // Fitur & batas
    // ------------------------------------------------------------------

    public function fiturEfektif(Bisnis $bisnis, ?Paket $paket = null): array
    {
        $paket ??= $this->langgananTerkini($bisnis)?->paket;
        $dasar = $paket?->fitur ?? [];
        $override = $bisnis->fitur_override ?? [];

        $hasil = [];
        foreach (array_keys(config('langganan.fitur')) as $key) {
            $aktif = array_key_exists($key, $override) && $override[$key] !== null
                ? (bool) $override[$key]
                : in_array($key, $dasar, true);

            if ($aktif) {
                $hasil[] = $key;
            }
        }

        return $hasil;
    }

    public function punyaFitur(Bisnis $bisnis, string $fitur): bool
    {
        return in_array($fitur, $this->fiturEfektif($bisnis), true);
    }

    /** null = tanpa batas. Tanpa paket sama sekali = 0. */
    public function batas(Bisnis $bisnis, string $jenis, ?Paket $paket = null): ?int
    {
        $kolom = 'max_' . $jenis;
        $override = $bisnis->batas_override ?? [];

        if (isset($override[$kolom])) {
            return (int) $override[$kolom];
        }

        $paket ??= $this->langgananTerkini($bisnis)?->paket;

        return $paket ? $paket->{$kolom} : 0;
    }

    public function pemakaian(Bisnis $bisnis): array
    {
        return [
            'cabang' => Cabang::where('bisnis_id', $bisnis->id)->where('is_active', true)->count(),
            'pegawai' => PegawaiProfil::where('status_aktif', true)
                ->whereHas('cabang', fn ($q) => $q->where('bisnis_id', $bisnis->id))
                ->count(),
        ];
    }

    /** Return pesan error kalau menambah $tambah item bakal melewati batas paket, null kalau aman. */
    public function cekBatas(Bisnis $bisnis, string $jenis, int $tambah = 1): ?string
    {
        $batas = $this->batas($bisnis, $jenis);
        if ($batas === null) {
            return null;
        }

        $pakai = $this->pemakaian($bisnis)[$jenis];
        if ($pakai + $tambah > $batas) {
            $nama = $jenis === 'cabang' ? 'cabang aktif' : 'pegawai aktif';

            return "Batas paket tercapai: maksimal {$batas} {$nama}. Upgrade paket untuk menambah lebih banyak.";
        }

        return null;
    }

    // ------------------------------------------------------------------
    // Ringkasan untuk API
    // ------------------------------------------------------------------

    public function ringkas(Bisnis $bisnis): array
    {
        $st = $this->status($bisnis);
        $l = $st['langganan'];

        return [
            'status' => $st['kode'],
            'akses' => $st['akses'],
            'paket' => $l?->paket ? ['id' => $l->paket->id, 'kode' => $l->paket->kode, 'nama' => $l->paket->nama] : null,
            'siklus' => $l?->siklus,
            'berakhir_at' => $l?->berakhir_at?->toIso8601String(),
            'sisa_hari' => $st['sisa_hari'],
            'adalah_trial' => $l?->status === 'trial',
        ];
    }

    public function snapshot(Bisnis $bisnis): array
    {
        $st = $this->status($bisnis);
        $l = $st['langganan'];

        return array_merge($this->ringkas($bisnis), [
            'mulai_at' => $l?->mulai_at?->toIso8601String(),
            'grace_berakhir_at' => $st['grace_berakhir_at']?->toIso8601String(),
            'fitur' => $this->fiturEfektif($bisnis, $l?->paket),
            'batas' => [
                'cabang' => $this->batas($bisnis, 'cabang', $l?->paket),
                'pegawai' => $this->batas($bisnis, 'pegawai', $l?->paket),
            ],
            'pemakaian' => $this->pemakaian($bisnis),
            'pembayaran_terbuka' => PembayaranLangganan::with('paket')
                ->where('bisnis_id', $bisnis->id)
                ->whereIn('status', ['menunggu_pembayaran', 'menunggu_konfirmasi'])
                ->latest()
                ->first(),
        ]);
    }

    // ------------------------------------------------------------------
    // Mutasi
    // ------------------------------------------------------------------

    public function mulaiTrial(Bisnis $bisnis): ?Langganan
    {
        $paket = Paket::where('kode', config('langganan.trial_paket'))->first()
            ?? Paket::where('is_active', true)->orderBy('urutan')->first();

        if (! $paket) {
            return null;
        }

        return Langganan::create([
            'bisnis_id' => $bisnis->id,
            'paket_id' => $paket->id,
            'siklus' => 'bulanan',
            'status' => 'trial',
            'mulai_at' => now(),
            'berakhir_at' => now()->addDays((int) config('langganan.trial_hari', 14)),
            'catatan' => 'Masa percobaan gratis',
        ]);
    }

    /**
     * Aktifkan/perpanjang langganan.
     * - Paket sama & masih berjalan  -> periode baru disambung setelah berakhir_at (tidak ada hari hangus).
     * - Ganti paket / dari trial / sudah habis -> mulai dari sekarang; sisa periode lama dihentikan (tanpa prorata).
     */
    public function aktifkan(Bisnis $bisnis, Paket $paket, string $siklus, ?int $pembayaranId = null, ?string $catatan = null): Langganan
    {
        return DB::transaction(function () use ($bisnis, $paket, $siklus, $pembayaranId, $catatan) {
            $terkini = $this->langgananTerkini($bisnis);
            $sekarang = now();
            $mulai = $sekarang->copy();

            $sambung = $terkini
                && $terkini->status === 'aktif'
                && $terkini->paket_id === $paket->id
                && $terkini->berakhir_at->gt($sekarang);

            if ($sambung) {
                $mulai = $terkini->berakhir_at->copy();
            } elseif ($terkini && $terkini->berakhir_at->gt($sekarang)) {
                $terkini->update(['status' => 'dibatalkan', 'berakhir_at' => $sekarang]);
            }

            $berakhir = $siklus === 'tahunan'
                ? $mulai->copy()->addYear()
                : $mulai->copy()->addMonthsNoOverflow(1);

            $langganan = Langganan::create([
                'bisnis_id' => $bisnis->id,
                'paket_id' => $paket->id,
                'siklus' => $siklus,
                'status' => 'aktif',
                'mulai_at' => $mulai,
                'berakhir_at' => $berakhir,
                'pembayaran_id' => $pembayaranId,
                'catatan' => $catatan,
            ]);

            if ($bisnis->status !== 'nonaktif') {
                $bisnis->update(['status' => 'aktif']);
            }

            return $langganan->load('paket');
        });
    }

    /** Buat tagihan baru. Tagihan lama yang belum dibayar otomatis dibatalkan. */
    public function buatTagihan(Bisnis $bisnis, Paket $paket, string $siklus, string $metode = 'transfer'): PembayaranLangganan
    {
        return DB::transaction(function () use ($bisnis, $paket, $siklus, $metode) {
            PembayaranLangganan::where('bisnis_id', $bisnis->id)
                ->where('status', 'menunggu_pembayaran')
                ->update(['status' => 'dibatalkan']);

            $dasar = $paket->harga($siklus);

            // Kode unik 3 digit ditambahkan ke nominal supaya transfer mudah dicocokkan di mutasi rekening
            // (hanya untuk transfer manual; Midtrans mencocokkan pembayaran lewat order_id)
            $kodeUnik = 0;
            for ($i = 0; $metode === 'transfer' && config('langganan.kode_unik', true) && $i < 30; $i++) {
                $kandidat = random_int(11, 999);
                $bentrok = PembayaranLangganan::whereIn('status', ['menunggu_pembayaran', 'menunggu_konfirmasi'])
                    ->where('jumlah_total', $dasar + $kandidat)
                    ->exists();
                if (! $bentrok) {
                    $kodeUnik = $kandidat;
                    break;
                }
            }

            return PembayaranLangganan::create([
                'bisnis_id' => $bisnis->id,
                'paket_id' => $paket->id,
                'siklus' => $siklus,
                'metode' => $metode,
                'jumlah_dasar' => $dasar,
                'kode_unik' => $kodeUnik,
                'jumlah_total' => $dasar + $kodeUnik,
                'status' => 'menunggu_pembayaran',
            ])->load('paket');
        });
    }

    /**
     * Tandai tagihan lunas + aktifkan langganan. Aman dipanggil berulang (webhook Midtrans bisa dikirim
     * beberapa kali): baris dikunci, dan tagihan yang sudah diproses diabaikan. Return null kalau sudah diproses.
     */
    public function selesaikanPembayaran(PembayaranLangganan $pembayaran, ?int $oleh = null, ?string $catatan = null): ?Langganan
    {
        return DB::transaction(function () use ($pembayaran, $oleh, $catatan) {
            $p = PembayaranLangganan::whereKey($pembayaran->id)->lockForUpdate()->first();

            if (! $p || ! $p->terbuka()) {
                return null;
            }

            $p->update([
                'status' => 'lunas',
                'dikonfirmasi_at' => now(),
                'dikonfirmasi_oleh' => $oleh,
            ]);

            return $this->aktifkan($p->bisnis, $p->paket, $p->siklus, $p->id, $catatan ?? ('Pembayaran #' . $p->id));
        });
    }
}
