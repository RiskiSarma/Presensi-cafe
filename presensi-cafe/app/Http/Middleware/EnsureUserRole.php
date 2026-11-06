<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    /**
     * Batasi akses route berdasarkan role user yang sedang login.
     * Pemakaian di routes: ->middleware('role:admin') atau ->middleware('role:pegawai')
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== $role) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke resource ini.',
            ], 403);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Akun Anda tidak aktif. Hubungi admin.',
            ], 403);
        }

        return $next($request);
    }
}
