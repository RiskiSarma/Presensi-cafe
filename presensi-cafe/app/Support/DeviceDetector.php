<?php

namespace App\Support;

class DeviceDetector
{
    /**
     * Deteksi jenis perangkat dari User-Agent header. Best-effort, BUKAN akurat 100%:
     *
     * - "desktop" mencakup laptop DAN komputer sekaligus - browser tidak pernah
     *   membedakan keduanya ke server, jadi ini bukan bug, memang batasan platform web.
     * - iPad sejak iPadOS 13 defaultnya kirim User-Agent yang identik dengan Mac,
     *   jadi kadang iPad kedetect "desktop". Kalau butuh akurat, device kiosk
     *   sebaiknya dicatat manual oleh admin, bukan diandalkan dari deteksi ini.
     */
    public static function detect(?string $userAgent): string
    {
        $ua = $userAgent ?? '';

        if (preg_match('/iPad|Android(?!.*Mobile)|Tablet|Kindle|Silk/i', $ua)) {
            return 'tablet';
        }

        if (preg_match('/Mobile|iPhone|iPod|Android|BlackBerry|IEMobile|Opera Mini|webOS/i', $ua)) {
            return 'mobile';
        }

        return 'desktop';
    }
}
