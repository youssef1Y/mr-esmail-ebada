import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, BarChart3, Trophy, FileText, Video, BookMarked, Download } from "lucide-react";
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
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      const userId = session.user.id;

      const { data: profileData } = await supabase.from("profiles").select("full_name, grade").eq("user_id", userId).single();
      if (profileData) setProfile(profileData);

      const [pointsResult, attemptsResult, viewsResult, hwResult, rankResult] = await Promise.all([
        supabase.from("student_points").select("points").eq("user_id", userId),
        supabase.from("exam_attempts").select("score, total").eq("user_id", userId),
        supabase.from("video_views").select("id").eq("user_id", userId),
        supabase.from("homework_submissions").select("id").eq("user_id", userId),
        supabase.rpc("get_student_rank", { p_user_id: userId }),
      ]);

      const totalPoints = pointsResult.data?.reduce((sum, p) => sum + p.points, 0) || 0;
      const examsTaken = attemptsResult.data?.length || 0;
      const avgScore = examsTaken > 0
        ? Math.round(attemptsResult.data!.reduce((sum, a) => sum + ((a.score || 0) / (a.total || 1)) * 100, 0) / examsTaken)
        : 0;
      const videosWatched = viewsResult.data?.length || 0;
      const homeworkSubmitted = hwResult.data?.length || 0;

      const rankData = rankResult.data?.[0];

      setStats({
        totalPoints,
        examsTaken,
        avgScore,
        videosWatched,
        homeworkSubmitted,
        rank: rankData ? Number(rankData.rank) : 0,
        totalStudents: rankData ? Number(rankData.total_students) : 0,
      });
      setLoading(false);
    };
    init();
  }, [navigate]);

  const generatePDF = () => {
    const date = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>تقرير أداء - ${profile?.full_name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Cairo', sans-serif; background: #fff; color: #1a1a1a; padding: 40px; direction: rtl; }
  .header { text-align: center; border-bottom: 3px solid #2d6a4f; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 24px; color: #2d6a4f; margin-bottom: 4px; }
  .header p { font-size: 14px; color: #666; }
  .student-info { background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
  .student-info h2 { font-size: 18px; margin-bottom: 8px; color: #2d6a4f; }
  .student-info .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .student-info .row .label { color: #666; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
  .stat-card .value { font-size: 32px; font-weight: 700; color: #2d6a4f; }
  .stat-card .label { font-size: 12px; color: #666; margin-top: 4px; }
  .details { margin-bottom: 24px; }
  .details h3 { font-size: 16px; color: #2d6a4f; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
  .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px; }
  .detail-row .icon { font-size: 20px; margin-left: 8px; }
  .detail-row .info { flex: 1; }
  .detail-row .info .title { font-weight: 700; font-size: 14px; }
  .detail-row .info .sub { font-size: 12px; color: #666; }
  .detail-row .val { font-size: 18px; font-weight: 700; color: #2d6a4f; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #999; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>📊 تقرير أداء الطالب</h1>
    <p>منصة الأستاذ إسماعيل أحمد عبادة لتعليم أصول الدين</p>
  </div>
  <div class="student-info">
    <h2>بيانات الطالب</h2>
    <div class="row"><span class="label">الاسم:</span><span>${profile?.full_name}</span></div>
    <div class="row"><span class="label">الصف الدراسي:</span><span>${profile?.grade}</span></div>
    <div class="row"><span class="label">تاريخ التقرير:</span><span>${date}</span></div>
  </div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="value">${stats.totalPoints}</div>
      <div class="label">إجمالي النقاط</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.rank}<span style="font-size:16px;color:#666">/${stats.totalStudents}</span></div>
      <div class="label">الترتيب العام</div>
    </div>
  </div>
  <div class="details">
    <h3>تفاصيل الأداء</h3>
    <div class="detail-row">
      <span class="icon">📝</span>
      <div class="info"><div class="title">الامتحانات</div><div class="sub">${stats.examsTaken} امتحان</div></div>
      <div class="val">${stats.avgScore}%</div>
    </div>
    <div class="detail-row">
      <span class="icon">🎬</span>
      <div class="info"><div class="title">الفيديوهات</div><div class="sub">فيديوهات تمت مشاهدتها</div></div>
      <div class="val">${stats.videosWatched}</div>
    </div>
    <div class="detail-row">
      <span class="icon">📋</span>
      <div class="info"><div class="title">الواجبات</div><div class="sub">واجبات تم تسليمها</div></div>
      <div class="val">${stats.homeworkSubmitted}</div>
    </div>
  </div>
  <div class="footer">
    <p>هذا التقرير صادر من منصة الأستاذ إسماعيل أحمد عبادة · ${date}</p>
    <p>يمكن لولي الأمر متابعة أداء الطالب بشكل دوري من خلال المنصة</p>
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

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

      <main className="container mx-auto px-4 py-8 max-w-2xl" ref={reportRef}>
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
          <Button onClick={generatePDF} className="gap-2">
            <Download className="w-4 h-4" /> تحميل تقرير PDF
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          يمكنك تحميل التقرير وإرساله لولي الأمر لمتابعة مستواك الدراسي
        </p>
      </main>
    </div>
  );
};

export default StudentReport;
