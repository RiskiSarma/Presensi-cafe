<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class LogAktivitas extends Model
{
    protected $table = 'log_aktivitas';

    protected $fillable = ['bisnis_id', 'user_id', 'aksi', 'subjek', 'deskripsi', 'perubahan', 'ip'];

    protected function casts(): array
    {
        return ['perubahan' => 'array'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Catat aktivitas secara manual. Tidak pernah boleh menggagalkan proses utama. */
    public static function catat(?int $bisnisId, ?User $user, string $aksi, string $subjek, string $deskripsi, ?array $perubahan = null): void
    {
        try {
            static::create([
                'bisnis_id' => $bisnisId,
                'user_id' => $user?->id,
                'aksi' => $aksi,
                'subjek' => $subjek,
                'deskripsi' => mb_substr($deskripsi, 0, 255),
                'perubahan' => $perubahan,
                'ip' => request()?->ip(),
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /** Dipanggil otomatis oleh trait DicatatAktivitas saat model dibuat/diubah/dihapus. */
    public static function catatModel(Model $model, string $aksi): void
    {
        $user = auth()->user();
        if (! $user) {
            return; // tindakan sistem / kiosk tidak dicatat
        }

        $bisnisId = $user->bisnis_id ?? $model->bisnisIdLog();
        if (! $bisnisId) {
            return;
        }

        $perubahan = null;
        if ($aksi === 'diubah') {
            $abaikan = ['updated_at', 'created_at', 'password', 'kiosk_token', 'remember_token'];
            $sesudah = Arr::except($model->getChanges(), $abaikan);
            if (! $sesudah) {
                return;
            }
            $perubahan = [
                'sebelum' => Arr::only($model->getOriginal(), array_keys($sesudah)),
                'sesudah' => $sesudah,
            ];
        }

        static::catat($bisnisId, $user, $aksi, $model->namaSubjekLog(), $model->namaSubjekLog() . ' ' . $model->labelLog() . ' ' . $aksi, $perubahan);
    }
}
