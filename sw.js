// NÃ¶betÃ§i360 â€” Ã§evrimdÄ±ÅŸÄ± Ã§alÄ±ÅŸma: Ã¶nce aÄŸ (gÃ¼ncel sÃ¼rÃ¼m), aÄŸ yoksa Ã¶nbellek.
const SURUM = 'nobetci360-v2.11.0';
const DOSYALAR = ['./', 'index.html', 'css/stil.css', 'js/app.js', 'js/motor.js', 'js/pdfoku.js', 'js/resim.js', 'js/ikonlar.js',
  'lib/pdf.min.mjs', 'lib/pdf.worker.min.mjs', 'manifest.webmanifest',
  'ikon/logo.svg', 'ikon/ikon-180.png', 'ikon/ikon-192.png', 'ikon/ikon-512.png',
  'font/ibm-plex-sans-latin-400-normal.woff2', 'font/ibm-plex-sans-latin-500-normal.woff2', 'font/ibm-plex-sans-latin-600-normal.woff2', 'font/ibm-plex-sans-latin-700-normal.woff2',
  'font/ibm-plex-sans-latin-ext-400-normal.woff2', 'font/ibm-plex-sans-latin-ext-500-normal.woff2', 'font/ibm-plex-sans-latin-ext-600-normal.woff2', 'font/ibm-plex-sans-latin-ext-700-normal.woff2'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(SURUM).then((c) => c.addAll(DOSYALAR))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== SURUM).map((x) => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok && new URL(e.request.url).origin === location.origin) { const k = r.clone(); caches.open(SURUM).then((c) => c.put(e.request, k)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
