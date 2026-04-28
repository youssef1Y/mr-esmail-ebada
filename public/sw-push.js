// ============================================================
// Service Worker للإشعارات — نسخة محسّنة ومصلّحة
// ============================================================

// استقبال الـ Push من السيرفر
self.addEventListener("push", (event) => {
  console.log("[SW] 🔔 Push event received");

  if (!event.data) {
    console.warn("[SW] Push event has no data");
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    // fallback لو البيانات مش JSON
    payload = {
      title: "منصة أ. إسماعيل",
      body: event.data.text() || "لديك إشعار جديد",
    };
  }

  const title = payload.title || "منصة أ. إسماعيل";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    image: payload.image || undefined,
    dir: "rtl",
    lang: "ar",
    vibrate: [200, 100, 200, 100, 200],
    // tag فريد لكل إشعار عشان ما يتحذفش من نفسه
    tag: payload.tag || ("notif-" + Date.now()),
    renotify: true,
    // requireInteraction: true يخلي الإشعار يفضل ظاهر لحد ما المستخدم يضغط
    requireInteraction: payload.requireInteraction !== false,
    silent: false,
    data: {
      url: payload.url || "/dashboard",
      notificationId: payload.notificationId || null,
    },
    actions: [
      { action: "open", title: "📖 فتح المنصة" },
      { action: "dismiss", title: "✕ إغلاق" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log("[SW] ✅ Notification shown:", title))
      .catch((err) => console.error("[SW] ❌ showNotification failed:", err))
  );
});

// ضغط على الإشعار
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked, action:", event.action);
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/dashboard";
  const fullUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // لو الصفحة مفتوحة بالفعل، ركّز عليها
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            client.navigate(fullUrl);
            return client.focus();
          }
        }
        // لو مش مفتوحة، افتح نافذة جديدة
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      })
  );
});

// إغلاق الإشعار
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed by user");
});

// تثبيت الـ SW
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  // تخطي الانتظار وتفعيل فوراً
  event.waitUntil(self.skipWaiting());
});

// تفعيل الـ SW وتولّي السيطرة فوراً على كل الصفحات
self.addEventListener("activate", (event) => {
  console.log("[SW] Activated");
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // حذف الكاش القديم
      caches.keys().then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith("workbox-") && !n.includes("runtime"))
            .map((n) => {
              console.log("[SW] Deleting old cache:", n);
              return caches.delete(n);
            })
        )
      ),
    ])
  );
});

// استقبال رسائل من الصفحة (مفيد للـ debug)
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "TEST_NOTIFICATION") {
    self.registration.showNotification("🔔 اختبار ناجح!", {
      body: "الإشعارات شغالة بشكل صحيح ✅",
      icon: "/pwa-192x192.png",
      dir: "rtl",
      lang: "ar",
      vibrate: [200, 100, 200],
    });
  }
});
