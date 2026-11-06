<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menyimpan hasil "sidik wajah" (face embedding vector) tiap pegawai
     * yang dihasilkan oleh Python face recognition service.
     * Satu pegawai bisa punya lebih dari 1 embedding (misal didaftarkan
     * ulang dengan sudut/pencahayaan berbeda agar akurasi matching lebih baik).
     */
    public function up(): void
    {
        Schema::create('face_embeddings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_profil_id')->constrained()->cascadeOnDelete();
            $table->json('embedding_vector'); // hasil vector dari face recognition service
            $table->string('foto_referensi'); // path foto asli yang dipakai saat pendaftaran wajah
            $table->boolean('is_active')->default(true); // bisa nonaktifkan embedding lama tanpa hapus
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('face_embeddings');
    }
};
