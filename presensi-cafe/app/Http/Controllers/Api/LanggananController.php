<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kupon;
use App\Models\Langganan;
use App\Models\Paket;
use App\Models\PembayaranLangganan;
use App\Services\LanggananService;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LanggananController extends Controller
{
    public function __construct(protected LanggananService $service, protected MidtransService $midtrans)
    {
    }

    /** Publik: daftar paket aktif + katalog fitur (untuk halaman harga). */
    public function daftarPaket()
    {
        return response()->json([
            'paket' => Paket::where('is_active', true)->orderBy('urutan')->get(),
            'katalog_fitur' => self::katalogFitur(),
        ]);
    }

    public static function katalogFitur(): array
    {
        $hasil = [];
        foreach (config('langganan.fitur') as $key => $meta) {
            $hasil[] = ['key' => $key, 'label' => $meta['label'], 'deskripsi' => $meta['deskripsi']];
        }

        return $hasil;
    }

    /** Status langganan bisnis admin yang sedang login. */
    public function saya(Request $request)
    {
        return response()->json(array_merge(
            $this->service->snapshot($request->user()->bisnis),
            [
                'rekening' => config('langganan.rekening'),
                'midtrans' => [
                    'aktif' => $this->midtrans->aktif(),
                    'client_key' => config('midtrans.client_key'),
                    'is_production' => (bool) config('midtrans.is_production'),
                ],
            ]
        ));
    }

    public function riwayat(Request $request)
    {
        return response()->json(
            PembayaranLangganan::with('paket')
                ->where('bisnis_id', $request->user()->bisnis_id)
                ->latest()
                ->limit(50)
                ->get()
        );
    }

    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'paket_id' => 'required|exists:paket,id',
            'siklus' => 'required|in:bulanan,tahunan',
            'metode' => 'nullable|in:midtrans,transfer',
            'kode_kupon' => 'nullable|string|max:30',
        ]);

        $metode = $validated['metode'] ?? 'transfer';
        $bisnis = $request->user()->bisnis;
        $paket = Paket::findOrFail($validated['paket_id']);

        if ($paket->harga($validated['siklus']) <= 0) {
            return response()->json(['message' => 'Paket ini gratis (uji coba) dan tidak bisa dibeli. Pilih paket berbayar.'], 422);
        }

        if ($metode === 'midtrans' && ! $this->midtrans->aktif()) {
            return response()->json(['message' => 'Pembayaran online belum diaktifkan. Gunakan transfer manual.'], 422);
        }

        if (! $paket->is_active) {
            return response()->json(['message' => 'Paket ini sudah tidak dijual.'], 422);
        }

        $sedangDiverifikasi = PembayaranLangganan::where('bisnis_id', $bisnis->id)
            ->where('status', 'menunggu_konfirmasi')
            ->exists();

        if ($sedangDiverifikasi) {
            return response()->json([
                'message' => 'Pembayaran sebelumnya masih diverifikasi. Tunggu konfirmasi sebelum membuat tagihan baru.',
            ], 422);
        }

        // Cegah downgrade ke paket yang lebih kecil dari pemakaian sekarang
        $pemakaian = $this->service->pemakaian($bisnis);
        foreach (['cabang', 'pegawai'] as $jenis) {
            $batas = $paket->{'max_' . $jenis};
            if ($batas !== null && $pemakaian[$jenis] > $batas) {
                return response()->json([
                    'message' => "Paket {$paket->nama} hanya mendukung {$batas} {$jenis}, sedangkan Anda memakai {$pemakaian[$jenis]}. Nonaktifkan sebagian dulu atau pilih paket lebih besar.",
                ], 422);
            }
        }

        $kupon = null;
        if (! empty($validated['kode_kupon'])) {
            $kupon = Kupon::where('kode', strtoupper(trim($validated['kode_kupon'])))->first();
            $alasan = $kupon ? $kupon->alasanTidakValid($paket, $bisnis) : 'Kode kupon tidak ditemukan.';
            if ($alasan) {
                return response()->json(['message' => $alasan], 422);
            }
        }

        $tagihan = $this->service->buatTagihan($bisnis, $paket, $validated['siklus'], $metode, $kupon);

        // Diskon 100%: tidak perlu bayar, langsung aktif
        if ($tagihan->jumlah_total <= 0) {
            $this->service->selesaikanPembayaran($tagihan, null, 'Kupon ' . $kupon?->kode);

            return response()->json(['tagihan' => $tagihan->fresh()->load('paket'), 'rekening' => config('langganan.rekening')], 201);
        }

        if ($metode === 'midtrans') {
            try {
                $this->midtrans->buatSnapToken($tagihan, $request->user());
                $tagihan = $tagihan->fresh()->load('paket');
            } catch (\RuntimeException $e) {
                $tagihan->update(['status' => 'dibatalkan']);

                return response()->json(['message' => $e->getMessage()], 502);
            }
        }

        return response()->json([
            'tagihan' => $tagihan,
            'rekening' => config('langganan.rekening'),
        ], 201);
    }

    /** Cek kode kupon (umum, belum terikat paket). Potongan harga per paket dihitung di sisi tampilan lalu divalidasi ulang saat checkout. */
    public function cekKupon(Request $request)
    {
        $request->validate(['kode' => 'required|string|max:30']);

        $kupon = Kupon::where('kode', strtoupper(trim($request->kode)))->first();
        $alasan = $kupon ? $kupon->alasanTidakValid(null, $request->user()->bisnis) : 'Kode kupon tidak ditemukan.';

        if ($alasan) {
            return response()->json(['message' => $alasan], 422);
        }

        return response()->json($kupon->only(['kode', 'deskripsi', 'tipe', 'nilai', 'paket_target', 'berakhir_at']));
    }

    /** Data invoice untuk pembayaran yang sudah lunas. */
    public function invoice(Request $request, PembayaranLangganan $pembayaran)
    {
        $this->pastikanMilikBisnisSendiri($request, $pembayaran);

        if ($pembayaran->status !== 'lunas') {
            return response()->json(['message' => 'Invoice hanya tersedia untuk pembayaran yang sudah lunas.'], 422);
        }

        $pembayaran->load(['paket', 'bisnis']);
        $periode = Langganan::where('pembayaran_id', $pembayaran->id)->first();
        $tanggal = $pembayaran->dikonfirmasi_at ?? $pembayaran->updated_at;

        return response()->json([
            'nomor' => sprintf('INV-%s-%05d', $tanggal->format('Y'), $pembayaran->id),
            'tanggal' => $tanggal->toIso8601String(),
            'bisnis' => ['nama' => $pembayaran->bisnis->nama_bisnis, 'email' => $pembayaran->bisnis->email_owner],
            'paket' => $pembayaran->paket->nama,
            'siklus' => $pembayaran->siklus,
            'periode_mulai' => $periode?->mulai_at?->toIso8601String(),
            'periode_berakhir' => $periode?->berakhir_at?->toIso8601String(),
            'harga_asli' => $pembayaran->harga_asli ?? $pembayaran->jumlah_dasar,
            'diskon' => $pembayaran->diskon,
            'kode_kupon' => $pembayaran->kode_kupon,
            'kode_unik' => $pembayaran->kode_unik,
            'jumlah_total' => $pembayaran->jumlah_total,
            'metode' => $pembayaran->metode,
            'jenis_pembayaran' => $pembayaran->midtrans_payment_type,
            'penerbit' => config('langganan.penerbit'),
        ]);
    }

    public function uploadBukti(Request $request, PembayaranLangganan $pembayaran)
    {
        $this->pastikanMilikBisnisSendiri($request, $pembayaran);

        if (! $pembayaran->terbuka() || $pembayaran->metode !== 'transfer') {
            return response()->json(['message' => 'Tagihan ini sudah tidak bisa diubah atau dibayar lewat Midtrans.'], 422);
        }

        $request->validate([
            'bukti' => 'required|image|max:4096',
            'nama_pengirim' => 'nullable|string|max:100',
            'bank_pengirim' => 'nullable|string|max:50',
        ]);

        if ($pembayaran->bukti_path) {
            Storage::disk('public')->delete($pembayaran->bukti_path);
        }

        $pembayaran->update([
            'bukti_path' => $request->file('bukti')->store('bukti-langganan', 'public'),
            'nama_pengirim' => $request->input('nama_pengirim'),
            'bank_pengirim' => $request->input('bank_pengirim'),
            'status' => 'menunggu_konfirmasi',
            'dibayar_at' => now(),
        ]);

        return response()->json([
            'message' => 'Bukti transfer terkirim. Kami akan verifikasi secepatnya.',
            'tagihan' => $pembayaran->fresh()->load('paket'),
        ]);
    }

    /** Cek ke Midtrans apakah tagihan sudah dibayar (tanpa menunggu webhook). */
    public function sinkron(Request $request, PembayaranLangganan $pembayaran)
    {
        $this->pastikanMilikBisnisSendiri($request, $pembayaran);

        if ($pembayaran->metode === 'midtrans' && $pembayaran->midtrans_order_id && $pembayaran->terbuka()) {
            $status = $this->midtrans->cekStatus($pembayaran->midtrans_order_id);
            if ($status) {
                $this->midtrans->proses($status);
            }
        }

        return response()->json(['tagihan' => $pembayaran->fresh()->load('paket')]);
    }

    public function batalkan(Request $request, PembayaranLangganan $pembayaran)
    {
        $this->pastikanMilikBisnisSendiri($request, $pembayaran);

        if ($pembayaran->status !== 'menunggu_pembayaran') {
            return response()->json(['message' => 'Hanya tagihan yang belum dibayar yang bisa dibatalkan.'], 422);
        }

        $pembayaran->update(['status' => 'dibatalkan']);

        return response()->json(['message' => 'Tagihan dibatalkan.']);
    }

    protected function pastikanMilikBisnisSendiri(Request $request, PembayaranLangganan $pembayaran): void
    {
        abort_unless($pembayaran->bisnis_id === $request->user()->bisnis_id, 403, 'Anda tidak memiliki akses ke tagihan ini.');
    }
}
