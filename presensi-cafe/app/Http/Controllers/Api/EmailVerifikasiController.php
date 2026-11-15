<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\VerifikasiEmail;
use Illuminate\Http\Request;

class EmailVerifikasiController extends Controller
{
    /** Dibuka dari link di email (sudah dijaga middleware 'signed'). Setelah itu diarahkan ke halaman login. */
    public function verifikasi(Request $request, int $id, string $hash)
    {
        $frontend = rtrim(config('langganan.frontend_url'), '/');
        $user = User::find($id);

        if (! $user || ! hash_equals(sha1($user->email), $hash)) {
            return redirect($frontend . '/login?verifikasi=gagal');
        }

        if (! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return redirect($frontend . '/login?verifikasi=sukses');
    }

    public function kirimUlang(Request $request)
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email Anda sudah terverifikasi.']);
        }

        try {
            $user->notify(new VerifikasiEmail());
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Email belum bisa dikirim saat ini. Coba lagi nanti.'], 503);
        }

        return response()->json(['message' => 'Link verifikasi sudah dikirim ke ' . $user->email . '.']);
    }
}
