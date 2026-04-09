// Service Worker - Network First con auto-actualización
// Cada deploy cambia el nombre del cache y fuerza actualización

const CACHE_VERSION = Date.now();
const CACHE_NAME = `jp-vision-${CACHE_VERSION}`;
const STATIC_CACHE = `jp-static-${CACHE_VERSION}`;

// Instalar y activar inmediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Limpiar TODOS los caches viejos
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => caches.delete(name))
      )
    ).then(() => {
      // Tomar control de todas las pestañas abiertas
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Páginas HTML y API: SIEMPRE ir a la red primero
  if (
    event.request.mode === 'navigate' ||
    url.pathname.startsWith('/api/') ||
    url.pathname === '/' ||
    event.request.headers.get('accept')?.includes('text/html')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Notificar a todas las pestañas que hay nueva versión
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({ type: 'NEW_VERSION', version: CACHE_VERSION });
            });
          });
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response('Sin conexión', { status: 503 });
        })
    );
    return;
  }

  // Assets estáticos: cache-first
  if (
    url.pathname.includes('/_next/static/') ||
    url.pathname.includes('/logo') ||
    url.pathname.includes('/icon-') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Todo lo demás: network-first
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      return cached || new Response('Sin conexión', { status: 503 });
    })
  );
});
