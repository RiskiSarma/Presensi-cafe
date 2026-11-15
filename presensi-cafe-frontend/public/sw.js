// Service worker minimal untuk Presensi Cafe.
// Sengaja TIDAK menyimpan data/API di cache: presensi harus selalu real-time dan akurat.
// Tugasnya hanya memenuhi syarat "bisa dipasang" dan menampilkan halaman offline saat tidak ada internet.
const CACHE = "presensi-offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add("/offline.html")));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html")));
  }
});
