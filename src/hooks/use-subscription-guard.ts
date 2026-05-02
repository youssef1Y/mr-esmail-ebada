import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * يتحقق من انتهاء الاشتراك تلقائياً عند كل تسجيل دخول
 * لو subscription_expires_at عدى التاريخ → يعطّل is_subscribed تلقائياً
 */
export function useSubscriptionGuard(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    async function checkExpiry() {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_subscribed, subscription_expires_at")
        .eq("user_id", userId!)
        .single();

      if (error || !profile) return;

      if (
        profile.is_subscribed &&
        profile.subscription_expires_at &&
        new Date(profile.subscription_expires_at) < new Date()
      ) {
        console.log("[SubscriptionGuard] Subscription expired — deactivating...");

        await supabase
          .from("profiles")
          .update({ is_subscribed: false })
          .eq("user_id", userId!);

        // student_notifications هو الجدول الصح للإشعارات الشخصية
        await supabase.from("student_notifications").insert({
          user_id: userId,
          title: "انتهى اشتراكك",
          body: "انتهت مدة اشتراكك. جدّد اشتراكك للاستمرار في المشاهدة.",
          type: "subscription_expired",
          is_read: false,
        });
      }
    }

    checkExpiry();
  }, [userId]);
}
