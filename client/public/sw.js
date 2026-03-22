// FitForge AI — Service Worker v1.0
// Cache strategic: app shell + assets, nu HTML (navigare mereu fresh)

const CACHE_NAME = "fitforge-v1";
const STATIC_CACHE = "fitforge-static-v1";

// Resurse de pre-cached la instalare
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/icon-144.svg",
];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Pre-cache partial failure:", err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => {
            console.log("[SW] Șterg cache vechi:", k);
            return caches.delete(k);
          })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API calls — mereu din rețea, fără cache
  if (url.pathname.startsWith("/api/")) {
    return; // lasă browser-ul să gestioneze
  }

  // 2. Navigări (HTML) — mereu fresh din rețea
  // Dacă rețeaua pică, arătăm ce avem în cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/") || caches.match(request)
      )
    );
    return;
  }

  // 3. Fonturi Google — cache first (nu se schimbă)
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // 4. Assets statice (JS, CSS, imagini, icoane) — cache first, update în background
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/favicon.svg" ||
    url.pathname === "/favicon.png"
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok && response.status < 400) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached);

          return cached || fetchPromise;
        })
      )
    );
    return;
  }
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "FitForge AI", body: "Ai o notificare nouă! 💪", icon: "/icons/icon-192.svg" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icons/icon-192.svg",
      badge: "/icons/icon-72.svg",
      vibrate: [200, 100, 200],
      tag: "fitforge-notification",
      renotify: true,
      data: { url: data.url || "/today" },
    })
  );
});

// ── Notification Click ─────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/today";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

console.log("[SW] FitForge AI Service Worker v1 activ ✅");
