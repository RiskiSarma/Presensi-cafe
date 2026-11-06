# dlib (dependency dari face_recognition) butuh cmake + compiler C++.
# Install manual di Windows itu ribet & sering gagal, jadi service ini
# didesain jalan lewat Docker supaya konsisten di semua OS.

FROM python:3.10-slim

WORKDIR /app

# Dependency sistem yang dibutuhkan dlib untuk compile
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Proses install dlib lumayan lama (bisa 10-15 menit tergantung koneksi & CPU)
# karena dia compile dari source, sabar ya pas build pertama kali.
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]