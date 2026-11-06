<?php

namespace App\Http\Middleware;

use App\Services\LanggananService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFitur
{
    public function __construct(protected LanggananService $langganan)
    {
    }

    /** Pemakaian di route: ->middleware('fitur:kiosk') */
    public function handle(Request $request, Closure $next, string $fitur): Response
    {
        $user = $request->user();

        if ($user && $user->isSuperAdmin()) {
            return $next($request);
        }

        $bisnis = $request->attributes->get('bisnis') ?? $this->langganan->bisnisDariRequest($request);

        if (! $bisnis) {
            return response()->json(['message' => 'Akun tidak terhubung ke bisnis manapun.'], 403);
        }

        if (! $this->langganan->punyaFitur($bisnis, $fitur)) {
            $label = config("langganan.fitur.{$fitur}.label", $fitur);
            $namaPaket = $this->langganan->langgananTerkini($bisnis)?->paket?->nama ?? 'Anda saat ini';

            return response()->json([
                'message' => "Fitur \"{$label}\" tidak tersedia di paket {$namaPaket}. Upgrade paket untuk memakainya.",
                'kode' => 'FITUR_TIDAK_TERSEDIA',
                'fitur' => $fitur,
            ], 403);
        }

        return $next($request);
    }
}
