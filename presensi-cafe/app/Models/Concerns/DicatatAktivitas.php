<?php

namespace App\Models\Concerns;

use App\Models\LogAktivitas;

/**
 * Pasang di model yang perubahannya perlu tercatat di Log Aktivitas (siapa mengubah apa dan kapan).
 * Model boleh menimpa namaSubjekLog(), labelLog(), dan bisnisIdLog().
 */
trait DicatatAktivitas
{
    public static function bootDicatatAktivitas(): void
    {
        static::created(fn ($m) => LogAktivitas::catatModel($m, 'dibuat'));
        static::updated(fn ($m) => LogAktivitas::catatModel($m, 'diubah'));
        static::deleted(fn ($m) => LogAktivitas::catatModel($m, 'dihapus'));
    }

    public function namaSubjekLog(): string
    {
        return class_basename($this);
    }

    public function labelLog(): string
    {
        return '#' . $this->getKey();
    }

    public function bisnisIdLog(): ?int
    {
        return $this->bisnis_id ?? null;
    }
}
