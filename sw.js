// Service worker TOOLS CMD (versi GitHub Pages)
// - Halaman dashboard: tampil langsung dari simpanan HP (cepat), lalu diperbarui diam-diam
//   di belakang. Versi terbaru dari GitHub terpakai saat aplikasi dibuka berikutnya.
// - Library (Excel, PDF, grafik) dari CDN: disimpan sekali, tidak diunduh ulang.
// - Data (Apps Script) TIDAK disimpan: selalu diambil langsung dari server.
const CACHE = "toolscmd-v4";
const CDN = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./manifest.webmanifest"])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // library CDN: pakai simpanan kalau ada
  if (CDN.includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }))
    );
    return;
  }

  // file di GitHub Pages sendiri: tampil dari simpanan, perbarui di belakang
  if (url.origin === location.origin) {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req, { ignoreSearch: true }).then((hit) => {
          const baru = fetch(req).then((res) => {
            if (res.ok) c.put(req, res.clone());
            return res;
          }).catch(() => hit);
          return hit || baru;
        })
      )
    );
  }
  // selain itu (Apps Script, Google Sheets, gambar Drive): biarkan langsung ke jaringan
});
