<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Aturan password: min 8 karakter, huruf besar, huruf kecil, angka, simbol,
 * dan tanpa spasi. Pesan dalam Bahasa Indonesia.
 * Aturan yang sama ditampilkan sebagai checklist di frontend (lib/password.ts).
 */
class PasswordKuat implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $value = (string) $value;
        $kurang = [];

        if (mb_strlen($value) < 8) {
            $kurang[] = 'minimal 8 karakter';
        }
        if (! preg_match('/[A-Z]/', $value)) {
            $kurang[] = 'huruf besar';
        }
        if (! preg_match('/[a-z]/', $value)) {
            $kurang[] = 'huruf kecil';
        }
        if (! preg_match('/\d/', $value)) {
            $kurang[] = 'angka';
        }
        if (! preg_match('/[^A-Za-z0-9\s]/', $value)) {
            $kurang[] = 'simbol (contoh: ! @ # $ %)';
        }

        if ($kurang) {
            $fail('Password harus memenuhi: ' . implode(', ', $kurang) . '.');

            return;
        }

        if (preg_match('/\s/', $value)) {
            $fail('Password tidak boleh mengandung spasi.');

            return;
        }

        if (mb_strlen($value) > 72) {
            $fail('Password maksimal 72 karakter.');

            return;
        }
    }
}
