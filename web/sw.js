/* Bitlis Eğitim İzleme — çevrimdışı önbellek
   Strateji: kabuk için önbellek-öncelikli, veri için ağ-öncelikli (çevrimdışı yedekli). */

const ONBELLEK = 'bitlis-egitim-v1';

const KABUK = [
  './',
  'index.html',
  'css/styles.css',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'data/kayitlar.json',
  'data/gostergeler.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(ONBELLEK)
      .then((c) => c.addAll(KABUK))
      .then(() => self.skipWaiting())
      .catch(() => { /* tek bir dosya eksikse kurulumu düşürme */ })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a !== ONBELLEK).map((a) => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const istek = e.request;
  if (istek.method !== 'GET') return;

  const url = new URL(istek.url);
  if (url.origin !== location.origin) return;   // dış kaynakları elleme

  // Veri dosyaları: önce ağ, olmazsa önbellek
  if (url.pathname.includes('/data/')) {
    e.respondWith(
      fetch(istek)
        .then((yanit) => {
          const kopya = yanit.clone();
          caches.open(ONBELLEK).then((c) => c.put(istek, kopya));
          return yanit;
        })
        .catch(() => caches.match(istek))
    );
    return;
  }

  // Kabuk: önce önbellek
  e.respondWith(
    caches.match(istek).then((bulunan) => bulunan || fetch(istek).then((yanit) => {
      const kopya = yanit.clone();
      caches.open(ONBELLEK).then((c) => c.put(istek, kopya));
      return yanit;
    }))
  );
});
