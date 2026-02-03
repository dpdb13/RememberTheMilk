const CACHE_NAME = 'shopping-list-v1';
const STATIC_ASSETS = [
  '/RememberTheMilk/',
  '/RememberTheMilk/index.html',
  '/RememberTheMilk/manifest.json',
  '/RememberTheMilk/icon-192.png',
  '/RememberTheMilk/icon-512.png'
];

// Instalar: cachear assets estaticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar: limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: diferentes estrategias segun el tipo de recurso
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones a Supabase (siempre online)
  if (url.hostname.includes('supabase')) {
    return;
  }

  // Para assets estaticos: Cache First
  if (request.destination === 'image' ||
      request.destination === 'font' ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            fetch(request).then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(request, response));
              }
            }).catch(() => {});
            return cached;
          }
          return fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, clone));
            }
            return response;
          });
        })
    );
    return;
  }

  // Para HTML: Network First con fallback a cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
