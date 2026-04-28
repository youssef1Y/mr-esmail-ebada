import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// PUBLIC VAPID key — آمن في الـ frontend
const VAPID_PUBLIC_KEY =
  "BOMiwUCg5785RAFwt4LEhE-QcKv_xg26rW8SaIm9Y07RJxNv-VgrblD3sOTcpn4Ay5jL-LeSMIZdjXXZ1raLq70";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/** تسجيل الـ SW المستقل بدل الاعتماد على Workbox بس */
async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    // أول حاجة: شوف لو فيه SW مسجّل بالفعل
    let reg = await navigator.serviceWorker.getRegistration("/");

    // لو مفيش SW أو مش push-capable، سجّل sw-push مباشرة
    if (!reg) {
      console.log("[Push] Registering sw-push.js directly...");
      reg = await navigator.serviceWorker.register("/sw-push.js", {
        scope: "/",
      });
      console.log("[Push] sw-push.js registered:", reg.scope);
    }

    // انتظر لحد ما يبقى active
    if (reg.installing || reg.waiting) {
      await new Promise<void>((resolve) => {
        const sw = reg!.installing || reg!.waiting;
        if (!sw) { resolve(); return; }
        sw.addEventListener("statechange", function handler() {
          if (this.state === "activated") {
            sw.removeEventListener("statechange", handler);
            resolve();
          }
        });
        // timeout بعد 5 ثواني
        setTimeout(resolve, 5000);
      });
    }

    // انتظر ready
    const ready = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SW ready timeout")), 8000)
      ),
    ]).catch(() => null);

    return (ready as ServiceWorkerRegistration) || reg;
  } catch (err) {
    console.error("[Push] SW registration error:", err);
    return null;
  }
}

/** حفظ الـ subscription في Supabase */
async function persistSubscription(
  subscription: PushSubscription
): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return false;

  const subJson = subscription.toJSON();
  if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
    console.error("[Push] Invalid subscription object");
    return false;
  }

  // upsert: سجّل أو حدّث لو موجود
  const { error } = await (supabase.from("push_subscriptions") as any).upsert(
    {
      user_id: session.user.id,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    // لو duplicate key — ده كويس، يعني موجود بالفعل
    if (error.code === "23505") return true;
    // fallback: insert
    const { error: insertErr } = await (
      supabase.from("push_subscriptions") as any
    ).insert({
      user_id: session.user.id,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
    });
    if (insertErr && insertErr.code !== "23505") {
      console.error("[Push] persist failed:", insertErr);
      return false;
    }
  }

  console.log("[Push] ✅ Subscription persisted to DB");
  return true;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);

  // فحص الـ subscription الحالية
  const checkExistingSubscription = useCallback(async () => {
    try {
      const reg = await ensureServiceWorker();
      if (!reg) return;

      const subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      // تحقق إن الـ VAPID key هي نفسها
      const persisted = await persistSubscription(subscription);
      if (persisted) {
        setIsSubscribed(true);
      } else {
        // مفتاح قديم — ألغِ واشترك من جديد
        console.log("[Push] Re-subscribing with current VAPID key...");
        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error("[Push] checkExisting error:", err);
      setIsSubscribed(false);
    }
  }, []);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, [checkExistingSubscription]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn("[Push] Not supported on this browser/device");
      return false;
    }

    setIsLoading(true);
    try {
      // ١. اطلب الإذن
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        console.warn("[Push] Permission denied:", perm);
        return false;
      }

      // ٢. تأكد من وجود SW شغّال
      const reg = await ensureServiceWorker();
      if (!reg) {
        console.error("[Push] No service worker available");
        return false;
      }

      // ٣. احصل على subscription (أو أنشئها)
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        console.log("[Push] Creating new push subscription...");
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            VAPID_PUBLIC_KEY
          ) as BufferSource,
        });
        console.log("[Push] New subscription created:", subscription.endpoint.slice(0, 60) + "...");
      }

      // ٤. احفظ في السيرفر
      const persisted = await persistSubscription(subscription);
      if (!persisted) {
        console.error("[Push] Failed to persist to server");
        setIsSubscribed(false);
        return false;
      }

      setIsSubscribed(true);

      // ٥. إشعار محلي للتأكيد
      try {
        await reg.showNotification("🔔 تم تفعيل الإشعارات!", {
          body: "ستصلك إشعارات الواجبات والامتحانات الجديدة فوراً ✅",
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          dir: "rtl",
          lang: "ar",
          vibrate: [200, 100, 200],
          tag: "push-activated",
        } as NotificationOptions);
      } catch (_) {
        // الإشعار التأكيدي اختياري — مش مشكلة لو فشل
      }

      return true;
    } catch (err: any) {
      console.error("[Push] subscribe error:", err?.message || err);
      // لو المستخدم رفض الإذن
      if (err?.name === "NotAllowedError") {
        setPermission("denied");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await ensureServiceWorker();
      if (!reg) return;

      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          await (supabase.from("push_subscriptions") as any)
            .delete()
            .eq("user_id", session.user.id)
            .eq("endpoint", endpoint);
        }
        console.log("[Push] Unsubscribed successfully");
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("[Push] unsubscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** اختبار الإشعارات محلياً بدون سيرفر */
  const testLocalNotification = useCallback(async () => {
    const reg = await ensureServiceWorker();
    if (!reg) return;
    reg.active?.postMessage({ type: "TEST_NOTIFICATION" });
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    testLocalNotification,
  };
}
