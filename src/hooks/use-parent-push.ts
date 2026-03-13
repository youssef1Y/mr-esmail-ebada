import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = "BHusL3WHNweuAEJsiqvzu6-W25TzK7OoMwubLecyn6dswWaeXmNyldGQb3SFBSNn7fcRkgQVe0RTVj_TlmwGruw";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useParentPushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem("parent_session") || "{}");
    } catch { return {}; }
  };

  const checkExisting = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        setIsSubscribed(true);
        // Re-persist
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
    } catch {
      setIsSubscribed(false);
    }
  }, []);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      checkExisting();
    }
  }, [checkExisting]);

  const subscribe = useCallback(async () => {
    if (!isSupported) return false;
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
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
      return true;
    } catch (err) {
      console.error("Parent push subscribe error:", err);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        const session = getSession();
        if (session.phone && session.session_token) {
          await supabase.functions.invoke("send-parent-push", {
            body: {
              action: "unsubscribe",
              parent_phone: session.phone,
              endpoint,
              session_token: session.session_token,
            },
          });
        }
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Parent push unsubscribe error:", err);
    }
  }, []);

  return { isSupported, isSubscribed, permission, subscribe, unsubscribe };
}
