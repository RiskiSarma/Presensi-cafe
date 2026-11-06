"""
Face Recognition Service
=========================
Microservice kecil buat handle semua urusan wajah, dipanggil dari Laravel
(app/Services/FaceRecognitionService.php).

3 endpoint utama:
- POST /generate-embedding  -> dipakai saat admin daftarkan wajah pegawai baru
- POST /verify              -> presensi MOBILE (1:1, cocokkan ke wajah sendiri)
- POST /identify            -> presensi KIOSK (1:N, cocokkan ke semua pegawai)

Menggunakan library `face_recognition` (berbasis dlib) untuk deteksi &
encoding wajah jadi vector 128 dimensi.
"""

import json

import face_recognition
import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="Face Recognition Service - Presensi Cafe")


# ==============================
#  Helper
# ==============================
def ekstrak_encoding(file_bytes: bytes):
    """
    Deteksi wajah dari bytes gambar, kembalikan encoding 128-d dari wajah
    PERTAMA/TERBESAR yang ditemukan (kalau ada beberapa wajah di 1 foto).
    Return None kalau tidak ada wajah terdeteksi sama sekali.
    """
    import io

    image = face_recognition.load_image_file(io.BytesIO(file_bytes))
    lokasi_wajah = face_recognition.face_locations(image, model="hog")

    if len(lokasi_wajah) == 0:
        return None

    # Kalau lebih dari 1 wajah, ambil yang area kotaknya paling besar
    # (asumsi: wajah yang paling dekat ke kamera = yang sedang presensi)
    if len(lokasi_wajah) > 1:
        lokasi_wajah = sorted(
            lokasi_wajah,
            key=lambda box: (box[2] - box[0]) * (box[1] - box[3]),
            reverse=True,
        )

    encodings = face_recognition.face_encodings(image, known_face_locations=[lokasi_wajah[0]])
    return encodings[0] if encodings else None


def jarak_ke_confidence(distance: float) -> float:
    """
    Ubah face distance (0 = identik, ~0.6 = ambang umum, >1 = beda jauh)
    jadi confidence score dalam persen (0-100) supaya gampang dipahami
    dan konsisten dengan threshold di sisi Laravel (default 70.0).
    """
    confidence = (1 - distance) * 100
    return max(0.0, min(100.0, confidence))


# ==============================
#  1. Generate Embedding
# ==============================
@app.post("/generate-embedding")
async def generate_embedding(foto: UploadFile = File(...)):
    file_bytes = await foto.read()
    encoding = ekstrak_encoding(file_bytes)

    if encoding is None:
        return JSONResponse(
            status_code=422,
            content={"message": "Wajah tidak terdeteksi pada foto. Pastikan pencahayaan cukup dan wajah menghadap kamera."},
        )

    return {"embedding": encoding.tolist()}


# ==============================
#  2. Verify (1:1) - untuk MOBILE
# ==============================
@app.post("/verify")
async def verify(
    foto: UploadFile = File(...),
    embedding: str = Form(...),
    threshold: float = Form(70.0),
):
    file_bytes = await foto.read()
    encoding_baru = ekstrak_encoding(file_bytes)

    if encoding_baru is None:
        return JSONResponse(
            status_code=422,
            content={"message": "Wajah tidak terdeteksi pada foto. Coba lagi dengan posisi wajah yang lebih jelas."},
        )

    try:
        encoding_tersimpan = np.array(json.loads(embedding))
    except (json.JSONDecodeError, TypeError):
        return JSONResponse(status_code=400, content={"message": "Format embedding tersimpan tidak valid."})

    distance = face_recognition.face_distance([encoding_tersimpan], encoding_baru)[0]
    confidence = jarak_ke_confidence(distance)
    match = confidence >= threshold

    return {"match": bool(match), "confidence": round(float(confidence), 2)}


# ==============================
#  3. Identify (1:N) - untuk KIOSK
# ==============================
@app.post("/identify")
async def identify(
    foto: UploadFile = File(...),
    kandidat: str = Form(...),
    threshold: float = Form(70.0),
):
    file_bytes = await foto.read()
    encoding_baru = ekstrak_encoding(file_bytes)

    if encoding_baru is None:
        return JSONResponse(
            status_code=422,
            content={"message": "Wajah tidak terdeteksi pada foto. Coba lagi dengan posisi wajah yang lebih jelas."},
        )

    try:
        daftar_kandidat = json.loads(kandidat)
    except (json.JSONDecodeError, TypeError):
        return JSONResponse(status_code=400, content={"message": "Format data kandidat tidak valid."})

    if not daftar_kandidat:
        return JSONResponse(status_code=422, content={"message": "Belum ada data wajah pegawai yang terdaftar."})

    id_terbaik = None
    confidence_terbaik = 0.0

    for c in daftar_kandidat:
        try:
            encoding_kandidat = np.array(c["embedding"])
        except (KeyError, TypeError):
            continue

        distance = face_recognition.face_distance([encoding_kandidat], encoding_baru)[0]
        confidence = jarak_ke_confidence(distance)

        if confidence > confidence_terbaik:
            confidence_terbaik = confidence
            id_terbaik = c.get("pegawai_profil_id")

    if confidence_terbaik < threshold:
        return {
            "pegawai_profil_id": None,
            "confidence": round(float(confidence_terbaik), 2),
            "message": "Wajah tidak dikenali atau di bawah ambang batas kecocokan.",
        }

    return {
        "pegawai_profil_id": id_terbaik,
        "confidence": round(float(confidence_terbaik), 2),
    }


@app.get("/health")
async def health():
    return {"status": "ok"}