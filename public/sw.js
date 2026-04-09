// Service Worker - Network First Strategy
// Esto asegura que SIEMPRE se use la versión más reciente de la app

const CACHE_NAME = 'jp-vision-v3';

// Solo cacheamos assets estáticos (imágenes, fuentes, iconos)
const STATIC_CACHE = 'jp-vision-static-v3';

self.addEventListener('install', (event) => {
  // Instalar inmediatamente sin esperar
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Limpiar TODOS los caches viejos al activar
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Para páginas HTML y API: SIEMPRE network-first (nunca cache)
  if (
    event.request.mode === 'navigate' ||
    url.pathname.startsWith('/api/') ||
    url.pathname === '/' ||
    event.request.headers.get('accept')?.includes('text/html')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Si network funciona, devolver la respuesta fresca
          return response;
        })
        .catch(async () => {
          // Solo si no hay internet, intentar caché
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // Para assets estáticos (imágenes, fonts, etc): cache-first con expiración
  if (
    url.pathname.includes('/_next/static/') ||
    url.pathname.includes('/logo') ||
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

  // Para todo lo demás: network-first
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      return cached || new Response('Sin conexión', { status: 503 });
    })
  );
});
