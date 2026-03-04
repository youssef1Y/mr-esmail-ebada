import { useEffect, useState } from "react";
import { Trophy, Video, ClipboardList, FileText, Star, Flame, Target, Award, Crown, Zap, BookOpen, Medal, Gem, Rocket, Shield, Sparkles } from "lucide-react";
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

// Generate infinite tiers of badges based on actual progress
function generateBadges(views: number, hw: number, perfectHw: number, exams: number, perfectExams: number, points: number, comments: number): Badge[] {
  const all: Badge[] = [];
  let tier = 0;

  // Each tier generates 10 badges with increasing thresholds
  while (true) {
    const mult = tier + 1;
    const tierBadges: Badge[] = [
      { id: `videos_${mult}`, title: tier === 0 ? "أول خطوة 🎬" : `مشاهد محترف ×${mult} 🎬`, description: `شاهد ${mult * 10} فيديو`, icon: Video, earned: views >= mult * 10, progress: Math.min(views, mult * 10), target: mult * 10, color: "text-blue-500" },
      { id: `hw_${mult}`, title: tier === 0 ? "مجتهد ✏️" : `بطل الواجبات ×${mult} ✏️`, description: `سلّم ${mult * 5} واجب`, icon: ClipboardList, earned: hw >= mult * 5, progress: Math.min(hw, mult * 5), target: mult * 5, color: "text-green-500" },
      { id: `exams_${mult}`, title: tier === 0 ? "محارب الامتحانات ⚔️" : `خبير امتحانات ×${mult} ⚔️`, description: `ادخل ${mult * 5} امتحان`, icon: FileText, earned: exams >= mult * 5, progress: Math.min(exams, mult * 5), target: mult * 5, color: "text-purple-500" },
      { id: `perfect_hw_${mult}`, title: tier === 0 ? "الدرجة الكاملة 💯" : `درجات كاملة ×${mult} 💯`, description: `${mult} واجب 10/10`, icon: Award, earned: perfectHw >= mult, progress: Math.min(perfectHw, mult), target: mult, color: "text-amber-500" },
      { id: `perfect_exam_${mult}`, title: tier === 0 ? "عبقري 🧠" : `عبقري ×${mult} 🧠`, description: `${mult} امتحان درجة كاملة`, icon: Trophy, earned: perfectExams >= mult, progress: Math.min(perfectExams, mult), target: mult, color: "text-amber-600" },
      { id: `points_${mult}`, title: tier === 0 ? "جامع النقاط 🔥" : `نقاط ×${mult} 🔥`, description: `اجمع ${mult * 50} نقطة`, icon: Flame, earned: points >= mult * 50, progress: Math.min(points, mult * 50), target: mult * 50, color: "text-orange-500" },
      { id: `comments_${mult}`, title: tier === 0 ? "صوتك مسموع 💬" : `محاور ×${mult} 💬`, description: `اكتب ${mult * 5} تعليق`, icon: BookOpen, earned: comments >= mult * 5, progress: Math.min(comments, mult * 5), target: mult * 5, color: "text-cyan-500" },
      { id: `videos_big_${mult}`, title: tier === 0 ? "نجم المشاهدة ⭐" : `نجم ×${mult} ⭐`, description: `شاهد ${mult * 25} فيديو`, icon: Star, earned: views >= mult * 25, progress: Math.min(views, mult * 25), target: mult * 25, color: "text-yellow-500" },
      { id: `points_big_${mult}`, title: tier === 0 ? "المتفوق 🏆" : `متفوق ×${mult} 🏆`, description: `اجمع ${mult * 100} نقطة`, icon: Target, earned: points >= mult * 100, progress: Math.min(points, mult * 100), target: mult * 100, color: "text-red-500" },
      { id: `streak_${mult}`, title: tier === 0 ? "بطل المنصة 👑" : `أسطورة ×${mult} 👑`, description: `${mult * 10} فيديو + ${mult * 5} واجب`, icon: Crown, earned: views >= mult * 10 && hw >= mult * 5, progress: Math.min(views >= mult * 10 && hw >= mult * 5 ? 1 : 0, 1), target: 1, color: "text-yellow-600" },
    ];

    all.push(...tierBadges);

    // If this tier is NOT fully earned, stop generating more
    const allEarned = tierBadges.every(b => b.earned);
    if (!allEarned) break;
    tier++;
  }

  return all;
}

export const AchievementBadges = ({ userId }: { userId: string }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const fetchAchievements = async () => {
      setLoading(true);
      const [viewsRes, hwRes, attemptsRes, pointsRes, commentsRes] = await Promise.all([
        supabase.from("video_views").select("id").eq("user_id", userId),
        supabase.from("homework_submissions").select("id, score").eq("user_id", userId),
        supabase.from("exam_attempts").select("id, score, total").eq("user_id", userId),
        supabase.from("student_points").select("points").eq("user_id", userId),
        supabase.from("video_comments").select("id").eq("user_id", userId),
      ]);

      const views = viewsRes.data?.length || 0;
      const hw = hwRes.data?.length || 0;
      const perfectHw = hwRes.data?.filter(h => h.score === 10).length || 0;
      const exams = attemptsRes.data?.length || 0;
      const perfectExams = attemptsRes.data?.filter(e => e.score === e.total && (e.total || 0) > 0).length || 0;
      const points = pointsRes.data?.reduce((s, p) => s + p.points, 0) || 0;
      const comments = commentsRes.data?.length || 0;

      const allBadges = generateBadges(views, hw, perfectHw, exams, perfectExams, points, comments);
      const completedTiers = Math.floor(allBadges.filter(b => b.earned).length / 10);
      
      setBadges(allBadges);
      setCurrentTier(completedTiers);
      setLoading(false);
    };
    fetchAchievements();
  }, [userId]);

  if (loading) return null;

  // Show only the last 10 (current active tier)
  const visibleBadges = badges.slice(badges.length - 10);
  const earnedInTier = visibleBadges.filter(b => b.earned).length;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold font-amiri text-center mb-1">🏅 شاراتي</h2>
      <p className="text-center text-sm text-muted-foreground mb-4">
        المستوى {currentTier + 1} — {earnedInTier}/10 شارة
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl mx-auto">
        {visibleBadges.map(badge => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className={`bg-card rounded-xl border p-3 text-center transition-all ${
                badge.earned ? "border-primary/40 shadow-sm scale-[1.02]" : "border-border opacity-50 grayscale"
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
                    <div className="bg-primary/40 h-1.5 rounded-full transition-all" style={{ width: `${(badge.progress / badge.target) * 100}%` }} />
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
