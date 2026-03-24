import { useEffect, useState } from "react";
import { BarChart3, Video, Users, TrendingUp, TrendingDown, Eye, Award, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface TopVideo {
  id: string;
  title: string;
  subject: string;
  grade: string;
  view_count: number;
}

interface StudentActivity {
  user_id: string;
  full_name: string;
  grade: string;
  student_phone: string;
  is_subscribed: boolean;
  video_views: number;
  hw_submissions: number;
  exam_attempts: number;
  total_points: number;
  last_activity: string | null;
  days_inactive: number;
}

interface GradeStats {
  grade: string;
  student_count: number;
  avg_score: number;
  active_count: number;
  inactive_count: number;
}

const AdminStatsTab = ({ toast }: { toast: any }) => {
  const [loading, setLoading] = useState(true);
  const [topVideos, setTopVideos] = useState<TopVideo[]>([]);
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [gradeStats, setGradeStats] = useState<GradeStats[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [inactiveStudents, setInactiveStudents] = useState(0);
  const [totalVideoViews, setTotalVideoViews] = useState(0);
  const [avgSuccessRate, setAvgSuccessRate] = useState(0);
  const [showInactive, setShowInactive] = useState(false);
  const [showActive, setShowActive] = useState(false);
  const [inactiveFilter, setInactiveFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const fetchStats = async () => {
    setLoading(true);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [profilesRes, videoViewsRes, videosRes, hwSubsRes, examAttemptsRes, pointsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, grade, student_phone, is_subscribed, created_at"),
      supabase.from("video_views").select("video_id, user_id, viewed_at"),
      supabase.from("videos").select("id, title, subject, grade"),
      supabase.from("homework_submissions").select("user_id, score, total, submitted_at"),
      supabase.from("exam_attempts").select("user_id, score, total, submitted_at"),
      supabase.from("student_points").select("user_id, points"),
    ]);

    const profiles = profilesRes.data || [];
    const videoViews = videoViewsRes.data || [];
    const videos = videosRes.data || [];
    const hwSubs = hwSubsRes.data || [];
    const examAttempts = examAttemptsRes.data || [];
    const points = pointsRes.data || [];

    // Top Videos
    const viewCounts = new Map<string, number>();
    videoViews.forEach(vv => {
      viewCounts.set(vv.video_id, (viewCounts.get(vv.video_id) || 0) + 1);
    });

    const videoMap = new Map(videos.map(v => [v.id, v]));
    const topVids: TopVideo[] = [...viewCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([vid, count]) => {
        const v = videoMap.get(vid);
        return {
          id: vid,
          title: v?.title || "فيديو محذوف",
          subject: v?.subject || "",
          grade: v?.grade || "",
          view_count: count,
        };
      });
    setTopVideos(topVids);
    setTotalVideoViews(videoViews.length);

    // Student Activity
    const userViews = new Map<string, { count: number; lastDate: string }>();
    videoViews.forEach(vv => {
      const existing = userViews.get(vv.user_id);
      if (!existing || vv.viewed_at > existing.lastDate) {
        userViews.set(vv.user_id, {
          count: (existing?.count || 0) + 1,
          lastDate: vv.viewed_at,
        });
      } else {
        existing.count += 1;
      }
    });

    const userHwSubs = new Map<string, { count: number; lastDate: string }>();
    hwSubs.forEach(h => {
      const existing = userHwSubs.get(h.user_id);
      if (!existing || h.submitted_at > existing.lastDate) {
        userHwSubs.set(h.user_id, {
          count: (existing?.count || 0) + 1,
          lastDate: h.submitted_at,
        });
      } else {
        existing.count += 1;
      }
    });

    const userExams = new Map<string, { count: number; lastDate: string }>();
    examAttempts.forEach(e => {
      const existing = userExams.get(e.user_id);
      if (!existing || e.submitted_at > existing.lastDate) {
        userExams.set(e.user_id, {
          count: (existing?.count || 0) + 1,
          lastDate: e.submitted_at,
        });
      } else {
        existing.count += 1;
      }
    });

    const userPoints = new Map<string, number>();
    points.forEach(p => {
      userPoints.set(p.user_id, (userPoints.get(p.user_id) || 0) + p.points);
    });

    const activities: StudentActivity[] = profiles.map(p => {
      const views = userViews.get(p.user_id);
      const hw = userHwSubs.get(p.user_id);
      const exams = userExams.get(p.user_id);

      const dates = [views?.lastDate, hw?.lastDate, exams?.lastDate].filter(Boolean) as string[];
      const lastActivity = dates.length > 0 ? dates.sort().reverse()[0] : null;
      const daysInactive = lastActivity
        ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));

      return {
        user_id: p.user_id,
        full_name: p.full_name,
        grade: p.grade,
        student_phone: p.student_phone,
        is_subscribed: p.is_subscribed,
        video_views: views?.count || 0,
        hw_submissions: hw?.count || 0,
        exam_attempts: exams?.count || 0,
        total_points: userPoints.get(p.user_id) || 0,
        last_activity: lastActivity,
        days_inactive: daysInactive,
      };
    });

    setStudentActivities(activities);
    setTotalStudents(profiles.length);

    const active = activities.filter(a => a.days_inactive <= 7);
    const inactive = activities.filter(a => a.days_inactive > 14);
    setActiveStudents(active.length);
    setInactiveStudents(inactive.length);

    // Success Rate
    const allScored = [...hwSubs, ...examAttempts].filter(s => s.score != null && s.total != null && (s.total ?? 0) > 0);
    if (allScored.length > 0) {
      const totalPercent = allScored.reduce((sum, s) => sum + ((s.score ?? 0) / (s.total ?? 1)) * 100, 0);
      setAvgSuccessRate(Math.round(totalPercent / allScored.length));
    }

    // Grade Stats
    const gradeMap = new Map<string, { students: StudentActivity[]; scores: number[] }>();
    activities.forEach(a => {
      if (!gradeMap.has(a.grade)) gradeMap.set(a.grade, { students: [], scores: [] });
      gradeMap.get(a.grade)!.students.push(a);
    });
    [...hwSubs, ...examAttempts].forEach(s => {
      if (s.score != null && s.total != null && (s.total ?? 0) > 0) {
        const profile = profiles.find(p => p.user_id === s.user_id);
        if (profile) {
          const entry = gradeMap.get(profile.grade);
          if (entry) entry.scores.push(((s.score ?? 0) / (s.total ?? 1)) * 100);
        }
      }
    });

    const gStats: GradeStats[] = [...gradeMap.entries()].map(([grade, data]) => ({
      grade,
      student_count: data.students.length,
      avg_score: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
      active_count: data.students.filter(s => s.days_inactive <= 7).length,
      inactive_count: data.students.filter(s => s.days_inactive > 14).length,
    })).sort((a, b) => b.student_count - a.student_count);

    setGradeStats(gStats);
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const inactiveStudentsList = studentActivities
    .filter(a => a.days_inactive > 14)
    .filter(a => !inactiveFilter || a.grade === inactiveFilter)
    .sort((a, b) => b.days_inactive - a.days_inactive);

  const activeStudentsList = studentActivities
    .filter(a => a.days_inactive <= 7)
    .filter(a => !activeFilter || a.grade === activeFilter)
    .sort((a, b) => b.total_points - a.total_points);

  const grades = [...new Set(studentActivities.map(a => a.grade))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-amiri flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> الإحصائيات المتقدمة
        </h2>
        <Button variant="outline" size="sm" onClick={fetchStats} className="gap-1">
          <RefreshCw className="w-3 h-3" /> تحديث
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <Users className="w-6 h-6 text-primary mx-auto mb-1" />
          <div className="text-2xl font-bold text-primary">{totalStudents}</div>
          <div className="text-[10px] text-muted-foreground">إجمالي الطلاب</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeStudents}</div>
          <div className="text-[10px] text-muted-foreground">نشط (آخر 7 أيام)</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-orange-500">{inactiveStudents}</div>
          <div className="text-[10px] text-muted-foreground">غير نشط (+14 يوم)</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalVideoViews}</div>
          <div className="text-[10px] text-muted-foreground">إجمالي المشاهدات</div>
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold flex items-center gap-1">
            <Award className="w-4 h-4 text-primary" /> متوسط نسبة النجاح
          </span>
          <span className="text-lg font-bold text-primary">{avgSuccessRate}%</span>
        </div>
        <Progress value={avgSuccessRate} className="h-3" />
      </div>

      {/* Grade Breakdown */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-1">
          <BarChart3 className="w-4 h-4" /> توزيع الطلاب حسب الصف
        </h3>
        <div className="space-y-3">
          {gradeStats.map(gs => (
            <div key={gs.grade} className="bg-background rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">{gs.grade}</span>
                <span className="text-xs text-muted-foreground">{gs.student_count} طالب</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-xs font-bold text-green-600 dark:text-green-400">{gs.active_count}</div>
                  <div className="text-[9px] text-muted-foreground">نشط</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-orange-500">{gs.inactive_count}</div>
                  <div className="text-[9px] text-muted-foreground">غير نشط</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-primary">{gs.avg_score}%</div>
                  <div className="text-[9px] text-muted-foreground">متوسط الدرجات</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Videos */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-1">
          <Video className="w-4 h-4" /> أكثر الفيديوهات مشاهدة
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {topVideos.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3 bg-background rounded-lg p-3 border border-border">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                i === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" :
                i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{v.title}</p>
                <p className="text-[10px] text-muted-foreground">{v.subject} • {v.grade}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-primary">{v.view_count}</div>
                <div className="text-[9px] text-muted-foreground">مشاهدة</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inactive Students */}
      <div className="bg-card rounded-xl border border-border p-4">
        <button
          onClick={() => setShowInactive(!showInactive)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-sm font-bold flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            الطلاب غير النشطين ({inactiveStudentsList.length})
          </h3>
          {showInactive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showInactive && (
          <div className="mt-3 space-y-2">
            <select
              value={inactiveFilter}
              onChange={e => setInactiveFilter(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">كل الصفوف</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            {inactiveStudentsList.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-4">لا يوجد طلاب غير نشطين 🎉</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {inactiveStudentsList.map(s => (
                  <div key={s.user_id} className="bg-background rounded-lg p-3 border border-orange-200 dark:border-orange-800/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold">{s.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.grade} • {s.student_phone}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-orange-500">{s.days_inactive} يوم</div>
                        <div className="text-[9px] text-muted-foreground">بدون نشاط</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center bg-muted/50 rounded px-1 py-0.5">
                        <div className="text-[10px] font-bold">{s.video_views}</div>
                        <div className="text-[8px] text-muted-foreground">مشاهدات</div>
                      </div>
                      <div className="text-center bg-muted/50 rounded px-1 py-0.5">
                        <div className="text-[10px] font-bold">{s.hw_submissions}</div>
                        <div className="text-[8px] text-muted-foreground">واجبات</div>
                      </div>
                      <div className="text-center bg-muted/50 rounded px-1 py-0.5">
                        <div className="text-[10px] font-bold">{s.exam_attempts}</div>
                        <div className="text-[8px] text-muted-foreground">امتحانات</div>
                      </div>
                    </div>
                    {s.last_activity && (
                      <p className="text-[9px] text-muted-foreground mt-1">
                        آخر نشاط: {new Date(s.last_activity).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Most Active Students */}
      <div className="bg-card rounded-xl border border-border p-4">
        <button
          onClick={() => setShowActive(!showActive)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-sm font-bold flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            أنشط الطلاب ({activeStudentsList.length})
          </h3>
          {showActive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showActive && (
          <div className="mt-3 space-y-2">
            <select
              value={activeFilter}
              onChange={e => setActiveFilter(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">كل الصفوف</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {activeStudentsList.slice(0, 50).map((s, i) => (
                <div key={s.user_id} className="bg-background rounded-lg p-3 border border-green-200 dark:border-green-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        i === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" :
                        i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                        "bg-muted text-muted-foreground"
                      }`}>{i + 1}</div>
                      <div>
                        <p className="text-xs font-bold">{s.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.grade}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">{s.total_points}</div>
                      <div className="text-[9px] text-muted-foreground">نقطة</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center bg-muted/50 rounded px-1 py-0.5">
                      <div className="text-[10px] font-bold">{s.video_views}</div>
                      <div className="text-[8px] text-muted-foreground">مشاهدات</div>
                    </div>
                    <div className="text-center bg-muted/50 rounded px-1 py-0.5">
                      <div className="text-[10px] font-bold">{s.hw_submissions}</div>
                      <div className="text-[8px] text-muted-foreground">واجبات</div>
                    </div>
                    <div className="text-center bg-muted/50 rounded px-1 py-0.5">
                      <div className="text-[10px] font-bold">{s.exam_attempts}</div>
                      <div className="text-[8px] text-muted-foreground">امتحانات</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStatsTab;
