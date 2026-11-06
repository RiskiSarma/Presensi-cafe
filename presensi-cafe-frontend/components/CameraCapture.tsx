"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Camera, RotateCcw } from "lucide-react";

export interface CameraCaptureHandle {
  capture: () => Promise<Blob | null>;
}

interface CameraCaptureProps {
  variant?: "light" | "dark";
  onReady?: () => void;
  circleGuide?: boolean;
}

/**
 * Komponen kamera reusable. Expose method `capture()` lewat ref supaya
 * parent (halaman kiosk / mobile presensi) bisa ambil foto kapan pun mau,
 * termasuk buat auto-capture berkala di mode kiosk.
 */
const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  ({ variant = "light", onReady, circleGuide = true }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
      let stream: MediaStream | null = null;

      async function startCamera() {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: 640, height: 480 },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setReady(true);
            onReady?.();
          }
        } catch {
          setError("Tidak bisa mengakses kamera. Izinkan akses kamera di browser dulu.");
        }
      }

      startCamera();

      return () => {
        stream?.getTracks().forEach((track) => track.stop());
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      capture: () => {
        return new Promise<Blob | null>((resolve) => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas) {
            resolve(null);
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
        });
      },
    }));

    const borderColor = variant === "dark" ? "border-kiosk-border" : "border-border";

    if (error) {
      return (
        <div
          className={`flex aspect-[4/3] w-full items-center justify-center rounded-card border ${borderColor} p-6 text-center text-sm ${
            variant === "dark" ? "bg-kiosk-surface text-kiosk-text/70" : "bg-surface text-muted"
          }`}
        >
          {error}
        </div>
      );
    }

    return (
      <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-card border ${borderColor}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover [transform:scaleX(-1)]"
        />
        <canvas ref={canvasRef} className="hidden" />

        {circleGuide && ready && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={`h-56 w-56 rounded-full border-2 border-dashed ${
                variant === "dark" ? "border-kiosk-text/40" : "border-espresso/40"
              }`}
            />
          </div>
        )}

        {!ready && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${
              variant === "dark" ? "bg-kiosk-surface text-kiosk-text/60" : "bg-surface text-muted"
            }`}
          >
            <Camera className="h-6 w-6 animate-pulse" />
            <span className="text-sm">Menyalakan kamera…</span>
          </div>
        )}
      </div>
    );
  }
);

CameraCapture.displayName = "CameraCapture";

export default CameraCapture;
