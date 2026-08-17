const CACHE_NAME = 'wood-shop-bill-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
];

// Install — فائلیں کیش میں محفوظ کریں
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate — پرانی کیش صاف کریں
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — پہلے کیش سے دیں، نہیں تو نیٹ ورک سے
self.addEventListener('fetch', (event) => {
  // صرف GET درخواستیں ہینڈل کریں
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // کیش میں مل گیا تو وہی دیں
        if (response) {
          return response;
        }
        // نہیں ملا تو نیٹ ورک سے لائیں
        return fetch(event.request)
          .then((networkResponse) => {
            // کامیاب جواب ہو تو کیش میں بھی محفوظ کر لیں (اختیاری)
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // آف لائن اور کیش میں بھی نہیں → خالی صفحہ یا فال بیک
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
