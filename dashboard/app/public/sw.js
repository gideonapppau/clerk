/* Clerk merchant dashboard — Web Push only. Do not cache HTML/app routes (Server Action IDs change each deploy). */

const CACHE = 'clerk-dash-v5'
const STATIC_ASSETS = ['/icon.svg', '/apple-icon']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(
          STATIC_ASSETS.map((url) => cache.add(url).catch(() => undefined))
        )
      )
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Only intercept push icon assets. All app HTML, RSC, and API traffic uses the browser default.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (!STATIC_ASSETS.includes(url.pathname)) return

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
})

self.addEventListener('push', (event) => {
  let data = { title: 'Clerk', body: 'You have an update.', url: '/dashboard', tag: 'clerk' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    /* use defaults */
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Clerk', {
      body: data.body || '',
      icon: '/apple-icon',
      badge: '/icon.svg',
      tag: data.tag || 'clerk',
      data: { url: data.url || '/dashboard' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data?.url || '/dashboard'
  const target = new URL(path, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client && client.url.startsWith(self.location.origin)) {
            return client.navigate(path).then((c) => (c || client).focus())
          }
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
    })
  )
})
