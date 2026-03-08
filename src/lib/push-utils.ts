import { supabase } from "@/integrations/supabase/client";

export async function sendPushToGrade(title: string, body: string, targetGrades?: string[]) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    await fetch(`https://${projectId}.supabase.co/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title,
        body,
        target_grades: targetGrades,
        target_audience: "all",
      }),
    });
  } catch (err) {
    console.error("Auto push notification error:", err);
  }
}
