import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, BarChart3, Trophy, FileText, Video, BookMarked, Download, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ExamDetail { exam_title: string; score: number; total: number; date: string; }
interface HwDetail { hw_title: string; score: number | null; date: string; }
interface VhDetail { video_title: string; score: number; total: number; date: string; }

const StudentReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string; grade: string } | null>(null);
  const [stats, setStats] = useState({
    totalPoints: 0, examsTaken: 0, avgScore: 0, videosWatched: 0,
    homeworkSubmitted: 0, videoHomeworkSubmitted: 0, avgVhScore: 0,
    rank: 0, totalStudents: 0,
  });
  const [examDetails, setExamDetails] = useState<ExamDetail[]>([]);
  const [hwDetails, setHwDetails] = useState<HwDetail[]>([]);
  const [vhDetails, setVhDetails] = useState<VhDetail[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      const userId = session.user.id;

      const { data: profileData } = await supabase.from("profiles").select("full_name, grade").eq("user_id", userId).single();
      if (profileData) setProfile(profileData);

      const [pointsResult, attemptsResult, viewsResult, hwResult, vhResult, rankResult] = await Promise.all([
        supabase.from("student_points").select("points").eq("user_id", userId),
        supabase.from("exam_attempts").select("score, total, submitted_at, exam_id").eq("user_id", userId).order("submitted_at", { ascending: false }),
        supabase.from("video_views").select("id").eq("user_id", userId),
        supabase.from("homework_submissions").select("score, submitted_at, homework_id").eq("user_id", userId).order("submitted_at", { ascending: false }),
        supabase.from("video_homework_submissions").select("score, total, submitted_at, homework_id").eq("user_id", userId).order("submitted_at", { ascending: false }),
        supabase.rpc("get_student_rank", { p_user_id: userId }),
      ]);

      const totalPoints = pointsResult.data?.reduce((sum, p) => sum + p.points, 0) || 0;
      const attempts = attemptsResult.data || [];
      const examsTaken = attempts.length;
      const avgScore = examsTaken > 0
        ? Math.round(attempts.reduce((sum, a) => sum + ((a.score || 0) / (a.total || 1)) * 100, 0) / examsTaken)
        : 0;
      const videosWatched = viewsResult.data?.length || 0;
      const hwSubs = hwResult.data || [];
      const homeworkSubmitted = hwSubs.length;
      const vhSubs = vhResult.data || [];
      const videoHomeworkSubmitted = vhSubs.length;
      const avgVhScore = videoHomeworkSubmitted > 0
        ? Math.round(vhSubs.reduce((sum, v) => sum + ((v.score || 0) / (v.total || 1)) * 100, 0) / videoHomeworkSubmitted)
        : 0;

      const rankData = rankResult.data?.[0];

      // Fetch exam titles
      if (attempts.length > 0) {
        const examIds = [...new Set(attempts.map(a => a.exam_id))];
        const { data: exams } = await supabase.from("exams").select("id, title").in("id", examIds);
        const examMap = new Map(exams?.map(e => [e.id, e.title]) || []);
        setExamDetails(attempts.map(a => ({
          exam_title: examMap.get(a.exam_id) || "امتحان",
          score: a.score || 0, total: a.total || 0,
          date: new Date(a.submitted_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" }),
        })));
      }

      // Fetch homework titles
      if (hwSubs.length > 0) {
        const hwIds = [...new Set(hwSubs.map(h => h.homework_id))];
        const { data: hws } = await supabase.from("homework").select("id, title").in("id", hwIds);
        const hwMap = new Map(hws?.map(h => [h.id, h.title]) || []);
        setHwDetails(hwSubs.map(h => ({
          hw_title: hwMap.get(h.homework_id) || "واجب",
          score: h.score,
          date: new Date(h.submitted_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" }),
        })));
      }

      // Fetch video homework titles
      if (vhSubs.length > 0) {
        const vhIds = [...new Set(vhSubs.map(v => v.homework_id))];
        const { data: vhs } = await supabase.from("video_homework").select("id, video_id").in("id", vhIds);
        if (vhs && vhs.length > 0) {
          const videoIds = [...new Set(vhs.map(v => v.video_id))];
          const { data: videos } = await supabase.from("videos").select("id, title").in("id", videoIds);
          const videoMap = new Map(videos?.map(v => [v.id, v.title]) || []);
          const vhVideoMap = new Map(vhs.map(v => [v.id, videoMap.get(v.video_id) || "فيديو"]));
          setVhDetails(vhSubs.map(v => ({
            video_title: vhVideoMap.get(v.homework_id) || "واجب فيديو",
            score: v.score || 0, total: v.total || 0,
            date: new Date(v.submitted_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" }),
          })));
        }
      }

      setStats({
        totalPoints, examsTaken, avgScore, videosWatched,
        homeworkSubmitted, videoHomeworkSubmitted, avgVhScore,
        rank: rankData ? Number(rankData.rank) : 0,
        totalStudents: rankData ? Number(rankData.total_students) : 0,
      });
      setLoading(false);
    };
    init();
  }, [navigate]);

  const toggle = (section: string) => setExpandedSection(prev => prev === section ? null : section);

  const generatePDF = () => {
    const date = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    const examRows = examDetails.map(e => `<tr><td>${e.exam_title}</td><td>${e.score}/${e.total}</td><td>${e.total > 0 ? Math.round((e.score/e.total)*100) : 0}%</td><td>${e.date}</td></tr>`).join("");
    const hwRows = hwDetails.map(h => `<tr><td>${h.hw_title}</td><td>${h.score !== null ? h.score + '/10' : 'لم يُقيّم'}</td><td>${h.date}</td></tr>`).join("");
    const vhRows = vhDetails.map(v => `<tr><td>${v.video_title}</td><td>${v.score}/${v.total}</td><td>${v.total > 0 ? Math.round((v.score/v.total)*100) : 0}%</td><td>${v.date}</td></tr>`).join("");

    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير أداء - ${profile?.full_name}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',sans-serif;background:#fff;color:#1a1a1a;padding:40px;direction:rtl}
.header{text-align:center;border-bottom:3px solid #2d6a4f;padding-bottom:20px;margin-bottom:30px}
.header h1{font-size:24px;color:#2d6a4f}.header p{font-size:14px;color:#666}
.info{background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px}
.info h2{font-size:18px;margin-bottom:8px;color:#2d6a4f}
.info .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}.info .row .label{color:#666}
.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px}
.stat{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center}
.stat .val{font-size:28px;font-weight:700;color:#2d6a4f}.stat .lbl{font-size:11px;color:#666;margin-top:4px}
table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px}
th{background:#2d6a4f;color:#fff;padding:10px 8px;text-align:right}
td{padding:8px;border-bottom:1px solid #e5e7eb}tr:nth-child(even){background:#f9fafb}
h3{font-size:16px;color:#2d6a4f;margin-bottom:12px;border-bottom:1px solid #e5e7eb;padding-bottom:8px}
.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:2px solid #e5e7eb;font-size:12px;color:#999}
@media print{body{padding:20px}}</style></head><body>
<div class="header"><h1>📊 تقرير أداء الطالب</h1><p>منصة الأستاذ إسماعيل أحمد عبادة لتعليم أصول الدين</p></div>
<div class="info"><h2>بيانات الطالب</h2>
<div class="row"><span class="label">الاسم:</span><span>${profile?.full_name}</span></div>
<div class="row"><span class="label">الصف:</span><span>${profile?.grade}</span></div>
<div class="row"><span class="label">التاريخ:</span><span>${date}</span></div></div>
<div class="stats">
<div class="stat"><div class="val">${stats.totalPoints}</div><div class="lbl">النقاط</div></div>
<div class="stat"><div class="val">${stats.rank}<span style="font-size:14px;color:#666">/${stats.totalStudents}</span></div><div class="lbl">الترتيب</div></div>
<div class="stat"><div class="val">${stats.avgScore}%</div><div class="lbl">متوسط الامتحانات</div></div></div>
${examDetails.length > 0 ? `<h3>📝 الامتحانات (${stats.examsTaken})</h3><table><tr><th>الامتحان</th><th>الدرجة</th><th>النسبة</th><th>التاريخ</th></tr>${examRows}</table>` : ''}
${hwDetails.length > 0 ? `<h3>📋 الواجبات (${stats.homeworkSubmitted})</h3><table><tr><th>الواجب</th><th>الدرجة</th><th>التاريخ</th></tr>${hwRows}</table>` : ''}
${vhDetails.length > 0 ? `<h3>🎬 واجبات الفيديو (${stats.videoHomeworkSubmitted})</h3><table><tr><th>الفيديو</th><th>الدرجة</th><th>النسبة</th><th>التاريخ</th></tr>${vhRows}</table>` : ''}
<div class="footer"><p>هذا التقرير صادر من منصة الأستاذ إسماعيل أحمد عبادة · ${date}</p></div></body></html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) { printWindow.document.write(html); printWindow.document.close(); setTimeout(() => printWindow.print(), 500); }
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
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <span className="text-xl font-bold text-primary">{stats.totalPoints}</span>
            <p className="text-xs text-muted-foreground">نقطة</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
            <span className="text-xl font-bold">{stats.rank}</span>
            <span className="text-xs text-muted-foreground">/{stats.totalStudents}</span>
            <p className="text-xs text-muted-foreground">ترتيبك</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Video className="w-5 h-5 text-primary mx-auto mb-1" />
            <span className="text-xl font-bold">{stats.videosWatched}</span>
            <p className="text-xs text-muted-foreground">فيديو</p>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-3">
          {/* Exams */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button onClick={() => toggle("exams")} className="w-full p-4 flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">الامتحانات</p>
                <p className="text-xs text-muted-foreground">{stats.examsTaken} امتحان</p>
              </div>
              <div className="text-left">
                <span className="text-lg font-bold text-primary">{stats.avgScore}%</span>
                <p className="text-xs text-muted-foreground">متوسط</p>
              </div>
            </button>
            {expandedSection === "exams" && examDetails.length > 0 && (
              <div className="border-t border-border px-4 pb-4 space-y-2">
                {examDetails.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-xs">{e.exam_title}</p>
                      <p className="text-[10px] text-muted-foreground">{e.date}</p>
                    </div>
                    <div className="text-left">
                      <span className={`font-bold ${e.total > 0 && e.score >= e.total * 0.5 ? "text-primary" : "text-destructive"}`}>
                        {e.score}/{e.total}
                      </span>
                      <p className="text-[10px] text-muted-foreground">{e.total > 0 ? Math.round((e.score/e.total)*100) : 0}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Homework */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button onClick={() => toggle("hw")} className="w-full p-4 flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookMarked className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">الواجبات</p>
                <p className="text-xs text-muted-foreground">{stats.homeworkSubmitted} واجب</p>
              </div>
            </button>
            {expandedSection === "hw" && hwDetails.length > 0 && (
              <div className="border-t border-border px-4 pb-4 space-y-2">
                {hwDetails.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-xs">{h.hw_title}</p>
                      <p className="text-[10px] text-muted-foreground">{h.date}</p>
                    </div>
                    <span className={`font-bold text-sm ${h.score !== null ? (h.score >= 5 ? "text-primary" : "text-destructive") : "text-muted-foreground"}`}>
                      {h.score !== null ? `${h.score}/10` : "لم يُقيّم"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video Homework */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button onClick={() => toggle("vh")} className="w-full p-4 flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">واجبات الفيديو</p>
                <p className="text-xs text-muted-foreground">{stats.videoHomeworkSubmitted} واجب</p>
              </div>
              <div className="text-left">
                <span className="text-lg font-bold text-primary">{stats.avgVhScore}%</span>
                <p className="text-xs text-muted-foreground">متوسط</p>
              </div>
            </button>
            {expandedSection === "vh" && vhDetails.length > 0 && (
              <div className="border-t border-border px-4 pb-4 space-y-2">
                {vhDetails.map((v, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-xs">{v.video_title}</p>
                      <p className="text-[10px] text-muted-foreground">{v.date}</p>
                    </div>
                    <div className="text-left">
                      <span className={`font-bold ${v.total > 0 && v.score >= v.total * 0.5 ? "text-primary" : "text-destructive"}`}>
                        {v.score}/{v.total}
                      </span>
                      <p className="text-[10px] text-muted-foreground">{v.total > 0 ? Math.round((v.score/v.total)*100) : 0}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
