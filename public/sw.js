// Chimbo Direct - Service Worker
// Caches app shell with cache-first for static assets, network-first for API calls
// Also handles web push notifications

const CACHE_NAME = 'chimbo-direct-v1';

// Precache these URLs on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/logo-mark.png',
  '/logo-header.png',
  '/robots.txt',
];

// Install event: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event: route requests to appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests: network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(navigationFallback(request));
    return;
  }

  // Static assets: cache-first strategy
  event.respondWith(cacheFirst(request));
});

// ─── Push Notification Handler ────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = {
    title: 'Chimbo Direct',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'chimbo-notification',
    url: '/',
    type: 'info',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  // Customize notification appearance based on type
  const typeConfig = getTypeConfig(data.type);
  data.title = data.title || typeConfig.title;
  data.icon = typeConfig.icon || data.icon;

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || `chimbo-${Date.now()}`,
    data: {
      url: data.url || data.actionUrl || '/',
      type: data.type,
      notificationId: data.notificationId,
      createdAt: Date.now(),
    },
    vibrate: typeConfig.vibrate,
    requireInteraction: typeConfig.requireInteraction,
    actions: typeConfig.actions,
    silent: typeConfig.silent,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── Notification Click Handler ───────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/';
  const action = event.action;

  // Handle action button clicks
  if (action === 'reply' && notificationData.conversationId) {
    // Open chat page for reply
    event.waitUntil(
      clients.openWindow(`/chat/${notificationData.conversationId}`)
    );
    return;
  }

  if (action === 'accept' && notificationData.bookingId) {
    // Open booking for acceptance
    event.waitUntil(
      clients.openWindow(`/guide/sessions?id=${notificationData.bookingId}`)
    );
    return;
  }

  if (action === 'dismiss') {
    return;
  }

  // Default: open the target URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's already a window open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      return clients.openWindow(targetUrl);
    })
  );
});

// ─── Notification Close Handler ───────────────────────────────────

self.addEventListener('notificationclose', (event) => {
  const notificationData = event.notification.data || {};
  // Track notification dismissal for analytics
  if (notificationData.notificationId) {
    fetch('/api/notifications/track?XTransformPort=3000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: notificationData.notificationId,
        action: 'dismissed',
        timestamp: Date.now(),
      }),
    }).catch(() => { /* tracking failed, ok */ });
  }
});

// ─── Push Subscription Change Handler ─────────────────────────────

self.addEventListener('pushsubscriptionchange', (event) => {
  // Re-subscribe and send new subscription to server
  event.waitUntil(
    self.registration.pushManager.getSubscription().then((subscription) => {
      if (subscription) {
        return fetch('/api/notifications/subscribe?XTransformPort=3000', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            action: 'update',
          }),
        });
      }
    })
  );
});

// ─── Helper: Type-based notification config ──────────────────────

function getTypeConfig(type) {
  switch (type) {
    case 'new_message':
    case 'chat_message':
      return {
        title: 'New Message',
        icon: '/icon-192.png',
        vibrate: [100, 50, 100],
        requireInteraction: false,
        silent: false,
        actions: [
          { action: 'reply', title: 'Reply' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      };
    case 'booking_confirmed':
    case 'booking_new':
      return {
        title: 'Booking Update',
        icon: '/icon-192.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        silent: false,
        actions: [
          { action: 'accept', title: 'View' },
          { action: 'dismiss', title: 'Later' },
        ],
      };
    case 'escrow_release':
    case 'payment_received':
      return {
        title: 'Payment Update',
        icon: '/icon-192.png',
        vibrate: [100],
        requireInteraction: false,
        silent: false,
        actions: [
          { action: 'view', title: 'View Wallet' },
        ],
      };
    case 'guide_verified':
    case 'verification':
      return {
        title: 'Verification Update',
        icon: '/icon-192.png',
        vibrate: [100, 50, 100, 50, 100],
        requireInteraction: false,
        silent: false,
        actions: [],
      };
    case 'dispute':
      return {
        title: 'Dispute Alert',
        icon: '/icon-192.png',
        vibrate: [300, 100, 300],
        requireInteraction: true,
        silent: false,
        actions: [
          { action: 'view', title: 'View Details' },
        ],
      };
    default:
      return {
        title: 'Chimbo Direct',
        icon: '/icon-192.png',
        vibrate: [100],
        requireInteraction: false,
        silent: false,
        actions: [],
      };
  }
}

// ─── Caching Strategies ──────────────────────────────────────────

// Cache-first: try cache, fallback to network
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network-first: try network, fallback to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'You are offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Navigation fallback: try network, fallback to cached root page
async function navigationFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match('/');
    if (cached) {
      return cached;
    }
    return new Response(
      `<!DOCTYPE html>
<html lang="sw">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chimbo Direct - Offline</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f59e0b;
      color: #1c1917;
      text-align: center;
      padding: 1rem;
    }
    .container { max-width: 400px; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { font-size: 1rem; opacity: 0.85; }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📵</div>
    <h1>Huna mtandao / You are offline</h1>
    <p>Chimbo Direct inahitaji muunganisho wa mtandao. Tafadhali angalia mtandao wako na ujaribu tena.</p>
    <p style="font-size:0.85rem; margin-top:0.5rem;">Chimbo Direct requires an internet connection. Please check your network and try again.</p>
  </div>
</body>
</html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}
