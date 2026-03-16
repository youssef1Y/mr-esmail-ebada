// Custom service worker for push notifications
// Imported by the PWA service worker via importScripts

self.addEventListener("push", (event) => {
  console.log("[SW Push] Received push event");
  
  if (!event.data) {
    console.log("[SW Push] No data in push event");
    return;
  }

  try {
    const data = event.data.json();
    console.log("[SW Push] Data:", data.title);
    
    const options = {
      body: data.body || "",
      icon: data.icon || "/pwa-192x192.png",
      badge: data.badge || "/pwa-192x192.png",
      dir: "rtl",
      lang: "ar",
      vibrate: [200, 100, 200],
      tag: "notification-" + Date.now(),
      renotify: true,
      requireInteraction: true,
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
    console.error("[SW Push] Error:", e);
    // Fallback: show generic notification
    event.waitUntil(
      self.registration.showNotification("منصة أ. إسماعيل", {
        body: "لديك إشعار جديد",
        icon: "/pwa-192x192.png",
        dir: "rtl",
        lang: "ar",
      })
    );
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
