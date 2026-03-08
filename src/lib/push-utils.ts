import { supabase } from "@/integrations/supabase/client";

type PushPayload = {
  title: string;
  body: string;
  target_grades?: string[];
  target_audience?: "all" | "subscribers" | "non_subscribers";
  target_user_ids?: string[];
};

async function invokePush(payload: PushPayload) {
  const { data, error } = await supabase.functions.invoke("send-push-notification", {
    body: payload,
  });

  if (error) {
    console.error("Push invoke error:", error);
    return false;
  }

  return true;
}

export async function sendPushToGrade(title: string, body: string, targetGrades?: string[]) {
  try {
    await invokePush({
      title,
      body,
      target_grades: targetGrades,
      target_audience: "all",
    });
  } catch (err) {
    console.error("Auto push notification error:", err);
  }
}

export async function sendPushToUsers(title: string, body: string, targetUserIds: string[]) {
  try {
    const uniqueUserIds = [...new Set(targetUserIds.filter(Boolean))];
    if (uniqueUserIds.length === 0) return;

    await invokePush({
      title,
      body,
      target_user_ids: uniqueUserIds,
    });
  } catch (err) {
    console.error("Targeted push notification error:", err);
  }
}
