// Service worker mínimo do PWA Gestão (sem next-pwa, que é incompatível com o
// Turbopack do Next 16). Estratégia network-first com fallback de cache, apenas
// para GETs same-origin — NÃO intercepta Supabase/auth/cross-origin.
const CACHE = 'pwa-gestao-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  if (new URL(request.url).origin !== self.location.origin) return

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request)
        const cache = await caches.open(CACHE)
        cache.put(request, fresh.clone())
        return fresh
      } catch {
        const cached = await caches.match(request)
        if (cached) return cached
        return Response.error()
      }
    })()
  )
})
