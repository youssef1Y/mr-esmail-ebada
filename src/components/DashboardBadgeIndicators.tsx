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
      // Unread messages (admin replies not read)
      const { count: msgCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_admin_reply", true)
        .eq("is_read", false);

      // Pending homework (homework for grade that student hasn't submitted)
      const { data: allHw } = await supabase.from("homework").select("id").eq("grade", grade);
      const { data: submittedHw } = await supabase.from("homework_submissions").select("homework_id").eq("user_id", userId);
      const submittedIds = new Set((submittedHw || []).map(h => h.homework_id));
      const pendingHw = (allHw || []).filter(h => !submittedIds.has(h.id)).length;

      // New exams (exams for grade that student hasn't attempted)
      const { data: allExams } = await supabase.from("exams").select("id, access_type").eq("grade", grade);
      const { data: attemptedExams } = await supabase.from("exam_attempts").select("exam_id").eq("user_id", userId);
      const attemptedIds = new Set((attemptedExams || []).map(a => a.exam_id));
      const availableExams = (allExams || []).filter(e => {
        if (e.access_type === "subscribers_only" && !isSubscribed) return false;
        return !attemptedIds.has(e.id);
      }).length;

      // New videos per subject (unwatched)
      const { data: allVideos } = await supabase.from("videos").select("id, subject").eq("grade", grade);
      const { data: viewedVideos } = await supabase.from("video_views").select("video_id").eq("user_id", userId);
      const viewedIds = new Set((viewedVideos || []).map(v => v.video_id));
      const perSubject: Record<string, number> = {};
      (allVideos || []).forEach(v => {
        if (!viewedIds.has(v.id)) {
          perSubject[v.subject] = (perSubject[v.subject] || 0) + 1;
        }
      });

      // Unread personal notifications
      const { count: notifCount } = await supabase
        .from("student_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      setCounts({
        unreadMessages: msgCount || 0,
        pendingHomework: pendingHw,
        newExams: availableExams,
        unreadNotifications: notifCount || 0,
        newVideosPerSubject: perSubject,
      });
    };

    fetchCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
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
