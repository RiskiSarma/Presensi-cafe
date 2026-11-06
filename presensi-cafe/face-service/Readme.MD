# Face Recognition Service

Microservice Python (FastAPI) yang menangani semua proses pengenalan wajah untuk sistem presensi cafe. Dipanggil oleh Laravel lewat `app/Services/FaceRecognitionService.php`.

## Menjalankan (rekomendasi: Docker)

```bash
cd face-service
docker build -t face-service .
docker run -p 8001:8001 face-service
```

Build pertama kali akan lama (10-15 menit) karena `dlib` di-compile dari source. Setelah image jadi, run berikutnya instan.

Cek service jalan:
```bash
curl http://localhost:8001/health
# {"status":"ok"}
```

## Menjalankan tanpa Docker (kalau sudah punya cmake & compiler C++ terpasang)

```bash
cd face-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Kalau instalasi `dlib` gagal di Windows, opsi paling gampang adalah **pakai Docker** (di atas) daripada install manual — ini masalah umum, bukan salah kode.

## Menambahkan ke docker-compose.yml

Kalau backend Laravel kamu juga sudah pakai Docker Compose, tambahkan service ini:

```yaml
services:
  face-service:
    build: ./face-service
    ports:
      - "8001:8001"
    restart: unless-stopped
```

Lalu di `.env` Laravel, ganti:
```
FACE_RECOGNITION_SERVICE_URL=http://face-service:8001
```
(pakai nama service Docker, bukan `localhost`, karena container beda jaringan)

## Testing manual endpoint

```bash
# Generate embedding dari foto
curl -X POST http://localhost:8001/generate-embedding \
  -F "foto=@/path/ke/foto.jpg"

# Verifikasi 1:1
curl -X POST http://localhost:8001/verify \
  -F "foto=@/path/ke/foto_baru.jpg" \
  -F "embedding=[0.1,0.2,...]" \
  -F "threshold=70"
```

## Tuning akurasi (threshold)

- Confidence dihitung dari face distance: `confidence = (1 - distance) * 100`
- Default threshold di Laravel: `70.0` (%)
- Kalau sering gagal kenali pegawai yang aslinya benar → **turunkan** threshold (misal ke 60-65)
- Kalau ada kasus salah kenali orang lain → **naikkan** threshold (misal ke 75-80)
- Rekomendasi: kumpulkan beberapa foto uji dulu (siang/malam, dengan/tanpa masker jika relevan) sebelum menentukan angka final, karena kondisi pencahayaan cafe mempengaruhi banget.

## Catatan akurasi

- Model `hog` (dipakai di kode) lebih cepat tapi kurang akurat dibanding `cnn`. Untuk cafe dengan traffic gak terlalu tinggi, `hog` biasanya cukup dan jauh lebih ringan (gak butuh GPU).
- Kalau nanti akurasi kurang memuaskan di kondisi pencahayaan cafe yang temaram, pertimbangkan ganti model ke `cnn` (lebih akurat, tapi butuh GPU biar responsif) — tinggal ubah parameter di `face_recognition.face_locations(image, model="hog")` jadi `model="cnn"`.