<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CafeSetting;
use Illuminate\Http\Request;

class CafeSettingController extends Controller
{
    public function show()
    {
        return response()->json(CafeSetting::first());
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'nama_cabang' => 'required|string|max:255',
            'alamat' => 'nullable|string',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius_meter' => 'required|integer|min:10',
        ]);

        $setting = CafeSetting::first();

        if ($setting) {
            $setting->update($validated);
        } else {
            $setting = CafeSetting::create($validated);
        }

        return response()->json($setting);
    }
}