const VERSION = 'lumicore-pwa-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'LUMICORE_SW_VERSION') {
    event.source?.postMessage({ version: VERSION });
  }
});
