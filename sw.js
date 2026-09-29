// Service worker TOOLS CMD (versi GitHub Pages)
// - Halaman dashboard: SELALU dicek ke GitHub dulu (update langsung terlihat).
//   Kalau file tidak berubah, GitHub cukup menjawab "sama" jadi tetap cepat.
//   Kalau sedang offline / sinyal hilang, pakai salinan terakhir di HP.
// - Library (Excel, PDF, grafik) dari CDN: disimpan sekali, tidak diunduh ulang.
// - Data (Apps Script) TIDAK disimpan: selalu diambil langsung dari server.
const CACHE = "toolscmd-v5";
const CDN = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", () => self.skipWaiting());

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

  // file di GitHub Pages sendiri: jaringan dulu, simpanan hanya kalau offline
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req, { cache: "no-cache" })
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }))
    );
  }
  // selain itu (Apps Script, Google Sheets, gambar Drive): langsung ke jaringan
});
