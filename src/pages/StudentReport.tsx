import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, BarChart3, Trophy, FileText, Video, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const StudentReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string; grade: string } | null>(null);
  const [stats, setStats] = useState({
    totalPoints: 0,
    examsTaken: 0,
    avgScore: 0,
    videosWatched: 0,
    homeworkSubmitted: 0,
    rank: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      const userId = session.user.id;

      const { data: profileData } = await supabase.from("profiles").select("full_name, grade").eq("user_id", userId).single();
      if (profileData) setProfile(profileData);

      // Points
      const { data: points } = await supabase.from("student_points").select("points").eq("user_id", userId);
      const totalPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;

      // Exams
      const { data: attempts } = await supabase.from("exam_attempts").select("score, total").eq("user_id", userId);
      const examsTaken = attempts?.length || 0;
      const avgScore = examsTaken > 0
        ? Math.round(attempts!.reduce((sum, a) => sum + ((a.score || 0) / (a.total || 1)) * 100, 0) / examsTaken)
        : 0;

      // Videos
      const { data: views } = await supabase.from("video_views").select("id").eq("user_id", userId);
      const videosWatched = views?.length || 0;

      // Homework
      const { data: hwSubs } = await supabase.from("homework_submissions").select("id").eq("user_id", userId);
      const homeworkSubmitted = hwSubs?.length || 0;

      // Rank (compare points with all users)
      const { data: allPoints } = await supabase.from("student_points").select("user_id, points");
      const userTotals: Record<string, number> = {};
      allPoints?.forEach(p => { userTotals[p.user_id] = (userTotals[p.user_id] || 0) + p.points; });
      const sorted = Object.entries(userTotals).sort(([, a], [, b]) => b - a);
      const rank = sorted.findIndex(([id]) => id === userId) + 1;

      setStats({
        totalPoints,
        examsTaken,
        avgScore,
        videosWatched,
        homeworkSubmitted,
        rank: rank || sorted.length + 1,
        totalStudents: sorted.length,
      });
      setLoading(false);
    };
    init();
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">تقرير الأداء</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-amiri mb-1">تقرير أداء الطالب</h1>
          <p className="text-sm text-muted-foreground">{profile?.full_name} - {profile?.grade}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <span className="text-2xl font-bold text-primary">{stats.totalPoints}</span>
            <p className="text-xs text-muted-foreground">نقطة</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <BarChart3 className="w-6 h-6 text-primary mx-auto mb-1" />
            <span className="text-2xl font-bold">{stats.rank}</span>
            <span className="text-sm text-muted-foreground">/{stats.totalStudents}</span>
            <p className="text-xs text-muted-foreground">ترتيبك</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">الامتحانات</p>
              <p className="text-xs text-muted-foreground">{stats.examsTaken} امتحان</p>
            </div>
            <div className="text-left">
              <span className="text-lg font-bold text-primary">{stats.avgScore}%</span>
              <p className="text-xs text-muted-foreground">متوسط الدرجات</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">الفيديوهات</p>
              <p className="text-xs text-muted-foreground">{stats.videosWatched} فيديو تمت مشاهدته</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">الواجبات</p>
              <p className="text-xs text-muted-foreground">{stats.homeworkSubmitted} واجب تم تسليمه</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Link to="/my-results"><Button variant="outline" className="gap-2"><BarChart3 className="w-4 h-4" /> نتائج الامتحانات</Button></Link>
        </div>
      </main>
    </div>
  );
};

export default StudentReport;
