// UNITE Group Service Worker
// Version 1.0.0

const CACHE_NAME = 'unite-group-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/images/og-image.jpg',
];

// Service Worker Installation
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching Static Assets');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Service Worker Activation
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing Old Cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch Event Handler
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Network with Cache Fallback Strategy for page navigations
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(response => {
              if (response) {
                return response;
              }
              
              // If the request is for a page, return the offline page
              if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('/');
              }
            });
        })
    );
    return;
  }
  
  // Cache First, Network Fallback strategy for static assets
  if (
    event.request.method === 'GET' && 
    (
      event.request.url.endsWith('.js') || 
      event.request.url.endsWith('.css') || 
      event.request.url.includes('/images/') || 
      event.request.url.includes('/icons/') ||
      event.request.url.endsWith('.woff2')
    )
  ) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request).then(response => {
            // Clone the response
            const responseToCache = response.clone();
            
            // Add to cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
        })
    );
    return;
  }
  
  // Network First, Cache Fallback for everything else
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
          });
      })
  );
});

// Background Sync for Offline Support
self.addEventListener('sync', event => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForm());
  }
});

// Push Notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const url = notification.data.url;
  
  notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Check if there is already a window open with the target URL
        for (let client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Helper Functions
async function syncContactForm() {
  try {
    const db = await getOfflineDb();
    const pendingRequests = await db.getAll('contact-forms');
    
    for (const request of pendingRequests) {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request.data)
        });
        
        if (response.ok) {
          await db.delete('contact-forms', request.id);
        }
      } catch (err) {
        console.error('Failed to sync contact form:', err);
      }
    }
  } catch (err) {
    console.error('Error during contact form sync:', err);
  }
}

// IndexedDB setup for offline data
function getOfflineDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('unite-group-offline', 1);
    
    request.onerror = (event) => {
      reject('Error opening offline database');
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('contact-forms')) {
        db.createObjectStore('contact-forms', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      const dbWrapper = {
        add: (storeName, data) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add({ data, timestamp: Date.now() });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        },
        
        getAll: (storeName) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        },
        
        delete: (storeName, id) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      };
      
      resolve(dbWrapper);
    };
  });
}
