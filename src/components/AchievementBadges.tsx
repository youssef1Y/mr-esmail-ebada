import { useEffect, useState } from "react";
import { Trophy, Video, ClipboardList, FileText, Star, Flame, Target, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: any;
  earned: boolean;
  progress: number;
  target: number;
  color: string;
}

export const AchievementBadges = ({ userId }: { userId: string }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchAchievements = async () => {
      setLoading(true);
      const [viewsRes, hwRes, attemptsRes, pointsRes] = await Promise.all([
        supabase.from("video_views").select("id").eq("user_id", userId),
        supabase.from("homework_submissions").select("id, score").eq("user_id", userId),
        supabase.from("exam_attempts").select("id, score, total").eq("user_id", userId),
        supabase.from("student_points").select("points").eq("user_id", userId),
      ]);

      const viewsCount = viewsRes.data?.length || 0;
      const hwCount = hwRes.data?.length || 0;
      const perfectHw = hwRes.data?.filter(h => h.score === 10).length || 0;
      const examsCount = attemptsRes.data?.length || 0;
      const perfectExams = attemptsRes.data?.filter(e => e.score === e.total && (e.total || 0) > 0).length || 0;
      const totalPoints = pointsRes.data?.reduce((s, p) => s + p.points, 0) || 0;

      const allBadges: Badge[] = [
        { id: "first_video", title: "أول خطوة 🎬", description: "شاهد أول فيديو", icon: Video, earned: viewsCount >= 1, progress: Math.min(viewsCount, 1), target: 1, color: "text-blue-500" },
        { id: "10_videos", title: "متابع نشط 📺", description: "شاهد 10 فيديوهات", icon: Video, earned: viewsCount >= 10, progress: Math.min(viewsCount, 10), target: 10, color: "text-blue-600" },
        { id: "25_videos", title: "نجم المشاهدة ⭐", description: "شاهد 25 فيديو", icon: Star, earned: viewsCount >= 25, progress: Math.min(viewsCount, 25), target: 25, color: "text-yellow-500" },
        { id: "first_hw", title: "أول واجب ✏️", description: "سلم أول واجب", icon: ClipboardList, earned: hwCount >= 1, progress: Math.min(hwCount, 1), target: 1, color: "text-green-500" },
        { id: "5_hw", title: "مجتهد 📝", description: "سلم 5 واجبات", icon: ClipboardList, earned: hwCount >= 5, progress: Math.min(hwCount, 5), target: 5, color: "text-green-600" },
        { id: "perfect_hw", title: "الدرجة الكاملة 💯", description: "احصل على 10/10 في واجب", icon: Award, earned: perfectHw >= 1, progress: Math.min(perfectHw, 1), target: 1, color: "text-amber-500" },
        { id: "first_exam", title: "محارب الامتحانات ⚔️", description: "أدخل أول امتحان", icon: FileText, earned: examsCount >= 1, progress: Math.min(examsCount, 1), target: 1, color: "text-purple-500" },
        { id: "perfect_exam", title: "عبقري 🧠", description: "درجة كاملة في امتحان", icon: Trophy, earned: perfectExams >= 1, progress: Math.min(perfectExams, 1), target: 1, color: "text-amber-600" },
        { id: "50_points", title: "جامع النقاط 🔥", description: "اجمع 50 نقطة", icon: Flame, earned: totalPoints >= 50, progress: Math.min(totalPoints, 50), target: 50, color: "text-orange-500" },
        { id: "100_points", title: "المتفوق 🏆", description: "اجمع 100 نقطة", icon: Target, earned: totalPoints >= 100, progress: Math.min(totalPoints, 100), target: 100, color: "text-red-500" },
      ];

      setBadges(allBadges);
      setLoading(false);
    };
    fetchAchievements();
  }, [userId]);

  if (loading) return null;

  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold font-amiri text-center mb-1">🏅 شاراتي</h2>
      <p className="text-center text-sm text-muted-foreground mb-4">حصلت على {earnedCount} من {badges.length} شارة</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
        {badges.map(badge => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className={`bg-card rounded-xl border p-3 text-center transition-all ${
                badge.earned ? "border-primary/40 shadow-sm" : "border-border opacity-50 grayscale"
              }`}
            >
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                badge.earned ? "bg-primary/10" : "bg-muted"
              }`}>
                <Icon className={`w-5 h-5 ${badge.earned ? badge.color : "text-muted-foreground"}`} />
              </div>
              <h4 className="font-bold text-xs leading-tight mb-0.5">{badge.title}</h4>
              <p className="text-[10px] text-muted-foreground">{badge.description}</p>
              {!badge.earned && (
                <div className="mt-1.5">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary/40 h-1.5 rounded-full" style={{ width: `${(badge.progress / badge.target) * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{badge.progress}/{badge.target}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
