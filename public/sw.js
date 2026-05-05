// Carteggio Service Worker
// Gestisce notifiche push e click sulle notifiche.
// Niente offline cache per ora — l'app richiede sempre connessione.

self.addEventListener("install", (event) => {
  // Attiva il SW immediatamente al primo install
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Il SW prende il controllo di tutte le tab aperte
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

  event.waitUntil(
    self.registration.showNotification(data.title || "Carteggio", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Se c'è già una tab aperta, focusa quella e naviga
      for (const client of clientList) {
        if ("focus" in client) {
          client.postMessage({ type: "navigate", url });
          return client.focus();
        }
      }
      // Altrimenti aprine una nuova
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
