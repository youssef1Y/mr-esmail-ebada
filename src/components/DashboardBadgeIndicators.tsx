import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BadgeCounts {
  unreadMessages: number;
  pendingHomework: number;
  newExams: number;
  unreadNotifications: number;
  newVideosPerSubject: Record<string, number>;
}

export const useBadgeCounts = (userId: string, grade: string, isSubscribed: boolean) => {
  const [counts, setCounts] = useState<BadgeCounts>({
    unreadMessages: 0,
    pendingHomework: 0,
    newExams: 0,
    unreadNotifications: 0,
    newVideosPerSubject: {},
  });

  useEffect(() => {
    if (!userId || !grade) return;

    const fetchCounts = async () => {
      // Get current term first
      const { data: termSetting } = await supabase.from("app_settings").select("value").eq("key", "current_term").single();
      const currentTerm = parseInt(termSetting?.value || "1") || 1;

      // Run ALL queries in parallel instead of sequentially
      const [msgResult, hwResult, subsResult, examsResult, attemptsResult, videosResult, viewsResult, notifResult] = await Promise.all([
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_admin_reply", true).eq("is_read", false),
        supabase.from("homework").select("id").eq("grade", grade).filter("term", "eq", currentTerm),
        supabase.from("homework_submissions").select("homework_id").eq("user_id", userId),
        supabase.from("exams").select("id, access_type").eq("grade", grade).filter("term", "eq", currentTerm),
        supabase.from("exam_attempts").select("exam_id").eq("user_id", userId),
        supabase.from("videos").select("id, subject").eq("grade", grade).filter("term", "eq", currentTerm),
        supabase.from("video_views").select("video_id").eq("user_id", userId),
        supabase.from("student_notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false),
      ]);

      const submittedIds = new Set((subsResult.data || []).map(h => h.homework_id));
      const pendingHw = (hwResult.data || []).filter(h => !submittedIds.has(h.id)).length;

      const attemptedIds = new Set((attemptsResult.data || []).map(a => a.exam_id));
      const availableExams = (examsResult.data || []).filter(e => {
        if (e.access_type === "subscribers_only" && !isSubscribed) return false;
        return !attemptedIds.has(e.id);
      }).length;

      const viewedIds = new Set((viewsResult.data || []).map(v => v.video_id));
      const perSubject: Record<string, number> = {};
      (videosResult.data || []).forEach(v => {
        if (!viewedIds.has(v.id)) {
          perSubject[v.subject] = (perSubject[v.subject] || 0) + 1;
        }
      });

      setCounts({
        unreadMessages: msgResult.count || 0,
        pendingHomework: pendingHw,
        newExams: availableExams,
        unreadNotifications: notifResult.count || 0,
        newVideosPerSubject: perSubject,
      });
    };

    fetchCounts();
    // Refresh every 60 seconds instead of 30
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [userId, grade, isSubscribed]);

  return counts;
};

export const RedBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
      {count > 99 ? "99+" : count}
    </span>
  );
};
