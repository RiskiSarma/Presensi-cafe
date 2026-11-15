<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;

class LogAktivitasController extends Controller
{
    /** Riwayat siapa mengubah apa dan kapan, khusus bisnis admin yang login. */
    public function index(Request $request)
    {
        return response()->json(
            LogAktivitas::with('user:id,name,role')
                ->where('bisnis_id', $request->user()->bisnis_id)
                ->when($request->subjek, fn ($q, $s) => $q->where('subjek', $s))
                ->latest()
                ->paginate(30)
        );
    }
}
