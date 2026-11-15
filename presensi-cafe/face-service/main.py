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

import io
import json
import os
from typing import List

import face_recognition
import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="Face Recognition Service - Presensi Cafe")

# Ambang EAR (Eye Aspect Ratio) untuk deteksi kedipan. Mata terbuka umumnya 0.28-0.35, tertutup < 0.2.
# Bisa disetel lewat environment kalau di lapangan terlalu ketat/longgar.
EAR_TERTUTUP = float(os.getenv("LIVENESS_EAR_TERTUTUP", "0.21"))
EAR_TERBUKA = float(os.getenv("LIVENESS_EAR_TERBUKA", "0.25"))
MIN_FRAME_WAJAH = int(os.getenv("LIVENESS_MIN_FRAME", "5"))
JARAK_WAJAH_SAMA = float(os.getenv("LIVENESS_JARAK_WAJAH", "0.55"))

# Identifikasi 1:N (kiosk): wajah terbaik harus unggul minimal sekian poin confidence dari pegawai kedua,
# supaya dua pegawai yang mirip tidak tertukar.
IDENTIFY_MIN_SELISIH = float(os.getenv("IDENTIFY_MIN_SELISIH", "3"))


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

    return {
        "match": bool(match),
        "confidence": round(float(confidence), 2),
        "message": None if match else f"Wajah tidak cocok (kecocokan {confidence:.0f}%, minimal {threshold:.0f}%). Hadap kamera lurus dengan cahaya cukup.",
    }


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

    # Nilai terbaik per pegawai (satu pegawai bisa punya lebih dari satu embedding)
    terbaik_per_pegawai = {}

    for c in daftar_kandidat:
        try:
            encoding_kandidat = np.array(c["embedding"])
        except (KeyError, TypeError):
            continue

        distance = face_recognition.face_distance([encoding_kandidat], encoding_baru)[0]
        confidence = jarak_ke_confidence(distance)
        pid = c.get("pegawai_profil_id")

        if confidence > terbaik_per_pegawai.get(pid, 0.0):
            terbaik_per_pegawai[pid] = confidence

    urut = sorted(terbaik_per_pegawai.items(), key=lambda x: x[1], reverse=True)
    id_terbaik, confidence_terbaik = urut[0] if urut else (None, 0.0)

    if confidence_terbaik < threshold:
        return {
            "pegawai_profil_id": None,
            "confidence": round(float(confidence_terbaik), 2),
            "message": (
                f"Wajah tidak dikenali (kecocokan terbaik {confidence_terbaik:.0f}%, minimal {threshold:.0f}%). "
                "Hadap kamera lurus dengan cahaya yang cukup, lalu coba lagi."
            ),
        }

    # Dua pegawai nyaris sama cocoknya: tolak daripada salah mengabsenkan orang
    if len(urut) > 1 and (confidence_terbaik - urut[1][1]) < IDENTIFY_MIN_SELISIH:
        return {
            "pegawai_profil_id": None,
            "confidence": round(float(confidence_terbaik), 2),
            "message": "Wajah terdeteksi mirip dengan lebih dari satu pegawai. Hadap kamera lebih lurus lalu coba lagi.",
        }

    return {
        "pegawai_profil_id": id_terbaik,
        "confidence": round(float(confidence_terbaik), 2),
    }


def hitung_ear(titik) -> float:
    """Eye Aspect Ratio dari 6 titik landmark satu mata (urutan dlib/face_recognition)."""
    p = np.array(titik, dtype=float)
    vertikal = np.linalg.norm(p[1] - p[5]) + np.linalg.norm(p[2] - p[4])
    horizontal = np.linalg.norm(p[0] - p[3])
    return float(vertikal / (2.0 * horizontal)) if horizontal > 0 else 0.0


@app.post("/liveness")
async def liveness(fotos: List[UploadFile] = File(...)):
    """
    Cek kedipan mata dari rangkaian frame (urut waktu). Foto diam / foto di layar HP tidak berkedip,
    jadi tidak akan lolos. Lolos kalau ada pola mata terbuka -> tertutup -> terbuka, dan wajah di
    awal & akhir rangkaian adalah orang yang sama. TIDAK menahan video yang diputar ulang.
    """
    ear_urut = []
    gambar_valid = []

    for f in fotos:
        data = await f.read()
        try:
            image = face_recognition.load_image_file(io.BytesIO(data))
            landmark = face_recognition.face_landmarks(image)
        except Exception:
            continue

        if len(landmark) != 1:
            continue  # tanpa wajah, atau lebih dari satu wajah -> frame diabaikan

        mata = landmark[0]
        ear = (hitung_ear(mata["left_eye"]) + hitung_ear(mata["right_eye"])) / 2.0
        ear_urut.append(ear)
        gambar_valid.append(image)

    if len(ear_urut) < MIN_FRAME_WAJAH:
        return {"success": True, "live": False, "frames_wajah": len(ear_urut),
                "message": "Wajah kurang terlihat jelas selama perekaman."}

    idx_min = int(np.argmin(ear_urut))
    ada_buka_sebelum = any(e >= EAR_TERBUKA for e in ear_urut[:idx_min])
    ada_buka_sesudah = any(e >= EAR_TERBUKA for e in ear_urut[idx_min + 1:])
    berkedip = ear_urut[idx_min] <= EAR_TERTUTUP and ada_buka_sebelum and ada_buka_sesudah

    # Wajah pertama dan terakhir harus orang yang sama (cegah ganti orang/foto di tengah perekaman)
    konsisten = True
    try:
        awal = face_recognition.face_encodings(gambar_valid[0])
        akhir = face_recognition.face_encodings(gambar_valid[-1])
        if awal and akhir:
            konsisten = float(face_recognition.face_distance([awal[0]], akhir[0])[0]) <= JARAK_WAJAH_SAMA
    except Exception:
        konsisten = True

    return {
        "success": True,
        "live": bool(berkedip and konsisten),
        "berkedip": bool(berkedip),
        "konsisten": bool(konsisten),
        "frames_wajah": len(ear_urut),
        "ear_min": round(min(ear_urut), 3),
        "ear_max": round(max(ear_urut), 3),
    }


@app.get("/health")
async def health():
    return {"status": "ok"}