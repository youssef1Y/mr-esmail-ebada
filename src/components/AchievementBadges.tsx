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
  tier: number;
}

export const AchievementBadges = ({ userId }: { userId: string }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

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

      const viewsCount = viewsRes.data?.length || 0;
      const hwCount = hwRes.data?.length || 0;
      const perfectHw = hwRes.data?.filter(h => h.score === 10).length || 0;
      const examsCount = attemptsRes.data?.length || 0;
      const perfectExams = attemptsRes.data?.filter(e => e.score === e.total && (e.total || 0) > 0).length || 0;
      const totalPoints = pointsRes.data?.reduce((s, p) => s + p.points, 0) || 0;
      const commentsCount = commentsRes.data?.length || 0;

      const allBadges: Badge[] = [
        // === Tier 1: البداية (أول 10) ===
        { id: "first_video", title: "أول خطوة 🎬", description: "شاهد أول فيديو", icon: Video, earned: viewsCount >= 1, progress: Math.min(viewsCount, 1), target: 1, color: "text-blue-500", tier: 1 },
        { id: "first_hw", title: "أول واجب ✏️", description: "سلّم أول واجب", icon: ClipboardList, earned: hwCount >= 1, progress: Math.min(hwCount, 1), target: 1, color: "text-green-500", tier: 1 },
        { id: "first_exam", title: "محارب الامتحانات ⚔️", description: "ادخل أول امتحان", icon: FileText, earned: examsCount >= 1, progress: Math.min(examsCount, 1), target: 1, color: "text-purple-500", tier: 1 },
        { id: "first_comment", title: "صوتك مسموع 💬", description: "اكتب أول تعليق", icon: BookOpen, earned: commentsCount >= 1, progress: Math.min(commentsCount, 1), target: 1, color: "text-cyan-500", tier: 1 },
        { id: "10_videos", title: "متابع نشط 📺", description: "شاهد 10 فيديوهات", icon: Video, earned: viewsCount >= 10, progress: Math.min(viewsCount, 10), target: 10, color: "text-blue-600", tier: 1 },
        { id: "5_hw", title: "مجتهد 📝", description: "سلّم 5 واجبات", icon: ClipboardList, earned: hwCount >= 5, progress: Math.min(hwCount, 5), target: 5, color: "text-green-600", tier: 1 },
        { id: "5_exams", title: "خبير الامتحانات 📊", description: "ادخل 5 امتحانات", icon: FileText, earned: examsCount >= 5, progress: Math.min(examsCount, 5), target: 5, color: "text-purple-600", tier: 1 },
        { id: "perfect_hw", title: "الدرجة الكاملة 💯", description: "10/10 في واجب", icon: Award, earned: perfectHw >= 1, progress: Math.min(perfectHw, 1), target: 1, color: "text-amber-500", tier: 1 },
        { id: "perfect_exam", title: "عبقري 🧠", description: "درجة كاملة في امتحان", icon: Trophy, earned: perfectExams >= 1, progress: Math.min(perfectExams, 1), target: 1, color: "text-amber-600", tier: 1 },
        { id: "50_points", title: "جامع النقاط 🔥", description: "اجمع 50 نقطة", icon: Flame, earned: totalPoints >= 50, progress: Math.min(totalPoints, 50), target: 50, color: "text-orange-500", tier: 1 },

        // === Tier 2: التقدم (10 التانية) ===
        { id: "25_videos", title: "نجم المشاهدة ⭐", description: "شاهد 25 فيديو", icon: Star, earned: viewsCount >= 25, progress: Math.min(viewsCount, 25), target: 25, color: "text-yellow-500", tier: 2 },
        { id: "10_hw", title: "ملك الواجبات 👑", description: "سلّم 10 واجبات", icon: Crown, earned: hwCount >= 10, progress: Math.min(hwCount, 10), target: 10, color: "text-yellow-600", tier: 2 },
        { id: "10_exams", title: "محترف الاختبارات 🛡️", description: "ادخل 10 امتحانات", icon: Shield, earned: examsCount >= 10, progress: Math.min(examsCount, 10), target: 10, color: "text-teal-600", tier: 2 },
        { id: "3_perfect_exams", title: "ثلاثية مثالية ✨", description: "3 امتحانات درجة كاملة", icon: Sparkles, earned: perfectExams >= 3, progress: Math.min(perfectExams, 3), target: 3, color: "text-pink-500", tier: 2 },
        { id: "3_perfect_hw", title: "ثلاث واجبات كاملة 🎯", description: "3 واجبات 10/10", icon: Target, earned: perfectHw >= 3, progress: Math.min(perfectHw, 3), target: 3, color: "text-red-500", tier: 2 },
        { id: "100_points", title: "المتفوق 🏆", description: "اجمع 100 نقطة", icon: Target, earned: totalPoints >= 100, progress: Math.min(totalPoints, 100), target: 100, color: "text-red-500", tier: 2 },
        { id: "10_comments", title: "محاور نشط 🗣️", description: "اكتب 10 تعليقات", icon: BookOpen, earned: commentsCount >= 10, progress: Math.min(commentsCount, 10), target: 10, color: "text-cyan-600", tier: 2 },
        { id: "50_videos", title: "ماراثون المشاهدة 🎯", description: "شاهد 50 فيديو", icon: Rocket, earned: viewsCount >= 50, progress: Math.min(viewsCount, 50), target: 50, color: "text-indigo-500", tier: 2 },
        { id: "15_hw", title: "بطل الواجبات 🦸", description: "سلّم 15 واجب", icon: ClipboardList, earned: hwCount >= 15, progress: Math.min(hwCount, 15), target: 15, color: "text-emerald-500", tier: 2 },
        { id: "200_points", title: "صاروخ النقاط 🚀", description: "اجمع 200 نقطة", icon: Rocket, earned: totalPoints >= 200, progress: Math.min(totalPoints, 200), target: 200, color: "text-violet-500", tier: 2 },

        // === Tier 3: الأسطورة (10 الأخيرة) ===
        { id: "100_videos", title: "أسطورة المشاهدة 🏅", description: "شاهد 100 فيديو", icon: Zap, earned: viewsCount >= 100, progress: Math.min(viewsCount, 100), target: 100, color: "text-rose-500", tier: 3 },
        { id: "20_hw", title: "أسطورة الواجبات 📚", description: "سلّم 20 واجب", icon: ClipboardList, earned: hwCount >= 20, progress: Math.min(hwCount, 20), target: 20, color: "text-green-700", tier: 3 },
        { id: "20_exams", title: "أسطورة الامتحانات 🗡️", description: "ادخل 20 امتحان", icon: FileText, earned: examsCount >= 20, progress: Math.min(examsCount, 20), target: 20, color: "text-purple-700", tier: 3 },
        { id: "5_perfect_exams", title: "5 درجات كاملة 💎", description: "5 امتحانات درجة كاملة", icon: Gem, earned: perfectExams >= 5, progress: Math.min(perfectExams, 5), target: 5, color: "text-violet-500", tier: 3 },
        { id: "5_perfect_hw", title: "5 واجبات كاملة 💎", description: "5 واجبات 10/10", icon: Gem, earned: perfectHw >= 5, progress: Math.min(perfectHw, 5), target: 5, color: "text-violet-600", tier: 3 },
        { id: "500_points", title: "بطل المنصة 👑", description: "اجمع 500 نقطة", icon: Crown, earned: totalPoints >= 500, progress: Math.min(totalPoints, 500), target: 500, color: "text-red-600", tier: 3 },
        { id: "25_comments", title: "نجم التعليقات 🌟", description: "اكتب 25 تعليق", icon: Star, earned: commentsCount >= 25, progress: Math.min(commentsCount, 25), target: 25, color: "text-yellow-500", tier: 3 },
        { id: "150_videos", title: "وحش المشاهدة ⚡", description: "شاهد 150 فيديو", icon: Zap, earned: viewsCount >= 150, progress: Math.min(viewsCount, 150), target: 150, color: "text-amber-500", tier: 3 },
        { id: "30_exams", title: "جنرال الامتحانات 🎖️", description: "ادخل 30 امتحان", icon: Medal, earned: examsCount >= 30, progress: Math.min(examsCount, 30), target: 30, color: "text-amber-700", tier: 3 },
        { id: "1000_points", title: "أسطورة المنصة 🌟👑", description: "اجمع 1000 نقطة", icon: Crown, earned: totalPoints >= 1000, progress: Math.min(totalPoints, 1000), target: 1000, color: "text-yellow-400", tier: 3 },
      ];

      setBadges(allBadges);
      setLoading(false);
    };
    fetchAchievements();
  }, [userId]);

  if (loading) return null;

  const earnedCount = badges.filter(b => b.earned).length;

  // Determine which tier to show: show current active tier only
  // Tier is complete when all 10 badges in it are earned
  const tier1 = badges.filter(b => b.tier === 1);
  const tier2 = badges.filter(b => b.tier === 2);
  const tier3 = badges.filter(b => b.tier === 3);

  const tier1Complete = tier1.every(b => b.earned);
  const tier2Complete = tier2.every(b => b.earned);

  let visibleBadges: Badge[];
  let tierLabel: string;

  if (!tier1Complete) {
    visibleBadges = tier1;
    tierLabel = "المستوى الأول";
  } else if (!tier2Complete) {
    visibleBadges = tier2;
    tierLabel = "المستوى الثاني";
  } else {
    visibleBadges = tier3;
    tierLabel = "المستوى الثالث";
  }

  const totalEarnedInTier = visibleBadges.filter(b => b.earned).length;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold font-amiri text-center mb-1">🏅 شاراتي</h2>
      <p className="text-center text-sm text-muted-foreground mb-1">
        {tierLabel} — {totalEarnedInTier}/{visibleBadges.length} شارة
      </p>
      <p className="text-center text-xs text-muted-foreground mb-4">
        إجمالي الشارات المكتسبة: {earnedCount}/30
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
