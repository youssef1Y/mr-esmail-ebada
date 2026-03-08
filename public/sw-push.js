// Custom service worker for push notifications
// This file will be copied to /public and imported by the PWA service worker

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: data.icon || "/pwa-192x192.png",
      badge: data.badge || "/pwa-192x192.png",
      dir: "rtl",
      lang: "ar",
      vibrate: [200, 100, 200],
      data: {
        url: data.url || "/dashboard",
      },
      actions: [
        { action: "open", title: "فتح المنصة" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "منصة أ. إسماعيل", options)
    );
  } catch (e) {
    console.error("Push event error:", e);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
