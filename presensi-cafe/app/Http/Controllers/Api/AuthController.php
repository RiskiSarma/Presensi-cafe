<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Auth::attempt($validated)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda tidak aktif. Hubungi admin.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load(['pegawaiProfil', 'bisnis']),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil logout.']);
    }

    public function me(Request $request)
    {
        return response()->json(
            $request->user()->load(['pegawaiProfil', 'bisnis'])
        );
    }

    /**
     * Update profil akun sendiri (nama, email, ganti password opsional).
     * Bisa dipakai admin maupun pegawai - masing-masing cuma bisa edit akunnya sendiri.
     */
    public function updateProfil(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => ['nullable', 'string', 'confirmed', new \App\Rules\PasswordKuat()],
            'current_password' => 'required_with:password|string',
            'notif_harian' => 'sometimes|boolean',
            'no_whatsapp' => ['nullable', 'string', 'regex:/^(\+?62|0)8[0-9]{7,12}$/'],
            'notif_wa' => 'sometimes|boolean',
        ], [
            'no_whatsapp.regex' => 'Nomor WhatsApp tidak valid. Harus diawali +62 atau 0, diikuti 8 dan 7-12 digit angka.',
        ]);

        if (! empty($validated['password'])) {
            if (! Hash::check($validated['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Password saat ini salah.'],
                ]);
            }
            $user->password = Hash::make($validated['password']);
        }

        $user->name = $validated['name'];
        if ($user->email !== $validated['email']) {
            $user->email_verified_at = null; // email baru harus diverifikasi ulang
        }
        $user->email = $validated['email'];
        if (array_key_exists('notif_harian', $validated)) {
            $user->notif_harian = $validated['notif_harian'];
        }
        if (array_key_exists('no_whatsapp', $validated)) {
            $user->no_whatsapp = $validated['no_whatsapp'];
        }
        if (array_key_exists('notif_wa', $validated)) {
            // Whatsapp hanya bisa diaktifkan kalau nomor WA valid dan sudah diisi
            $user->notif_wa = $validated['notif_wa'];
        }
        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $user->fresh()->load(['pegawaiProfil', 'bisnis']),
        ]);
    }

    //* Info fitur tersedia di server untuk halaman profil. */
    public function opsiProfil(Request $request)
    {
        return response()->json(['wa_tersedia' => app(\App\Services\WhatsAppService::class)->aktif()]);
    }
}
