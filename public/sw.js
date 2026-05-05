// Carteggio Service Worker

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "Carteggio", body: event.data.text() };
  }

  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "carteggio",
    data: { url: data.url || "/feed" },
    requireInteraction: false,
    silent: false,
  };

  const tasks = [
    self.registration.showNotification(data.title || "Carteggio", options),
  ];

  // Aggiorna il badge sull'icona dell'app (Android e iOS PWA recenti)
  if (typeof data.appBadge === "number" && "setAppBadge" in self.navigator) {
    if (data.appBadge > 0) {
      tasks.push(self.navigator.setAppBadge(data.appBadge).catch(() => {}));
    } else {
      tasks.push(self.navigator.clearAppBadge?.().catch(() => {}));
    }
  }

  event.waitUntil(Promise.all(tasks));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.postMessage({ type: "navigate", url });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
