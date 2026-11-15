import type { MetadataRoute } from "next";

// Ikon ada di public/icons. Untuk memakai logo brand sendiri, timpa file PNG dengan nama yang sama.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Presensi Cafe",
    short_name: "Presensi",
    description: "Presensi pegawai cafe dengan pengenalan wajah dan verifikasi lokasi.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF9F6",
    theme_color: "#A9791F",
    lang: "id",
    icons: [
      { src: "/icons/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
