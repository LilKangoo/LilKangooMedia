/* LilKangooMedia service worker — online-first media-safe version.
 * The old Mobirise SW cached ALL image and API requests, filling browser quota.
 * This version removes its obsolete caches and lets the browser/network handle
 * content normally. It never caches client enquiries, authentication, API data,
 * public galleries or private administration responses.
 */
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(name =>
      name.startsWith('mobirise-cache-') || name.startsWith('lkm-media-')
    ).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
// Intentionally no fetch event: no unbounded caching of media or API requests.
