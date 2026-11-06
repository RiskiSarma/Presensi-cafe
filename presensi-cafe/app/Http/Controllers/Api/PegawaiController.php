<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FaceEmbedding;
use App\Models\PegawaiProfil;
use App\Models\User;
use App\Services\FaceRecognitionService;
use App\Services\LanggananService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PegawaiController extends Controller
{
    // Sama dengan ambang batas di PresensiController, biar konsisten
    protected float $ambangBatasDuplikat = 70.0;

    public function index(Request $request)
    {
        $pegawai = PegawaiProfil::with(['user', 'cabang'])
            ->whereHas('cabang', fn ($q) => $q->where('bisnis_id', $request->user()->bisnis_id))
            ->when($request->jabatan, fn ($q) => $q->where('jabatan', $request->jabatan))
            ->when($request->cabang_id, fn ($q) => $q->where('cabang_id', $request->cabang_id))
            ->when($request->status_aktif !== null, fn ($q) => $q->where('status_aktif', $request->boolean('status_aktif')))
            ->when($request->search, function ($q) use ($request) {
                $q->where('kode_pegawai', 'like', "%{$request->search}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$request->search}%"));
            })
            ->latest()
            ->paginate(15);

        return response()->json($pegawai);
    }

    public function store(Request $request, LanggananService $langganan)
    {
        if ($pesan = $langganan->cekBatas($request->user()->bisnis, 'pegawai')) {
            return response()->json(['message' => $pesan, 'kode' => 'BATAS_PAKET'], 403);
        }

        $bisnisId = $request->user()->bisnis_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'jabatan' => 'required|string|max:100',
            'cabang_id' => 'required|exists:cabangs,id',
            'no_telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'tanggal_bergabung' => 'nullable|date',
        ]);

        $cabangValid = \App\Models\Cabang::where('id', $validated['cabang_id'])->where('bisnis_id', $bisnisId)->exists();
        abort_unless($cabangValid, 422, 'Cabang tidak valid untuk bisnis Anda.');

        $pegawai = DB::transaction(function () use ($validated, $bisnisId) {
            $user = User::create([
                'bisnis_id' => $bisnisId,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'pegawai',
            ]);

            return PegawaiProfil::create([
                'user_id' => $user->id,
                'cabang_id' => $validated['cabang_id'],
                'kode_pegawai' => 'EMP-'.Str::padLeft((PegawaiProfil::max('id') + 1), 4, '0'),
                'jabatan' => $validated['jabatan'],
                'no_telepon' => $validated['no_telepon'] ?? null,
                'alamat' => $validated['alamat'] ?? null,
                'tanggal_bergabung' => $validated['tanggal_bergabung'] ?? now(),
            ]);
        });

        return response()->json($pegawai->load(['user', 'cabang']), 201);
    }

    public function show(Request $request, PegawaiProfil $pegawai)
    {
        $this->pastikanMilikBisnisSendiri($request, $pegawai);

        return response()->json($pegawai->load(['user', 'cabang', 'faceEmbeddingAktif']));
    }

    public function update(Request $request, PegawaiProfil $pegawai, LanggananService $langganan)
    {
        $this->pastikanMilikBisnisSendiri($request, $pegawai);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'jabatan' => 'sometimes|string|max:100',
            'cabang_id' => 'sometimes|exists:cabangs,id',
            'no_telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'status_aktif' => 'sometimes|boolean',
        ]);

        // Mengaktifkan kembali pegawai yang nonaktif dihitung sebagai menambah 1 pegawai
        if (filter_var($validated['status_aktif'] ?? false, FILTER_VALIDATE_BOOLEAN) && ! $pegawai->status_aktif) {
            if ($pesan = $langganan->cekBatas($request->user()->bisnis, 'pegawai')) {
                return response()->json(['message' => $pesan, 'kode' => 'BATAS_PAKET'], 403);
            }
        }

        if (isset($validated['cabang_id'])) {
            $cabangValid = \App\Models\Cabang::where('id', $validated['cabang_id'])->where('bisnis_id', $request->user()->bisnis_id)->exists();
            abort_unless($cabangValid, 422, 'Cabang tidak valid untuk bisnis Anda.');
        }

        if (isset($validated['name'])) {
            $pegawai->user()->update(['name' => $validated['name']]);
        }

        $pegawai->update(collect($validated)->except('name')->toArray());

        return response()->json($pegawai->fresh()->load(['user', 'cabang']));
    }

    public function destroy(Request $request, PegawaiProfil $pegawai)
    {
        $this->pastikanMilikBisnisSendiri($request, $pegawai);

        // Nonaktifkan, jangan hard-delete, supaya histori presensi tetap utuh
        $pegawai->update(['status_aktif' => false]);
        $pegawai->user()->update(['is_active' => false]);

        return response()->json(['message' => 'Pegawai dinonaktifkan.']);
    }

    /**
     * Daftarkan/registrasi ulang wajah pegawai.
     * Foto dikirim ke Python face service untuk diubah jadi embedding vector.
     */
    public function daftarWajah(Request $request, PegawaiProfil $pegawai, FaceRecognitionService $faceService)
    {
        $this->pastikanMilikBisnisSendiri($request, $pegawai);

        $request->validate([
            'foto' => 'required|image|max:5120', // max 5MB
        ]);

        $hasil = $faceService->generateEmbedding($request->file('foto'));

        if (! $hasil['success']) {
            return response()->json(['message' => $hasil['message']], 422);
        }

        // Cek duplikat: pastikan wajah ini belum dipakai pegawai lain yang masih aktif
        // DI BISNIS YANG SAMA (bukan lintas bisnis - beda tenant, gak relevan dicek).
        // Kandidat SENGAJA tidak menyertakan embedding milik $pegawai sendiri, supaya
        // re-registrasi ulang wajah pegawai yang sama tetap diizinkan.
        $kandidat = FaceEmbedding::query()
            ->where('is_active', true)
            ->where('pegawai_profil_id', '!=', $pegawai->id)
            ->whereHas('pegawaiProfil.cabang', fn ($q) => $q->where('bisnis_id', $request->user()->bisnis_id))
            ->with('pegawaiProfil.user')
            ->get()
            ->map(fn (FaceEmbedding $e) => [
                'pegawai_profil_id' => $e->pegawai_profil_id,
                'embedding' => $e->embedding_vector,
            ])
            ->all();

        if (! empty($kandidat)) {
            $cekDuplikat = $faceService->identifyFromCandidates(
                $request->file('foto'), $kandidat, $this->ambangBatasDuplikat
            );

            if ($cekDuplikat['success'] && $cekDuplikat['pegawai_profil_id'] !== null) {
                $pemilikAsli = PegawaiProfil::with('user')->find($cekDuplikat['pegawai_profil_id']);

                return response()->json([
                    'message' => 'Wajah ini sudah terdaftar atas nama '.($pemilikAsli?->user->name ?? 'pegawai lain').
                        '. Satu wajah tidak boleh dipakai untuk lebih dari satu akun pegawai.',
                ], 422);
            }
        }

        $path = $request->file('foto')->store('wajah-referensi', 'public');

        // Nonaktifkan embedding lama, simpan yang baru sebagai aktif
        $pegawai->faceEmbeddings()->update(['is_active' => false]);

        $embedding = FaceEmbedding::create([
            'pegawai_profil_id' => $pegawai->id,
            'embedding_vector' => $hasil['embedding'],
            'foto_referensi' => $path,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Wajah berhasil didaftarkan.',
            'data' => $embedding,
        ], 201);
    }

    protected function pastikanMilikBisnisSendiri(Request $request, PegawaiProfil $pegawai): void
    {
        abort_unless(
            $pegawai->cabang && $pegawai->cabang->bisnis_id === $request->user()->bisnis_id,
            403,
            'Anda tidak memiliki akses ke pegawai ini.'
        );
    }
}
