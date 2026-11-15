<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HariLibur extends Model
{
    protected $table = 'hari_libur';

    protected $fillable = ['bisnis_id', 'tanggal', 'nama'];

    protected function casts(): array
    {
        return ['tanggal' => 'date'];
    }
}
