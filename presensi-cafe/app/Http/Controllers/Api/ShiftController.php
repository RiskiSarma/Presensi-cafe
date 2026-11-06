<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Shift::where('bisnis_id', $request->user()->bisnis_id)->orderBy('jam_mulai')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_shift' => 'required|string|max:100',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i',
            'toleransi_telat_menit' => 'nullable|integer|min:0',
        ]);

        $validated['bisnis_id'] = $request->user()->bisnis_id;

        $shift = Shift::create($validated);

        return response()->json($shift, 201);
    }

    public function show(Request $request, Shift $shift)
    {
        $this->pastikanMilikBisnisSendiri($request, $shift);

        return response()->json($shift);
    }

    public function update(Request $request, Shift $shift)
    {
        $this->pastikanMilikBisnisSendiri($request, $shift);

        $validated = $request->validate([
            'nama_shift' => 'sometimes|string|max:100',
            'jam_mulai' => 'sometimes|date_format:H:i',
            'jam_selesai' => 'sometimes|date_format:H:i',
            'toleransi_telat_menit' => 'nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $shift->update($validated);

        return response()->json($shift);
    }

    public function destroy(Request $request, Shift $shift)
    {
        $this->pastikanMilikBisnisSendiri($request, $shift);

        $shift->update(['is_active' => false]);

        return response()->json(['message' => 'Shift dinonaktifkan.']);
    }

    protected function pastikanMilikBisnisSendiri(Request $request, Shift $shift): void
    {
        abort_unless($shift->bisnis_id === $request->user()->bisnis_id, 403, 'Anda tidak memiliki akses ke shift ini.');
    }
}
