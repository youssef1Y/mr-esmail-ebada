import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// VAPID key لأولياء الأمور
const VAPID_PUBLIC_KEY =
  "BHusL3WHNweuAEJsiqvzu6-W25TzK7OoMwubLecyn6dswWaeXmNyldGQb3SFBSNn7fcRkgQVe0RTVj_TlmwGruw";

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

async function ensureSW(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) {
      reg = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
    }
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), 8000)),
    ]).catch(() => reg!) as ServiceWorkerRegistration;
  } catch (err) {
    console.error("[ParentPush] SW error:", err);
    return null;
  }
}

function getSession() {
  try { return JSON.parse(localStorage.getItem("parent_session") || "{}"); }
  catch { return {}; }
}

export function useParentPushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);

  const checkExisting = useCallback(async () => {
    try {
      const reg = await ensureSW();
      if (!reg) return;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        setIsSubscribed(true);
        // Re-persist للتأكد
        const session = getSession();
        if (session.phone && session.session_token) {
          const subJson = subscription.toJSON();
          if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
            await supabase.functions.invoke("send-parent-push", {
              body: {
                action: "subscribe",
                parent_phone: session.phone,
                endpoint: subJson.endpoint,
                p256dh: subJson.keys.p256dh,
                auth: subJson.keys.auth,
                session_token: session.session_token,
              },
            });
          }
        }
      } else {
        setIsSubscribed(false);
      }
    } catch { setIsSubscribed(false); }
  }, []);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      checkExisting();
    }
  }, [checkExisting]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const reg = await ensureSW();
      if (!reg) return false;

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
      }

      const session = getSession();
      if (!session.phone || !session.session_token) return false;

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) return false;

      const { data, error } = await supabase.functions.invoke("send-parent-push", {
        body: {
          action: "subscribe",
          parent_phone: session.phone,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          session_token: session.session_token,
        },
      });

      if (error || data?.error) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        return false;
      }

      setIsSubscribed(true);

      // إشعار تأكيدي
      try {
        await reg.showNotification("🔔 تم تفعيل الإشعارات!", {
          body: "ستصلك إشعارات متابعة ابنك فوراً ✅",
          icon: "/pwa-192x192.png",
          dir: "rtl",
          lang: "ar",
          vibrate: [200, 100, 200],
        } as NotificationOptions);
      } catch (_) {}

      return true;
    } catch (err) {
      console.error("[ParentPush] subscribe error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await ensureSW();
      if (!reg) return;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        const session = getSession();
        if (session.phone && session.session_token) {
          await supabase.functions.invoke("send-parent-push", {
            body: { action: "unsubscribe", parent_phone: session.phone, endpoint, session_token: session.session_token },
          });
        }
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("[ParentPush] unsubscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isSupported, isSubscribed, permission, isLoading, subscribe, unsubscribe };
}
