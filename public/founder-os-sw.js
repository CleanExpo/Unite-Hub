const RETIRED_CACHE_PREFIXES = ['phill-os', 'founder-os']

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()

      await Promise.all(
        cacheNames
          .filter((cacheName) =>
            RETIRED_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix)),
          )
          .map((cacheName) => caches.delete(cacheName)),
      )

      const clientsList = await clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      })

      await Promise.all(clientsList.map((client) => client.navigate(client.url)))
      await self.registration.unregister()
    })(),
  )
})
