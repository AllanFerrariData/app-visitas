// Service worker: deixa o app abrir sem internet.
// Ao publicar uma versão nova, troque o número abaixo.
const CACHE = 'visitas-v1';
const ARQUIVOS = ['./', './index.html', './teste-nfc.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Mostra a cópia guardada na hora e atualiza em segundo plano.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const permitido = url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (!permitido) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const chave = req.mode === 'navigate' ? new Request(url.origin + url.pathname) : req;
    const guardado = await cache.match(chave, { ignoreSearch: req.mode === 'navigate' });
    const rede = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(chave, res.clone());
      return res;
    }).catch(() => guardado);
    if (guardado) { e.waitUntil(rede.catch(() => {})); return guardado; }
    return rede.then(r => r || new Response('Sem internet', { status: 503 }));
  }));
});
