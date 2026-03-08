import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// This is a PUBLIC key, safe to expose in frontend
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

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const persistSubscription = useCallback(async (subscription: PushSubscription) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return false;
    }

    const { error: upsertError } = await supabase.from("push_subscriptions" as any).upsert(
      {
        user_id: session.user.id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      },
      { onConflict: "user_id,endpoint" }
    );

    if (upsertError) {
      console.error("Failed to save push subscription:", upsertError);
      return false;
    }

    return true;
  }, []);

  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      // Subscription exists in browser - mark as subscribed
      // Try to persist but don't unsubscribe on failure
      setIsSubscribed(true);
      await persistSubscription(subscription);
    } catch {
      setIsSubscribed(false);
    }
  }, [persistSubscription]);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, [checkExistingSubscription]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return false;

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

      const persisted = await persistSubscription(subscription);
      if (!persisted) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscription error:", err);
      return false;
    }
  }, [isSupported, persistSubscription]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await (supabase.from("push_subscriptions" as any) as any)
            .delete()
            .eq("user_id", session.user.id)
            .eq("endpoint", endpoint);
        }
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    }
  }, []);

  return { isSupported, isSubscribed, permission, subscribe, unsubscribe };
}

