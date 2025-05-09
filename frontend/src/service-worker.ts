import { build, files, version } from '$service-worker';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies';
import { precacheAndRoute } from 'workbox-precaching';
import { ExpirationPlugin } from 'workbox-expiration';
import { warmStrategyCache } from 'workbox-recipes';

// Create a unique cache name for this deployment
const CACHE_NAME = `cache-${version}`;

// Cache static assets (CSS, JS, images)
const staticAssets = [
  ...build, // Vite build output (JS chunks)
  ...files  // Static assets from /static
].map(file => ({
  url: file,
  revision: version
}));

// Precache and register routes for static assets
precacheAndRoute(staticAssets);

// Cache pages with a network-first strategy
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Cache API responses with stale-while-revalidate strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Cache images with a cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      })
    ]
  })
);

// Warm up important routes
const urls = [
  '/api/health',
  '/api/expenses/summary',
  '/api/budget/current'
];

warmStrategyCache({
  urls,
  strategy: new NetworkFirst()
});

// Fallback for any uncaught requests
setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    return caches.match('/offline');
  }
  
  return Response.error();
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});