<?php

namespace App\Http\Middleware;

use App\Models\Cabang;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyKioskToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Kiosk-Token');

        $cabang = $token
            ? Cabang::where('kiosk_token', $token)->where('is_active', true)->first()
            : null;

        if (! $cabang) {
            return response()->json([
                'message' => 'Token kiosk tidak valid atau cabang tidak aktif.',
            ], 401);
        }

        $request->attributes->set('cabang', $cabang);

        return $next($request);
    }
}
