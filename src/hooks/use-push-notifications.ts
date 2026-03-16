import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// This is a PUBLIC key, safe to expose in frontend
const VAPID_PUBLIC_KEY = "BOMiwUCg5785RAFwt4LEhE-QcKv_xg26rW8SaIm9Y07RJxNv-VgrblD3sOTcpn4Ay5jL-LeSMIZdjXXZ1raLq70";

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
      console.error("Push: Invalid subscription object");
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
      // Try insert instead of upsert as fallback
      const { error: insertError } = await supabase.from("push_subscriptions" as any).insert({
        user_id: session.user.id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      });
      if (insertError) {
        // If duplicate key error, it's already saved - that's fine
        if (insertError.code === "23505") return true;
        console.error("Failed to insert push subscription:", insertError);
        return false;
      }
    }

    return true;
  }, []);

  const checkExistingSubscription = useCallback(async () => {
    try {
      if (!("serviceWorker" in navigator)) return;
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      // Check if the subscription was created with the current VAPID key
      // by trying to persist it - if the key changed, unsubscribe old and re-subscribe
      const persisted = await persistSubscription(subscription);
      if (persisted) {
        setIsSubscribed(true);
      } else {
        // Try to re-subscribe with current key
        console.log("Push: Re-subscribing with current VAPID key");
        await subscription.unsubscribe();
        const newSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
        const rePersisted = await persistSubscription(newSub);
        setIsSubscribed(rePersisted);
      }
    } catch (err) {
      console.error("Push check error:", err);
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
      
      // Always try to get fresh subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
      }

      const persisted = await persistSubscription(subscription);
      if (!persisted) {
        // Don't unsubscribe from browser - just report failure
        console.error("Push: Failed to persist subscription to server");
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
