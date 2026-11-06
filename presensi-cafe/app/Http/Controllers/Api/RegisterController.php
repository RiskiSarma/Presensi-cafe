<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bisnis;
use App\Models\User;
use App\Rules\PasswordKuat;
use App\Services\LanggananService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/** Pendaftaran mandiri pemilik cafe: membuat bisnis + akun admin + masa uji coba 14 hari. */
class RegisterController extends Controller
{
    public function register(Request $request, LanggananService $langganan)
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);

        $validated = $request->validate([
            'nama_bisnis' => 'required|string|min:3|max:100',
            'name' => 'required|string|min:3|max:100',
            'email' => 'required|email:rfc|max:255|unique:users,email',
            'password' => ['required', 'string', 'confirmed', new PasswordKuat()],
            'setuju' => 'accepted',
        ], [
            'nama_bisnis.required' => 'Nama cafe/bisnis wajib diisi.',
            'nama_bisnis.min' => 'Nama cafe/bisnis minimal 3 karakter.',
            'name.required' => 'Nama lengkap wajib diisi.',
            'name.min' => 'Nama lengkap minimal 3 karakter.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.',
            'password.required' => 'Password wajib diisi.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'setuju.accepted' => 'Anda perlu menyetujui syarat penggunaan.',
        ]);

        $user = DB::transaction(function () use ($validated, $langganan) {
            $bisnis = Bisnis::create([
                'nama_bisnis' => $validated['nama_bisnis'],
                'slug' => Str::slug($validated['nama_bisnis']) . '-' . Str::random(4),
                'email_owner' => $validated['email'],
                'status' => 'trial',
            ]);

            $user = User::create([
                'bisnis_id' => $bisnis->id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'admin',
            ]);

            // Uji coba gratis 14 hari di paket Starter
            $langganan->mulaiTrial($bisnis);

            return $user;
        });

        return response()->json([
            'user' => $user->load(['pegawaiProfil', 'bisnis']),
            'token' => $user->createToken('auth-token')->plainTextToken,
        ], 201);
    }
}
