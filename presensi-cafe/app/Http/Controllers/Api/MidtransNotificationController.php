<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MidtransService;
use Illuminate\Http\Request;

class MidtransNotificationController extends Controller
{
    /** Webhook publik. Daftarkan di Midtrans: Settings > Configuration > Payment Notification URL. */
    public function handle(Request $request, MidtransService $midtrans)
    {
        $data = $request->all();

        if (! $midtrans->signatureValid($data)) {
            return response()->json(['message' => 'signature tidak valid'], 403);
        }

        if (! str_starts_with($data['order_id'] ?? '', 'SUB-')) {
            return response()->json(['message' => 'bukan transaksi langganan, diabaikan']);
        }

        $midtrans->proses($data);

        return response()->json(['message' => 'ok']);
    }
}
