<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bisnis;
use App\Models\Paket;
use App\Models\User;
use App\Services\LanggananService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BisnisController extends Controller
{
    public function __construct(protected LanggananService $langganan)
    {
    }

    public function index()
    {
        $daftar = Bisnis::withCount(['users', 'cabangs'])->latest()->get()
            ->map(fn (Bisnis $b) => array_merge($b->toArray(), [
                'langganan' => $this->langganan->ringkas($b),
                'fitur_efektif' => $this->langganan->fiturEfektif($b),
            ]));

        return response()->json($daftar);
    }

    /**
     * Super admin bikin bisnis baru + akun admin pertama bisnis itu sekaligus.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_bisnis' => 'required|string|max:255',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ]);

        $bisnis = DB::transaction(function () use ($validated) {
            $slug = Str::slug($validated['nama_bisnis']) . '-' . Str::random(4);

            $bisnis = Bisnis::create([
                'nama_bisnis' => $validated['nama_bisnis'],
                'slug' => $slug,
                'email_owner' => $validated['admin_email'],
                'status' => 'trial',
            ]);

            User::create([
                'bisnis_id' => $bisnis->id,
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => Hash::make($validated['admin_password']),
                'role' => 'admin',
            ]);

            // Bisnis baru langsung dapat masa percobaan gratis
            $this->langganan->mulaiTrial($bisnis);

            return $bisnis;
        });

        return response()->json($bisnis, 201);
    }

    public function update(Request $request, Bisnis $bisnis)
    {
        $validated = $request->validate([
            'nama_bisnis' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:trial,aktif,nonaktif',
        ]);

        $bisnis->update($validated);

        return response()->json($bisnis->fresh());
    }

    public function destroy(Bisnis $bisnis)
    {
        if ($bisnis->cabangs()->exists()) {
            return response()->json([
                'message' => 'Bisnis tidak bisa dihapus karena masih ada cabang/data terkait. Nonaktifkan saja.',
            ], 422);
        }

        $bisnis->delete();

        return response()->json(['message' => 'Bisnis dihapus.']);
    }

    /**
     * Super admin atur langganan manual (mis. pelanggan bayar cash, atau perpanjang masa trial).
     * Perilaku sama dengan pembayaran lunas: paket sama disambung, paket beda mulai dari sekarang.
     */
    public function aturLangganan(Request $request, Bisnis $bisnis)
    {
        $validated = $request->validate([
            'paket_id' => 'required|exists:paket,id',
            'siklus' => 'required|in:bulanan,tahunan',
            'berakhir_at' => 'nullable|date',
            'catatan' => 'nullable|string|max:255',
        ]);

        $paket = Paket::findOrFail($validated['paket_id']);

        $langganan = $this->langganan->aktifkan(
            $bisnis,
            $paket,
            $validated['siklus'],
            null,
            $validated['catatan'] ?? 'Diatur manual oleh super admin'
        );

        // Tanggal berakhir bisa ditimpa manual (mis. kompensasi / perpanjang trial)
        if (! empty($validated['berakhir_at'])) {
            $langganan->update(['berakhir_at' => Carbon::parse($validated['berakhir_at'])->endOfDay()]);
        }

        return response()->json($this->langganan->snapshot($bisnis->fresh()));
    }

    /**
     * Toggle fitur & batas khusus untuk satu bisnis, di luar bawaan paketnya.
     * Nilai null = ikuti paket (override dihapus).
     */
    public function aturFitur(Request $request, Bisnis $bisnis)
    {
        $kunciFitur = array_keys(config('langganan.fitur'));

        $validated = $request->validate([
            'fitur_override' => 'nullable|array',
            'fitur_override.*' => 'nullable|boolean',
            'batas_override' => 'nullable|array',
            'batas_override.max_cabang' => 'nullable|integer|min:1',
            'batas_override.max_pegawai' => 'nullable|integer|min:1',
        ]);

        $fitur = collect($validated['fitur_override'] ?? [])
            ->only($kunciFitur)
            ->filter(fn ($v) => $v !== null)
            ->map(fn ($v) => (bool) $v)
            ->all();

        $batas = collect($validated['batas_override'] ?? [])
            ->only(['max_cabang', 'max_pegawai'])
            ->filter(fn ($v) => $v !== null)
            ->map(fn ($v) => (int) $v)
            ->all();

        $bisnis->update([
            'fitur_override' => $fitur ?: null,
            'batas_override' => $batas ?: null,
        ]);

        return response()->json($this->langganan->snapshot($bisnis->fresh()));
    }
}
