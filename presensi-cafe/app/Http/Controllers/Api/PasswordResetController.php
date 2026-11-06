<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Rules\PasswordKuat;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/** Lupa password lewat email terdaftar (link berlaku 60 menit, dikirim oleh broker bawaan Laravel). */
class PasswordResetController extends Controller
{
    public function kirimLink(Request $request)
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $request->validate(['email' => 'required|email'], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
        ]);

        try {
            $status = Password::sendResetLink(['email' => $request->email, 'is_active' => true]);
        } catch (\Throwable $e) {
            // Mis. SMTP belum diatur. Jangan bocorkan ke pengguna, cukup catat di log.
            Log::error('Gagal kirim email reset password: ' . $e->getMessage());
            $status = Password::RESET_LINK_SENT;
        }

        if ($status === Password::RESET_THROTTLED) {
            return response()->json(['message' => 'Terlalu sering mencoba. Tunggu 1 menit lalu coba lagi.'], 429);
        }

        // Respons sama untuk email terdaftar maupun tidak, supaya orang tidak bisa menebak email siapa yang terdaftar
        return response()->json([
            'message' => 'Jika email tersebut terdaftar, link untuk membuat password baru sudah kami kirim. Cek kotak masuk (dan folder spam). Link berlaku 60 menit.',
        ]);
    }

    public function reset(Request $request)
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);

        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => ['required', 'string', 'confirmed', new PasswordKuat()],
        ], [
            'password.required' => 'Password baru wajib diisi.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill(['password' => Hash::make($password)])->setRememberToken(Str::random(60));
                $user->save();
                // Semua perangkat yang sedang login dikeluarkan demi keamanan
                $user->tokens()->delete();
                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Link reset tidak valid atau sudah kedaluwarsa. Minta link baru lewat "Lupa password".',
            ], 422);
        }

        return response()->json(['message' => 'Password berhasil diubah. Silakan masuk dengan password baru.']);
    }
}
