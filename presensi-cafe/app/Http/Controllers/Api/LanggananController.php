<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        $tagihan = $this->service->buatTagihan($bisnis, $paket, $validated['siklus'], $metode);

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
