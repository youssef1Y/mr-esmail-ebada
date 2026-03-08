import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, User, LogOut, CheckCircle, ChevronLeft, Star, BookMarked, Scroll, BookHeart, Shield, Bell, Video, Users, Search, RefreshCw, Trash2, UserCheck, UserX, Plus, Send, Lock, ChevronDown, Play, Upload, FileText, X, BarChart3, ArrowRight, Trophy, Library, ClipboardList, Image as ImageIcon, Eye, MessageCircle, UserCog, Download } from "lucide-react";
import { StudentLevelBadge } from "@/components/StudentLevel";
import { InstallPWABanner, InstallPWAButton } from "@/components/InstallPWA";
import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";
import { StudentProgressTracker } from "@/components/StudentProgressTracker";
import { AchievementBadges } from "@/components/AchievementBadges";
import { useBadgeCounts, RedBadge } from "@/components/DashboardBadgeIndicators";
import { PushNotificationBanner } from "@/components/PushNotificationBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as AuthUser } from "@supabase/supabase-js";

// Admin password is securely stored server-side

interface Profile {
  full_name: string;
  grade: string;
  madhab: string;
  is_subscribed: boolean;
  school: string | null;
  governorate: string | null;
}

interface ProfileFull {
  id: string;
  user_id: string;
  full_name: string;
  grade: string;
  school: string | null;
  governorate: string | null;
  madhab: string | null;
  student_phone: string;
  parent_phone: string | null;
  is_subscribed: boolean;
  created_at: string;
}

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  grade: string;
  subject: string;
  access_type: string;
  created_at: string;
  madhab: string | null;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  target_audience: string;
  target_grades: string[];
  created_at: string;
}

interface ExamItem {
  id: string;
  title: string;
  grade: string;
  subject: string;
  video_id: string | null;
  access_type: string;
  created_at: string;
}

interface ExamQuestion {
  question_text: string;
  question_type: "mcq" | "essay";
  options: string[];
  correct_answer: string;
}

interface ExamAttemptResult {
  id: string;
  user_id: string;
  score: number | null;
  total: number | null;
  submitted_at: string;
  student_name?: string;
  student_grade?: string;
}

const allGrades = [
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
];

const subjectsList = ["الفقه", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية"];
const madhabOptions = ["شافعي", "حنفي", "مالكي", "حنبلي"] as const;

const prepSubjects = [
  { title: "الفقه", icon: BookMarked, description: "دراسة شاملة لأحكام الفقه على المذهب المحدد" },
  { title: "التوحيد", icon: Star, description: "شرح مقرر للعقيدة الإسلامية وأركان الإيمان" },
  { title: "التفسير", icon: Scroll, description: "تفسير الآيات القرآنية وفهم معانيها" },
  { title: "الحديث الشريف", icon: BookHeart, description: "دراسة الأحاديث النبوية الشريفة المقررة" },
  { title: "السيرة النبوية", icon: BookOpen, description: "دراسة سيرة النبي صلى الله عليه وسلم" },
];

const secSubjects = [
  { title: "الفقه", icon: BookMarked, description: "دراسة شاملة لأحكام الفقه على المذهب المحدد" },
  { title: "التوحيد", icon: Star, description: "شرح مقرر للعقيدة الإسلامية وأركان الإيمان" },
  { title: "التفسير", icon: Scroll, description: "تفسير الآيات القرآنية وفهم معانيها" },
  { title: "الحديث الشريف", icon: BookHeart, description: "دراسة الأحاديث النبوية الشريفة المقررة" },
];

const gradeSubjects: Record<string, { title: string; icon: any; description: string }[]> = {
  "الصف الأول الإعدادي": prepSubjects,
  "الصف الثاني الإعدادي": prepSubjects,
  "الصف الثالث الإعدادي": prepSubjects,
  "الصف الأول الثانوي": secSubjects,
  "الصف الثاني الثانوي": secSubjects,
  "الصف الثالث الثانوي": secSubjects,
};

// Admin Homework Tab Component
const AdminHomeworkTab = ({ grades, subjects, toast }: { grades: string[]; subjects: string[]; toast: any }) => {
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newHw, setNewHw] = useState({ title: "", description: "", grade: "", subject: "", due_date: "" });

  const fetchHomework = async () => {
    const { data } = await supabase.from("homework").select("*").order("created_at", { ascending: false });
    if (data) setHomeworkList(data);
  };

  useEffect(() => { fetchHomework(); }, []);

  const addHomework = async () => {
    if (!newHw.title || !newHw.grade || !newHw.subject) {
      toast({ title: "خطأ", description: "أكمل الحقول المطلوبة", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("homework").insert({
      title: newHw.title,
      description: newHw.description || null,
      grade: newHw.grade,
      subject: newHw.subject,
      due_date: newHw.due_date || null,
    });
    if (error) { console.error("Insert homework error:", error); toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة الواجب", variant: "destructive" }); }
    else {
      toast({ title: "تم إضافة الواجب" });
      sendPushToGrade("📋 واجب جديد", `تم إضافة واجب جديد: ${newHw.title} - ${newHw.subject}`, [newHw.grade]);
      setNewHw({ title: "", description: "", grade: "", subject: "", due_date: "" });
      setShowAdd(false);
      fetchHomework();
    }
  };

  const deleteHomework = async (id: string) => {
    await supabase.from("homework").delete().eq("id", id);
    fetchHomework();
    toast({ title: "تم حذف الواجب" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">إدارة الواجبات</h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-1"><Plus className="w-3 h-3" /> إضافة</Button>
      </div>
      {showAdd && (
        <div className="bg-muted rounded-xl p-4 space-y-3">
          <Input value={newHw.title} onChange={e => setNewHw({ ...newHw, title: e.target.value })} placeholder="عنوان الواجب" />
          <textarea value={newHw.description} onChange={e => setNewHw({ ...newHw, description: e.target.value })} placeholder="تفاصيل الواجب..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring" />
          <div className="grid grid-cols-2 gap-2">
            <select value={newHw.grade} onChange={e => setNewHw({ ...newHw, grade: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="">المرحلة</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={newHw.subject} onChange={e => setNewHw({ ...newHw, subject: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="">المادة</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">الموعد النهائي (اختياري)</Label>
            <Input type="date" value={newHw.due_date} onChange={e => setNewHw({ ...newHw, due_date: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={addHomework} size="sm" className="flex-1">حفظ</Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>إلغاء</Button>
          </div>
        </div>
      )}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {homeworkList.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-6">لا توجد واجبات</p>
        ) : homeworkList.map(hw => (
          <div key={hw.id} className="bg-background rounded-xl border border-border p-3 flex items-start justify-between">
            <div>
              <h4 className="font-bold text-sm">{hw.title}</h4>
              <p className="text-xs text-muted-foreground">{hw.grade} · {hw.subject}</p>
              {hw.due_date && <p className="text-xs text-muted-foreground">الموعد: {new Date(hw.due_date).toLocaleDateString("ar-EG")}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteHomework(hw.id)} className="text-destructive h-7 w-7">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Admin Submissions Tab Component
const AdminSubmissionsTab = ({ toast }: { toast: any }) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [scoreValue, setScoreValue] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    // Get homework submissions
    const { data: hwSubs } = await supabase.from("homework_submissions").select("*").order("submitted_at", { ascending: false });
    if (hwSubs && hwSubs.length > 0) {
      const userIds = [...new Set(hwSubs.map((s: any) => s.user_id))];
      const hwIds = [...new Set(hwSubs.map((s: any) => s.homework_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, grade").in("user_id", userIds);
      const { data: homeworks } = await supabase.from("homework").select("id, title").in("id", hwIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const hwMap = new Map(homeworks?.map(h => [h.id, h]) || []);
      setSubmissions(hwSubs.map((s: any) => ({
        ...s,
        student_name: profileMap.get(s.user_id)?.full_name || "غير معروف",
        student_grade: profileMap.get(s.user_id)?.grade || "",
        homework_title: hwMap.get(s.homework_id)?.title || "",
        type: "homework",
      })));
    } else {
      setSubmissions([]);
    }
    setLoading(false);
  };

  const submitFeedback = async () => {
    if (!selectedSub) return;
    const updates: any = {};
    if (feedbackText) updates.feedback = feedbackText;
    if (scoreValue) updates.score = parseInt(scoreValue);
    await supabase.from("homework_submissions").update(updates).eq("id", selectedSub.id);
    toast({ title: "تم حفظ التقييم" });
    setSelectedSub(null);
    setFeedbackText("");
    setScoreValue("");
    fetchSubmissions();
  };

  if (loading) return <p className="text-center text-muted-foreground py-6">جاري التحميل...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4" /> حلول الطلاب</h3>
        <Button variant="outline" size="sm" onClick={fetchSubmissions} className="gap-1 h-7"><RefreshCw className="w-3 h-3" /> تحديث</Button>
      </div>

      {selectedSub && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedSub(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1">{selectedSub.homework_title}</h3>
            <p className="text-xs text-muted-foreground mb-3">الطالب: {selectedSub.student_name} - {selectedSub.student_grade}</p>
            {selectedSub.content && (
              <div className="bg-muted rounded-lg p-3 mb-3">
                <p className="text-sm">{selectedSub.content}</p>
              </div>
            )}
            {selectedSub.image_urls && selectedSub.image_urls.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium">صور الحل:</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedSub.image_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} className="w-full rounded-lg border border-border" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <Label className="text-sm">الدرجة</Label>
                <Input type="number" value={scoreValue} onChange={e => setScoreValue(e.target.value)} placeholder="أدخل الدرجة" />
              </div>
              <div>
                <Label className="text-sm">ملاحظات</Label>
                <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="ملاحظاتك على الحل..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex gap-2">
                <Button onClick={submitFeedback} className="flex-1">حفظ التقييم</Button>
                <Button variant="outline" onClick={() => setSelectedSub(null)}>إغلاق</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-6">لا توجد حلول بعد</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {submissions.map(s => (
            <div key={s.id} className="bg-background rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setSelectedSub(s); setFeedbackText(s.feedback || ""); setScoreValue(s.score?.toString() || ""); }}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm">{s.homework_title}</h4>
                  <p className="text-xs text-muted-foreground">{s.student_name} - {s.student_grade}</p>
                  <p className="text-xs text-muted-foreground">{new Date(s.submitted_at).toLocaleDateString("ar-EG")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.image_urls?.length > 0 && <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                  {s.score !== null ? (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{s.score} درجة</span>
                  ) : (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">لم يُقيّم</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Admin Leaderboard Tab Component
const AdminLeaderboardTab = () => {
  const [entries, setEntries] = useState<{ user_id: string; full_name: string; grade: string; total_points: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data: points } = await supabase.from("student_points").select("user_id, points");
      if (!points || points.length === 0) { setLoading(false); return; }

      const pointMap: Record<string, number> = {};
      points.forEach((p: any) => { pointMap[p.user_id] = (pointMap[p.user_id] || 0) + p.points; });

      const userIds = Object.keys(pointMap);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, grade").in("user_id", userIds);

      const leaderboard = (profiles || []).map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        grade: p.grade,
        total_points: pointMap[p.user_id] || 0,
      })).sort((a: any, b: any) => b.total_points - a.total_points);

      setEntries(leaderboard);
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  const filtered = filterGrade ? entries.filter(e => e.grade === filterGrade) : entries;

  if (loading) return <p className="text-center text-muted-foreground py-6">جاري التحميل...</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm flex items-center gap-2"><Trophy className="w-4 h-4" /> ترتيب الطلاب</h3>
      <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
        <option value="">جميع الصفوف</option>
        {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-6">لا توجد نقاط بعد</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((entry, i) => (
            <div key={entry.user_id} className={`bg-background rounded-xl border p-3 flex items-center gap-3 ${i < 3 ? "border-2 border-primary/30" : "border-border"}`}>
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{entry.full_name}</h4>
                <p className="text-xs text-muted-foreground">{entry.grade}</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-primary">{entry.total_points}</span>
                <p className="text-xs text-muted-foreground">نقطة</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Admin Grade Promotion Tab Component
const gradeOrder = [
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
];

const AdminPromoteTab = ({ toast }: { toast: any }) => {
  const [promoting, setPromoting] = useState(false);
  const [preview, setPreview] = useState<{ grade: string; count: number; nextGrade: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadPreview = async () => {
      const { data: profiles } = await supabase.from("profiles").select("grade");
      if (!profiles) return;
      const counts: Record<string, number> = {};
      profiles.forEach(p => { counts[p.grade] = (counts[p.grade] || 0) + 1; });
      const result = gradeOrder.slice(0, -1).map((g, i) => ({
        grade: g,
        count: counts[g] || 0,
        nextGrade: gradeOrder[i + 1],
      }));
      setPreview(result);
      setLoaded(true);
    };
    loadPreview();
  }, []);

  const promoteAll = async () => {
    if (!confirm("هل أنت متأكد من ترقية جميع الطلاب للصف التالي؟ هذا الإجراء لا يمكن التراجع عنه.")) return;
    setPromoting(true);
    try {
      // Promote in reverse order to avoid conflicts (highest grade first)
      for (let i = gradeOrder.length - 2; i >= 0; i--) {
        const currentGrade = gradeOrder[i];
        const nextGrade = gradeOrder[i + 1];
        await supabase.from("profiles").update({ grade: nextGrade }).eq("grade", currentGrade);
      }
      toast({ title: "تمت الترقية", description: "تم ترقية جميع الطلاب للصف التالي بنجاح" });
      // Reload preview
      const { data: profiles } = await supabase.from("profiles").select("grade");
      const counts: Record<string, number> = {};
      (profiles || []).forEach(p => { counts[p.grade] = (counts[p.grade] || 0) + 1; });
      setPreview(gradeOrder.slice(0, -1).map((g, i) => ({
        grade: g, count: counts[g] || 0, nextGrade: gradeOrder[i + 1],
      })));
    } catch (err) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الترقية", variant: "destructive" });
    }
    setPromoting(false);
  };

  if (!loaded) return <p className="text-center text-muted-foreground py-6">جاري التحميل...</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4" /> ترقية الصفوف الدراسية</h3>
      <p className="text-xs text-muted-foreground">ترقية جميع الطلاب للصف الدراسي التالي (مثلاً: أولى إعدادي ← ثانية إعدادي). طلاب الصف الثالث الثانوي لن يتأثروا.</p>
      
      <div className="space-y-2">
        {preview.map(p => (
          <div key={p.grade} className="bg-muted rounded-lg p-3 flex items-center justify-between text-sm">
            <div>
              <span className="font-bold">{p.grade}</span>
              <span className="text-muted-foreground mx-2">←</span>
              <span className="text-primary font-bold">{p.nextGrade}</span>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.count} طالب</span>
          </div>
        ))}
      </div>

      <Button onClick={promoteAll} disabled={promoting} className="w-full gap-2">
        {promoting ? (
          <><div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> جاري الترقية...</>
        ) : (
          <><ArrowRight className="w-4 h-4" /> ترقية جميع الطلاب للصف التالي</>
        )}
      </Button>
    </div>
  );
};


const AdminStudentReportTab = () => {
  const [reportGrade, setReportGrade] = useState("");
  const [reportStudents, setReportStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudentReport = async (grade: string) => {
    if (!grade) { setReportStudents([]); return; }
    setLoading(true);
    
    // Get profiles for this grade
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name, student_phone, parent_phone, school, governorate, madhab, is_subscribed, grade")
      .eq("grade", grade);
    
    if (!profs || profs.length === 0) { setReportStudents([]); setLoading(false); return; }
    
    const userIds = profs.map(p => p.user_id);
    
    // Fetch all data in parallel
    const [attemptsRes, hwSubsRes, viewsRes, pointsRes, vhSubsRes] = await Promise.all([
      supabase.from("exam_attempts").select("user_id, score, total, submitted_at, exam_id").in("user_id", userIds),
      supabase.from("homework_submissions").select("user_id, score, submitted_at, homework_id").in("user_id", userIds),
      supabase.from("video_views").select("user_id, video_id, viewed_at").in("user_id", userIds),
      supabase.from("student_points").select("user_id, points, reason, source_type").in("user_id", userIds),
      supabase.from("video_homework_submissions").select("user_id, score, total, submitted_at, homework_id").in("user_id", userIds),
    ]);
    
    const attempts = attemptsRes.data || [];
    const hwSubs = hwSubsRes.data || [];
    const views = viewsRes.data || [];
    const points = pointsRes.data || [];
    const vhSubs = vhSubsRes.data || [];
    
    // Build student reports
    const studentReports = profs.map(p => {
      const studentAttempts = attempts.filter(a => a.user_id === p.user_id);
      const studentHw = hwSubs.filter(h => h.user_id === p.user_id);
      const studentViews = views.filter(v => v.user_id === p.user_id);
      const studentPoints = points.filter(pt => pt.user_id === p.user_id);
      const studentVh = vhSubs.filter(v => v.user_id === p.user_id);
      const totalPoints = studentPoints.reduce((sum, pt) => sum + pt.points, 0);
      
      const totalExamScore = studentAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
      const totalExamMax = studentAttempts.reduce((sum, a) => sum + (a.total || 0), 0);
      const avgExamPercent = totalExamMax > 0 ? Math.round((totalExamScore / totalExamMax) * 100) : 0;
      
      const totalHwScore = studentHw.filter(h => h.score !== null).reduce((sum, h) => sum + (h.score || 0), 0);
      const hwGraded = studentHw.filter(h => h.score !== null).length;
      const avgHwScore = hwGraded > 0 ? Math.round(totalHwScore / hwGraded * 10) / 10 : 0;

      const vhCount = studentVh.length;
      const vhTotalScore = studentVh.reduce((sum, v) => sum + (v.score || 0), 0);
      const vhTotalMax = studentVh.reduce((sum, v) => sum + (v.total || 0), 0);
      const avgVhPercent = vhTotalMax > 0 ? Math.round((vhTotalScore / vhTotalMax) * 100) : 0;
      
      return {
        ...p,
        exams_count: studentAttempts.length,
        avg_exam_percent: avgExamPercent,
        total_exam_score: totalExamScore,
        total_exam_max: totalExamMax,
        homework_count: studentHw.length,
        hw_graded: hwGraded,
        avg_hw_score: avgHwScore,
        videos_watched: studentViews.length,
        total_points: totalPoints,
        vh_count: vhCount,
        vh_total_score: vhTotalScore,
        vh_total_max: vhTotalMax,
        avg_vh_percent: avgVhPercent,
        attempts: studentAttempts,
        hw_submissions: studentHw,
        vh_submissions: studentVh,
        views_list: studentViews,
        points_list: studentPoints,
      };
    });
    
    // Sort by total points desc
    studentReports.sort((a, b) => b.total_points - a.total_points);
    setReportStudents(studentReports);
    setLoading(false);
  };

  useEffect(() => {
    if (reportGrade) fetchStudentReport(reportGrade);
  }, [reportGrade]);

  const filtered = searchQuery
    ? reportStudents.filter(s => s.full_name.includes(searchQuery) || s.student_phone.includes(searchQuery))
    : reportStudents;

  const exportToExcel = () => {
    if (filtered.length === 0) return;
    
    const BOM = "\uFEFF";
    const headers = [
      "الترتيب", "الاسم", "الصف", "الهاتف", "ولي الأمر", "المدرسة", "المحافظة", "المذهب", "الاشتراك",
      "النقاط", "عدد الامتحانات", "متوسط الامتحانات %", "عدد الواجبات", "واجبات مُقيّمة", "متوسط الواجبات /10",
      "واجبات فيديو", "متوسط واجبات الفيديو %", "فيديوهات مشاهدة"
    ];
    
    const rows = filtered.map((s, i) => [
      i + 1,
      s.full_name,
      s.grade,
      s.student_phone,
      s.parent_phone || "",
      s.school || "",
      s.governorate || "",
      s.madhab || "",
      s.is_subscribed ? "مشترك" : "غير مشترك",
      s.total_points,
      s.exams_count,
      s.avg_exam_percent,
      s.homework_count,
      s.hw_graded,
      s.avg_hw_score,
      s.vh_count,
      s.avg_vh_percent,
      s.videos_watched,
    ]);
    
    const csvContent = BOM + [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `تقرير_الطلاب_${reportGrade}_${new Date().toLocaleDateString("ar-EG")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <UserCog className="w-4 h-4" /> تقرير أداء الطلاب التفصيلي
        </h3>
        <div className="flex gap-2">
          {reportGrade && filtered.length > 0 && (
            <Button size="sm" variant="outline" onClick={exportToExcel} className="gap-1 text-xs">
              <Download className="w-3.5 h-3.5" />
              تصدير Excel
            </Button>
          )}
          {reportGrade && (
            <Button size="sm" variant="outline" onClick={() => fetchStudentReport(reportGrade)} className="gap-1 text-xs">
              🔄 تحديث البيانات
            </Button>
          )}
        </div>
      </div>
      
      <select
        value={reportGrade}
        onChange={e => setReportGrade(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">اختر الصف الدراسي</option>
        {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
      </select>

      {reportGrade && (
        <div className="relative">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            className="pr-9"
          />
        </div>
      )}

      {loading && <p className="text-center text-muted-foreground text-sm py-6">جاري التحميل...</p>}

      {!loading && reportGrade && filtered.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-6">لا يوجد طلاب في هذا الصف</p>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">{selectedStudent.full_name}</h3>
                <p className="text-xs text-muted-foreground">{selectedStudent.grade}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info */}
            <div className="bg-muted rounded-xl p-3 mb-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">الهاتف:</span><span dir="ltr">{selectedStudent.student_phone}</span></div>
              {selectedStudent.parent_phone && <div className="flex justify-between"><span className="text-muted-foreground">ولي الأمر:</span><span dir="ltr">{selectedStudent.parent_phone}</span></div>}
              {selectedStudent.school && <div className="flex justify-between"><span className="text-muted-foreground">المدرسة:</span><span>{selectedStudent.school}</span></div>}
              {selectedStudent.governorate && <div className="flex justify-between"><span className="text-muted-foreground">المحافظة:</span><span>{selectedStudent.governorate}</span></div>}
              {selectedStudent.madhab && <div className="flex justify-between"><span className="text-muted-foreground">المذهب:</span><span>{selectedStudent.madhab}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">الاشتراك:</span><span className={selectedStudent.is_subscribed ? "text-primary font-bold" : "text-destructive"}>{selectedStudent.is_subscribed ? "✅ مشترك" : "❌ غير مشترك"}</span></div>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-muted rounded-xl p-3 text-center">
                <span className="text-2xl font-bold text-primary">{selectedStudent.total_points}</span>
                <p className="text-xs text-muted-foreground">نقطة</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <span className="text-2xl font-bold">{filtered.indexOf(selectedStudent) + 1}</span>
                <p className="text-xs text-muted-foreground">الترتيب</p>
              </div>
            </div>

            {/* Exams */}
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-1">📝 الامتحانات ({selectedStudent.exams_count})</h4>
              {selectedStudent.exams_count === 0 ? (
                <p className="text-xs text-muted-foreground">لم يدخل أي امتحان بعد</p>
              ) : (
                <div className="bg-muted rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>عدد الامتحانات:</span><span className="font-bold">{selectedStudent.exams_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>إجمالي الدرجات:</span><span className="font-bold">{selectedStudent.total_exam_score}/{selectedStudent.total_exam_max}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>متوسط النسبة:</span><span className="font-bold text-primary">{selectedStudent.avg_exam_percent}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Homework */}
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-1">📋 الواجبات ({selectedStudent.homework_count})</h4>
              {selectedStudent.homework_count === 0 ? (
                <p className="text-xs text-muted-foreground">لم يسلم أي واجب بعد</p>
              ) : (
                <div className="bg-muted rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>واجبات مسلمة:</span><span className="font-bold">{selectedStudent.homework_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>واجبات مُقيّمة:</span><span className="font-bold">{selectedStudent.hw_graded}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>متوسط الدرجة:</span><span className="font-bold text-primary">{selectedStudent.avg_hw_score}/10</span>
                  </div>
                </div>
              )}
            </div>

            {/* Videos */}
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-1">🎬 الفيديوهات</h4>
              <div className="bg-muted rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span>فيديوهات مشاهدة:</span><span className="font-bold">{selectedStudent.videos_watched}</span>
                </div>
              </div>
            </div>

            {/* Video Homework */}
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-1">📹 واجبات الفيديو ({selectedStudent.vh_count})</h4>
              {selectedStudent.vh_count === 0 ? (
                <p className="text-xs text-muted-foreground">لم يسلم أي واجب فيديو بعد</p>
              ) : (
                <div className="bg-muted rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>واجبات مسلمة:</span><span className="font-bold">{selectedStudent.vh_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>إجمالي الدرجات:</span><span className="font-bold">{selectedStudent.vh_total_score}/{selectedStudent.vh_total_max}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>متوسط النسبة:</span><span className="font-bold text-primary">{selectedStudent.avg_vh_percent}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Level */}
            <div>
              <h4 className="font-bold text-sm mb-2 flex items-center gap-1">🏆 المستوى</h4>
              <StudentLevelBadge points={selectedStudent.total_points} showProgress />
            </div>
          </div>
        </div>
      )}

      {/* Student List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map((s, i) => (
            <div
              key={s.user_id}
              className="bg-background rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedStudent(s)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{s.full_name}</h4>
                  <p className="text-xs text-muted-foreground">{s.student_phone} {s.parent_phone ? `• ولي الأمر: ${s.parent_phone}` : ""}</p>
                </div>
                <div className="text-left flex-shrink-0 space-y-0.5">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-primary font-bold">{s.total_points}</span>
                    <span className="text-muted-foreground">نقطة</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    <span>📝{s.exams_count}</span>
                    <span>📋{s.homework_count}</span>
                    <span>🎬{s.videos_watched}</span>
                  </div>
                </div>
              </div>
              {/* Quick stats bar */}
              <div className="mt-2 grid grid-cols-5 gap-1">
                <div className="bg-muted rounded-lg px-1 py-1 text-center">
                  <span className="text-[10px] text-muted-foreground block">امتحانات</span>
                  <span className="text-xs font-bold">{s.avg_exam_percent}%</span>
                </div>
                <div className="bg-muted rounded-lg px-1 py-1 text-center">
                  <span className="text-[10px] text-muted-foreground block">واجبات</span>
                  <span className="text-xs font-bold">{s.avg_hw_score}/10</span>
                </div>
                <div className="bg-muted rounded-lg px-1 py-1 text-center">
                  <span className="text-[10px] text-muted-foreground block">واجب فيديو</span>
                  <span className="text-xs font-bold">{s.avg_vh_percent}%</span>
                </div>
                <div className="bg-muted rounded-lg px-1 py-1 text-center">
                  <span className="text-[10px] text-muted-foreground block">فيديوهات</span>
                  <span className="text-xs font-bold">{s.videos_watched}</span>
                </div>
                <div className="bg-muted rounded-lg px-1 py-1 text-center">
                  <span className="text-[10px] text-muted-foreground block">اشتراك</span>
                  <span className="text-xs font-bold">{s.is_subscribed ? "✅" : "❌"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Contact Section Component for students
const ContactSection = ({ userId, toast }: { userId: string; toast: any }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!userId) return;
    setLoadingMessages(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
    setLoadingMessages(false);
    if (data) {
      const unread = data.filter(m => m.is_admin_reply && !m.is_read);
      if (unread.length > 0) {
        await supabase.from("messages").update({ is_read: true }).in("id", unread.map(m => m.id));
      }
    }
  };

  useEffect(() => {
    if (showChat) fetchMessages();
  }, [showChat, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      user_id: userId,
      content: newMessage.trim(),
      is_admin_reply: false,
    });
    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إرسال الرسالة", variant: "destructive" });
    } else {
      setNewMessage("");
      fetchMessages();
    }
    setSending(false);
  };

  return (
    <div className="mt-12 mb-8 max-w-2xl mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <MessageCircle className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold font-amiri mb-2">تواصل معنا</h2>
        <p className="text-sm text-muted-foreground mb-4">هل لديك استفسار أو تريد الإبلاغ عن مشكلة؟ تواصل معنا مباشرة</p>
        <Button onClick={() => setShowChat(!showChat)} className="gap-2">
          <MessageCircle className="w-4 h-4" />
          {showChat ? "إخفاء المحادثة" : "فتح المحادثة"}
        </Button>
      </div>

      {showChat && (
        <div className="mt-4 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/50">
            <h3 className="font-bold text-sm">المحادثة مع الإدارة</h3>
          </div>
          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {loadingMessages ? (
              <p className="text-center text-muted-foreground text-sm">جاري التحميل...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">لا توجد رسائل بعد. أرسل رسالتك الأولى!</p>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.is_admin_reply ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                    m.is_admin_reply ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                  }`}>
                    {m.is_admin_reply && <p className="text-xs font-bold mb-1 opacity-70">الإدارة</p>}
                    <p>{m.content}</p>
                    <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[40px] max-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon" className="h-10 w-10 flex-shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentPoints, setStudentPoints] = useState(0);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(() => sessionStorage.getItem("admin_selected_grade") || "");
  const [adminTab, setAdminTab] = useState<"subscribers" | "videos" | "notifications" | "exams" | "stats" | "homework" | "submissions" | "leaderboard" | "messages" | "student-report" | "promote">("subscribers");

  // Messages state (admin)
  const [msgConversations, setMsgConversations] = useState<{ user_id: string; student_name: string; student_grade: string; last_message: string; last_time: string; unread_count: number }[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [convoMessages, setConvoMessages] = useState<any[]>([]);
  const [adminReply, setAdminReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [selectedConvoName, setSelectedConvoName] = useState("");
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // Grade videos for admin preview
  const [gradeVideos, setGradeVideos] = useState<VideoItem[]>([]);
  // Grade homework for admin browsing
  const [gradeHomework, setGradeHomework] = useState<any[]>([]);

  // Admin data
  const [profiles, setProfiles] = useState<ProfileFull[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSubscription, setFilterSubscription] = useState("");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videoGrade, setVideoGrade] = useState("");
  const [videoSubject, setVideoSubject] = useState("");
  const [newVideo, setNewVideo] = useState({ title: "", description: "", grade: "", subject: "", madhab: "", access_type: "all", publish_at: "" });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoHomeworkEnabled, setVideoHomeworkEnabled] = useState(false);
  const [videoHomeworkDesc, setVideoHomeworkDesc] = useState("");
  const [videoHomeworkQuestions, setVideoHomeworkQuestions] = useState<{ question: string; options: string[]; correct: number }[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotif, setNewNotif] = useState({ title: "", body: "", target_audience: "all" as "all" | "subscribed" | "unsubscribed", target_grades: [] as string[] });
  const [adminViewSubscribed, setAdminViewSubscribed] = useState(true);

  // Exam admin state
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExam, setNewExam] = useState({ title: "", grade: "", subject: "", video_id: "", access_type: "all" });
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([{ question_text: "", question_type: "mcq", options: ["", "", "", ""], correct_answer: "" }]);

  // Exam results state
  const [viewingExamResults, setViewingExamResults] = useState<string | null>(null);
  const [examResults, setExamResults] = useState<ExamAttemptResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  
  // Exam answer grading state
  const [viewingAttemptAnswers, setViewingAttemptAnswers] = useState<string | null>(null);
  const [attemptAnswers, setAttemptAnswers] = useState<any[]>([]);
  const [attemptQuestions, setAttemptQuestions] = useState<any[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [essayScores, setEssayScores] = useState<Record<string, string>>({});

  // Admin stats
  const [statsData, setStatsData] = useState<{ totalViews: number; gradeStats: { grade: string; count: number }[]; topVideos: { title: string; views: number }[] } | null>(null);

  // Student notifications
  const [studentNotifs, setStudentNotifs] = useState<Notification[]>([]);
  const [studentExams, setStudentExams] = useState<ExamItem[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);
  const [personalNotifCount, setPersonalNotifCount] = useState(0);
  const badgeCounts = useBadgeCounts(user?.id || "", profile?.grade || "", profile?.is_subscribed || false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) { navigate("/auth/login"); return; }
      setUser(session.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth/login"); return; }
      setUser(session.user);
      fetchProfile(session.user.id);
      checkAdminRole(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, grade, madhab, is_subscribed, school, governorate")
      .eq("user_id", userId)
      .single();
    if (data) {
      setProfile(data);
      if (!sessionStorage.getItem("admin_selected_grade")) {
        setSelectedGrade(data.grade);
      }
      fetchStudentNotifications(data.grade, data.is_subscribed);
      fetchStudentExams(data.grade, data.is_subscribed);
    }
    setLoading(false);
    // Fetch unread personal notifications count
    const { count } = await supabase
      .from("student_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setPersonalNotifCount(count || 0);
    // Fetch student points for level
    const { data: pointsData } = await supabase.from("student_points").select("points").eq("user_id", userId);
    if (pointsData) {
      const total = pointsData.reduce((sum, p) => sum + p.points, 0);
      setStudentPoints(total);
    }
  };

  const fetchStudentNotifications = async (grade: string, isSubscribed: boolean) => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(10);
    if (data) {
      const filtered = data.filter(n => {
        // Filter by target audience
        if (n.target_audience === "subscribed" && !isSubscribed) return false;
        if (n.target_audience === "unsubscribed" && isSubscribed) return false;
        // Filter by target grades
        if (n.target_grades && n.target_grades.length > 0 && !n.target_grades.includes(grade)) return false;
        return true;
      });
      setStudentNotifs(filtered);
    }
  };

  const fetchStudentExams = async (grade: string, isSubscribed: boolean) => {
    const { data } = await supabase.from("exams").select("*").eq("grade", grade).order("created_at", { ascending: false });
    if (data) {
      const filtered = data.filter(e => {
        if (e.access_type === "subscribers_only" && !isSubscribed) return false;
        return true;
      });
      setStudentExams(filtered);
    }
  };

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin");
    if (data && data.length > 0) setIsAdmin(true);
  };

  const handleAdminLogin = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin", {
        body: { password: adminPassword },
      });
      if (error || !data?.success) {
        toast({ title: "خطأ", description: "كلمة المرور غير صحيحة", variant: "destructive" });
        return;
      }
      setAdminUnlocked(true);
      setShowAdminLogin(false);
      setAdminPassword("");
      toast({ title: "تم الدخول كأدمن" });
      fetchProfiles();
      // Fetch unread messages count
      const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("is_admin_reply", false).eq("is_read", false);
      setUnreadMsgCount(count || 0);
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ في التحقق", variant: "destructive" });
    }
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data);
  };

  const fetchVideos = async () => {
    let query = supabase.from("videos").select("*").order("created_at", { ascending: false });
    if (videoGrade) query = query.eq("grade", videoGrade);
    if (videoSubject) query = query.eq("subject", videoSubject);
    const { data } = await query;
    if (data) setVideos(data);
  };

  const fetchGradeVideos = async (grade: string) => {
    const { data } = await supabase.from("videos").select("*").eq("grade", grade).order("created_at", { ascending: false });
    if (data) setGradeVideos(data);
  };

  const fetchExamResults = async (examId: string) => {
    setLoadingResults(true);
    setViewingExamResults(examId);
    const { data: attempts } = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("exam_id", examId)
      .order("submitted_at", { ascending: false });
    if (attempts && attempts.length > 0) {
      const userIds = [...new Set(attempts.map(a => a.user_id))];
      const { data: studentProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, grade")
        .in("user_id", userIds);
      const profileMap = new Map(studentProfiles?.map(p => [p.user_id, p]) || []);
      setExamResults(attempts.map(a => ({
        ...a,
        student_name: profileMap.get(a.user_id)?.full_name || "غير معروف",
        student_grade: profileMap.get(a.user_id)?.grade || "",
      })));
    } else {
      setExamResults([]);
    }
    setLoadingResults(false);
  };

  const fetchAttemptAnswers = async (attemptId: string, examId: string) => {
    setLoadingAnswers(true);
    setViewingAttemptAnswers(attemptId);
    const { data: answers } = await supabase
      .from("exam_answers")
      .select("*")
      .eq("attempt_id", attemptId);
    const { data: questions } = await supabase
      .from("exam_questions")
      .select("id, question_text, question_type, correct_answer, sort_order")
      .eq("exam_id", examId)
      .order("sort_order", { ascending: true });
    setAttemptAnswers(answers || []);
    setAttemptQuestions(questions || []);
    // Initialize essay scores
    const scores: Record<string, string> = {};
    (answers || []).forEach((a: any) => {
      const q = (questions || []).find((qq: any) => qq.id === a.question_id);
      if (q?.question_type === "essay" && a.is_correct !== null) {
        // Use existing score if any
      }
    });
    setEssayScores(scores);
    setLoadingAnswers(false);
  };

  const saveEssayGrades = async (attemptId: string) => {
    // Update each essay answer's is_correct based on score
    for (const [answerId, scoreStr] of Object.entries(essayScores)) {
      const score = parseInt(scoreStr);
      if (!isNaN(score)) {
        await supabase.from("exam_answers").update({ is_correct: score > 0 }).eq("id", answerId);
      }
    }
    
    // Recalculate total score for the attempt
    const { data: allAnswers } = await supabase.from("exam_answers").select("*").eq("attempt_id", attemptId);
    const attempt = examResults.find(r => r.id === attemptId);
    if (allAnswers && attempt) {
      // MCQ score stays the same, add essay points
      const { data: questions } = await supabase.from("exam_questions").select("id, question_type").eq("exam_id", viewingExamResults!);
      const qMap = new Map((questions || []).map((q: any) => [q.id, q]));
      
      let totalScore = 0;
      let totalQuestions = 0;
      for (const ans of allAnswers) {
        const q = qMap.get(ans.question_id);
        if (q) {
          totalQuestions++;
          if (q.question_type === "mcq" && ans.is_correct) totalScore++;
          else if (q.question_type === "essay") {
            const essayScore = essayScores[ans.id];
            if (essayScore) totalScore += parseInt(essayScore) > 0 ? 1 : 0;
          }
        }
      }
      
      await supabase.from("exam_attempts").update({ score: totalScore, total: totalQuestions }).eq("id", attemptId);
    }
    
    toast({ title: "تم حفظ التصحيح" });
    setViewingAttemptAnswers(null);
    if (viewingExamResults) fetchExamResults(viewingExamResults);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (data) setNotifications(data);
  };

  const fetchExams = async () => {
    const { data } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
    if (data) setExams(data);
  };

  const addExam = async () => {
    if (!newExam.title || !newExam.grade || !newExam.subject) {
      toast({ title: "خطأ", description: "أكمل جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    const validQuestions = examQuestions.filter(q => q.question_text.trim());
    if (validQuestions.length === 0) {
      toast({ title: "خطأ", description: "أضف سؤال واحد على الأقل", variant: "destructive" });
      return;
    }

    const { data: exam, error } = await supabase.from("exams").insert({
      title: newExam.title,
      grade: newExam.grade,
      subject: newExam.subject,
      video_id: newExam.video_id || null,
      access_type: newExam.access_type,
    }).select().single();

    if (error) { console.error("Insert exam error:", error); toast({ title: "خطأ", description: "حدث خطأ أثناء إنشاء الامتحان", variant: "destructive" }); return; }

    const questionsToInsert = validQuestions.map((q, i) => ({
      exam_id: exam.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.question_type === "mcq" ? q.options.filter(o => o.trim()) : null,
      correct_answer: q.question_type === "mcq" ? q.correct_answer : null,
      sort_order: i,
    }));

    await supabase.from("exam_questions").insert(questionsToInsert);
    toast({ title: "تم إنشاء الامتحان بنجاح" });
    sendPushToGrade("📝 امتحان جديد", `تم إضافة امتحان جديد: ${newExam.title} - ${newExam.subject}`, [newExam.grade]);
    setNewExam({ title: "", grade: "", subject: "", video_id: "", access_type: "all" });
    setExamQuestions([{ question_text: "", question_type: "mcq", options: ["", "", "", ""], correct_answer: "" }]);
    setShowAddExam(false);
    fetchExams();
  };

  const deleteExam = async (id: string) => {
    await supabase.from("exams").delete().eq("id", id);
    fetchExams();
    toast({ title: "تم حذف الامتحان" });
  };

  const addQuestion = () => {
    setExamQuestions(prev => [...prev, { question_text: "", question_type: "mcq", options: ["", "", "", ""], correct_answer: "" }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setExamQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (index: number) => {
    if (examQuestions.length <= 1) return;
    setExamQuestions(prev => prev.filter((_, i) => i !== index));
  };

  // Fetch videos and homework when grade changes (for admin)
  const fetchGradeHomework = async (grade: string) => {
    const { data } = await supabase.from("homework").select("*").eq("grade", grade).order("created_at", { ascending: false });
    if (data) setGradeHomework(data);
    else setGradeHomework([]);
  };

  useEffect(() => {
    if (isAdmin && selectedGrade) {
      fetchGradeVideos(selectedGrade);
      fetchGradeHomework(selectedGrade);
    }
  }, [isAdmin, selectedGrade]);

  const fetchAdminStats = async () => {
    const { data: views } = await supabase.from("video_views").select("video_id, viewed_at");
    const { data: allVideos } = await supabase.from("videos").select("id, title, grade");
    if (views && allVideos) {
      const videoMap = new Map(allVideos.map(v => [v.id, v]));
      const gradeCounts: Record<string, number> = {};
      const videoCounts: Record<string, number> = {};
      views.forEach(v => {
        const vid = videoMap.get(v.video_id);
        if (vid) {
          gradeCounts[vid.grade] = (gradeCounts[vid.grade] || 0) + 1;
          videoCounts[vid.id] = (videoCounts[vid.id] || 0) + 1;
        }
      });
      const topVideos = Object.entries(videoCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id, count]) => ({ title: videoMap.get(id)?.title || "", views: count }));
      const gradeStats = Object.entries(gradeCounts).map(([grade, count]) => ({ grade: grade.replace("الصف ", ""), count }));
      setStatsData({ totalViews: views.length, gradeStats, topVideos });
    }
  };

  const fetchAdminMessages = async () => {
    setMsgLoading(true);
    const { data: allMessages } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    if (!allMessages) { setMsgLoading(false); return; }
    const userIds = [...new Set(allMessages.map(m => m.user_id))];
    const { data: profilesData } = userIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name, grade").in("user_id", userIds)
      : { data: [] };
    const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));
    const grouped: Record<string, any[]> = {};
    allMessages.forEach(m => { if (!grouped[m.user_id]) grouped[m.user_id] = []; grouped[m.user_id].push(m); });
    const convos: typeof msgConversations = [];
    Object.entries(grouped).forEach(([uid, msgs]) => {
      const profile = profileMap.get(uid);
      const sortedMsgs = msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const unread = msgs.filter(m => !m.is_admin_reply && !m.is_read).length;
      convos.push({ user_id: uid, student_name: profile?.full_name || "غير معروف", student_grade: profile?.grade || "", last_message: sortedMsgs[0]?.content || "", last_time: sortedMsgs[0]?.created_at || "", unread_count: unread });
    });
    convos.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
    setMsgConversations(convos);
    setMsgLoading(false);
    setUnreadMsgCount(convos.reduce((sum, c) => sum + c.unread_count, 0));
  };

  const openAdminConversation = async (userId: string, name: string) => {
    setSelectedConvo(userId);
    setSelectedConvoName(name);
    const { data } = await supabase.from("messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    if (data) setConvoMessages(data);
    await supabase.from("messages").update({ is_read: true }).eq("user_id", userId).eq("is_admin_reply", false);
  };

  const sendAdminReplyDash = async () => {
    if (!adminReply.trim() || !selectedConvo) return;
    setSendingReply(true);
    await supabase.from("messages").insert({ user_id: selectedConvo, content: adminReply.trim(), is_admin_reply: true });
    setAdminReply("");
    const { data } = await supabase.from("messages").select("*").eq("user_id", selectedConvo).order("created_at", { ascending: true });
    if (data) setConvoMessages(data);
    setSendingReply(false);
    fetchAdminMessages();
  };

  useEffect(() => {
    if (adminUnlocked) {
      if (adminTab === "videos") fetchVideos();
      if (adminTab === "notifications") fetchNotifications();
      if (adminTab === "exams") fetchExams();
      if (adminTab === "stats") fetchAdminStats();
      if (adminTab === "messages") fetchAdminMessages();
    }
  }, [adminTab, videoGrade, videoSubject, adminUnlocked]);

  const toggleSubscription = async (p: ProfileFull) => {
    const newPrice = p.grade.includes("إعدادي") ? 150 : 200;
    const isActivating = !p.is_subscribed;
    const expiresAt = isActivating
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    await supabase.from("profiles").update({
      is_subscribed: isActivating,
      subscription_price: isActivating ? newPrice : 0,
      subscription_expires_at: expiresAt,
    }).eq("id", p.id);
    // Send notification to student
    await supabase.from("student_notifications").insert({
      user_id: p.user_id,
      title: isActivating ? "تم تفعيل اشتراكك! 🎉" : "تم إلغاء اشتراكك",
      body: isActivating
        ? "تم تفعيل اشتراكك بنجاح. يمكنك الآن الوصول لجميع المحتوى التعليمي. الاشتراك صالح لمدة 30 يوم."
        : "تم إلغاء اشتراكك في المنصة.",
      type: isActivating ? "subscription_activated" : "subscription_expired",
    });
    fetchProfiles();
    toast({ title: isActivating ? "تم تفعيل الاشتراك وإشعار الطالب" : "تم إلغاء الاشتراك وإشعار الطالب" });
  };

  const deleteProfile = async (id: string) => {
    await supabase.from("profiles").delete().eq("id", id);
    fetchProfiles();
    toast({ title: "تم حذف الطالب" });
  };

  const addVideo = async () => {
    if (!newVideo.title || !videoFile || !newVideo.grade || !newVideo.subject) {
      toast({ title: "خطأ", description: "أكمل جميع الحقول المطلوبة وارفع الفيديو", variant: "destructive" });
      return;
    }

    if (newVideo.subject === "الفقه" && !newVideo.madhab) {
      toast({ title: "خطأ", description: "اختر المذهب الفقهي لفيديوهات الفقه", variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const fileExt = videoFile.name.split('.').pop();
    const filePath = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload with progress tracking using XMLHttpRequest
    const { data: { session } } = await supabase.auth.getSession();
    const uploadResult = await new Promise<{ error: any }>((resolve) => {
      const xhr = new XMLHttpRequest();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      xhr.open("POST", `${supabaseUrl}/storage/v1/object/videos/${filePath}`);
      xhr.setRequestHeader("Authorization", `Bearer ${session?.access_token || ""}`);
      xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
      xhr.setRequestHeader("x-upsert", "false");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ error: null });
        } else {
          resolve({ error: new Error(`Upload failed: ${xhr.status}`) });
        }
      };
      xhr.onerror = () => resolve({ error: new Error("Upload failed") });
      xhr.send(videoFile);
    });

    if (uploadResult.error) {
      toast({ title: "خطأ في رفع الفيديو", description: "حدث خطأ أثناء رفع الفيديو", variant: "destructive" });
      setUploading(false);
      setUploadProgress(0);
      return;
    }

    const { data: urlData } = supabase.storage.from("videos").getPublicUrl(filePath);
    const insertData: any = {
      title: newVideo.title,
      description: newVideo.description,
      grade: newVideo.grade,
      subject: newVideo.subject,
      access_type: newVideo.access_type,
      video_url: urlData.publicUrl,
    };

    if (newVideo.subject === "الفقه") {
      insertData.madhab = newVideo.madhab;
    }

    if (newVideo.publish_at) insertData.publish_at = new Date(newVideo.publish_at).toISOString();

    const { data: insertedVideo, error } = await supabase.from("videos").insert(insertData).select("id").single();
    if (error) {
      console.error("Insert video error:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة الفيديو", variant: "destructive" });
    } else {
      // Add homework if enabled
      if (videoHomeworkEnabled && insertedVideo) {
        await supabase.from("video_homework" as any).insert({
          video_id: insertedVideo.id,
          description: videoHomeworkDesc || null,
          questions: videoHomeworkQuestions,
        } as any);
      }
      toast({ title: "تم إضافة الفيديو بنجاح" });
      setNewVideo({ title: "", description: "", grade: "", subject: "", madhab: "", access_type: "all", publish_at: "" });
      setVideoFile(null);
      setVideoHomeworkEnabled(false);
      setVideoHomeworkDesc("");
      setVideoHomeworkQuestions([]);
      setShowAddVideo(false);
      fetchVideos();
      fetchGradeVideos(selectedGrade);
    }

    setUploading(false);
    setUploadProgress(0);
  };

  const deleteVideo = async (id: string) => {
    await supabase.from("videos").delete().eq("id", id);
    fetchVideos();
    fetchGradeVideos(selectedGrade);
    toast({ title: "تم حذف الفيديو" });
  };

  const sendNotification = async () => {
    if (!newNotif.title || !newNotif.body) {
      toast({ title: "خطأ", description: "أدخل عنوان ونص الإشعار", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("notifications").insert({
      title: newNotif.title, body: newNotif.body,
      target_audience: newNotif.target_audience,
      target_grades: newNotif.target_grades,
    });
    if (error) { console.error("Insert notification error:", error); toast({ title: "خطأ", description: "حدث خطأ أثناء إرسال الإشعار", variant: "destructive" }); }
    else {
      // Also send push notification
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
          const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              title: newNotif.title,
              body: newNotif.body,
              target_audience: newNotif.target_audience === "subscribed" ? "subscribers" : newNotif.target_audience === "unsubscribed" ? "non_subscribers" : "all",
              target_grades: newNotif.target_grades.length > 0 ? newNotif.target_grades : undefined,
            }),
          });
          const pushResult = await resp.json();
          if (pushResult.sent > 0) {
            toast({ title: `تم إرسال الإشعار + ${pushResult.sent} إشعار Push` });
          } else {
            toast({ title: "تم إرسال الإشعار" });
          }
        }
      } catch (pushErr) {
        console.error("Push notification error:", pushErr);
        toast({ title: "تم إرسال الإشعار (بدون Push)" });
      }
      setNewNotif({ title: "", body: "", target_audience: "all", target_grades: [] });
      fetchNotifications();
    }
  };

  const toggleGradeTarget = (grade: string) => {
    setNewNotif(prev => ({
      ...prev,
      target_grades: prev.target_grades.includes(grade) ? prev.target_grades.filter(g => g !== grade) : [...prev.target_grades, grade],
    }));
  };

  const filteredProfiles = profiles.filter(p => {
    if (searchQuery && !p.full_name.includes(searchQuery) && !p.student_phone.includes(searchQuery)) return false;
    if (filterGrade && p.grade !== filterGrade) return false;
    if (filterSubscription === "subscribed" && !p.is_subscribed) return false;
    if (filterSubscription === "unsubscribed" && p.is_subscribed) return false;
    return true;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayGrade = isAdmin ? selectedGrade : (profile?.grade || "");
  const subjects = gradeSubjects[displayGrade] || [];
  const subscriptionPrice = displayGrade?.includes("إعدادي") ? 150 : 200;
  const totalStudents = profiles.length;
  const subscribedCount = profiles.filter(p => p.is_subscribed).length;
  const unsubscribedCount = profiles.filter(p => !p.is_subscribed).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">منصة الأستاذ إسماعيل</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && !adminUnlocked && (
              <Button variant="ghost" size="sm" onClick={() => setShowAdminLogin(true)} className="gap-1">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">لوحة التحكم</span>
              </Button>
            )}
            {isAdmin && adminUnlocked && (
              <Button variant="ghost" size="sm" onClick={() => setAdminUnlocked(false)} className="gap-1 text-primary">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">إغلاق لوحة التحكم</span>
              </Button>
            )}
            {!adminUnlocked && (
              <>
                <Link to="/student-notifications" className="relative">
                  <Button variant="ghost" size="sm">
                    <Bell className="w-4 h-4" />
                    {personalNotifCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {personalNotifCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 ml-1" />
                    <span className="hidden sm:inline">الملف الشخصي</span>
                  </Button>
                </Link>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Password Dialog */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowAdminLogin(false)}>
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-bold font-amiri text-lg">دخول لوحة التحكم</h2>
              <p className="text-xs text-muted-foreground mt-1">أدخل كلمة مرور الأدمن</p>
            </div>
            <div className="space-y-3">
              <Input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="كلمة مرور الأدمن"
                onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
              />
              <Button onClick={handleAdminLogin} className="w-full gap-2">
                <Shield className="w-4 h-4" />
                دخول
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Admin: Grade Switcher - always visible for admin */}
        {isAdmin && (
          <div className="mb-6">
            {/* Grade tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {allGrades.map(g => (
                <button
                  key={g}
                  onClick={() => { setSelectedGrade(g); sessionStorage.setItem("admin_selected_grade", g); }}
                  className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex-shrink-0 ${
                    selectedGrade === g
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {g.replace("الصف ", "")}
                </button>
              ))}
            </div>

          </div>
        )}

        {/* Admin Homework Overview per Grade */}
        {isAdmin && adminUnlocked && selectedGrade && (
          <div className="mb-6">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-primary" />
              واجبات {selectedGrade.replace("الصف ", "")} ({gradeHomework.length})
            </h3>
            {gradeHomework.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا توجد واجبات لهذا الصف</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {gradeHomework.map(hw => (
                  <div key={hw.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{hw.title}</h4>
                      <p className="text-xs text-muted-foreground">{hw.subject}</p>
                      {hw.due_date && <p className="text-[10px] text-muted-foreground">الموعد: {new Date(hw.due_date).toLocaleDateString("ar-EG")}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Panel (when unlocked) */}
        {isAdmin && adminUnlocked && (
          <div className="mb-8">
            {/* Admin Tabs */}
            <div className="flex gap-2 mb-4 justify-center flex-wrap">
              {[
                { key: "subscribers" as const, label: "المشتركين", icon: Users },
                { key: "videos" as const, label: "الفيديوهات", icon: Video },
                { key: "exams" as const, label: "الامتحانات", icon: FileText },
                { key: "homework" as const, label: "الواجبات", icon: ClipboardList },
                { key: "submissions" as const, label: "الحلول", icon: ImageIcon },
                { key: "notifications" as const, label: "الإشعارات", icon: Bell },
                { key: "leaderboard" as const, label: "ترتيب الطلاب", icon: Trophy },
                { key: "student-report" as const, label: "تقرير الطلاب", icon: UserCog },
                { key: "promote" as const, label: "ترقية الصفوف", icon: ArrowRight },
                { key: "messages" as const, label: "الشكاوى والاقتراحات", icon: MessageCircle },
              ].map(t => (
                <Button key={t.key} variant={adminTab === t.key ? "default" : "outline"} size="sm" onClick={() => setAdminTab(t.key)} className={`gap-1 relative ${t.key === "messages" && unreadMsgCount > 0 && adminTab !== "messages" ? "border-destructive text-destructive" : ""}`}>
                  <t.icon className="w-4 h-4" />
                  {t.label}
                  {t.key === "messages" && unreadMsgCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMsgCount}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            {/* Admin Content */}
            <div className="bg-card rounded-2xl border-2 border-primary/20 p-4">
              {/* Subscribers */}
              {adminTab === "subscribers" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted rounded-xl p-3 text-center">
                      <span className="text-xl font-bold">{totalStudents}</span>
                      <p className="text-xs text-muted-foreground">إجمالي</p>
                    </div>
                    <div className="bg-muted rounded-xl p-3 text-center">
                      <span className="text-xl font-bold text-primary">{subscribedCount}</span>
                      <p className="text-xs text-muted-foreground">مشترك</p>
                    </div>
                    <div className="bg-muted rounded-xl p-3 text-center">
                      <span className="text-xl font-bold text-destructive">{unsubscribedCount}</span>
                      <p className="text-xs text-muted-foreground">غير مشترك</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث بالاسم أو الرقم..." />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        <option value="">كل الصفوف</option>
                        {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <select value={filterSubscription} onChange={e => setFilterSubscription(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        <option value="">الكل</option>
                        <option value="subscribed">مشترك</option>
                        <option value="unsubscribed">غير مشترك</option>
                      </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchProfiles} className="gap-1">
                      <RefreshCw className="w-3 h-3" /> تحديث
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">عرض {filteredProfiles.length} من {totalStudents}</p>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredProfiles.map(p => (
                      <div key={p.id} className="bg-background rounded-xl border border-border p-3">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-bold text-sm">{p.full_name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_subscribed ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                            {p.is_subscribed ? "مشترك" : "غير مشترك"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>{p.grade}</p>
                          {p.school && <p>{p.school} - {p.governorate}</p>}
                          <p>{p.student_phone}</p>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={() => deleteProfile(p.id)} className="text-destructive h-7 px-2">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant={p.is_subscribed ? "outline" : "default"} onClick={() => toggleSubscription(p)} className="gap-1 flex-1 h-7">
                            {p.is_subscribed ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {p.is_subscribed ? "إلغاء" : "تفعيل"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {adminTab === "videos" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">إدارة الفيديوهات</h3>
                    <Button size="sm" onClick={() => setShowAddVideo(!showAddVideo)} className="gap-1">
                      <Plus className="w-3 h-3" /> إضافة
                    </Button>
                  </div>

                  {showAddVideo && (
                    <div className="bg-muted rounded-xl p-4 space-y-3">
                      <Input value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} placeholder="عنوان الفيديو" />
                      <Input value={newVideo.description} onChange={e => setNewVideo({ ...newVideo, description: e.target.value })} placeholder="وصف (اختياري)" />
                      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2 w-full justify-start">
                        <Upload className="w-4 h-4" />
                        {videoFile ? videoFile.name : "اختر ملف الفيديو"}
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={newVideo.grade} onChange={e => setNewVideo({ ...newVideo, grade: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                          <option value="">المرحلة</option>
                          {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select
                          value={newVideo.subject}
                          onChange={e => setNewVideo({ ...newVideo, subject: e.target.value, madhab: e.target.value === "الفقه" ? newVideo.madhab : "" })}
                          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">المادة</option>
                          {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      {newVideo.subject === "الفقه" && (
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">المذهب الفقهي</Label>
                          <select
                            value={newVideo.madhab}
                            onChange={e => setNewVideo({ ...newVideo, madhab: e.target.value })}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">اختر المذهب</option>
                            {madhabOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">متاح لـ</Label>
                        <div className="flex gap-2">
                          <button onClick={() => setNewVideo({ ...newVideo, access_type: "all" })} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${newVideo.access_type === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>كل الطلاب</button>
                          <button onClick={() => setNewVideo({ ...newVideo, access_type: "subscribers_only" })} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${newVideo.access_type === "subscribers_only" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>المشتركين فقط</button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">موعد النشر (اختياري - اتركه فارغ للنشر فوراً)</Label>
                        <Input 
                          type="datetime-local" 
                          value={newVideo.publish_at} 
                          onChange={e => setNewVideo({ ...newVideo, publish_at: e.target.value })} 
                        />
                        {newVideo.publish_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            سيظهر للطلاب في: {new Date(newVideo.publish_at).toLocaleString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>

                      {/* Video Homework Section */}
                      <div className="border-t border-border pt-3 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={videoHomeworkEnabled}
                            onChange={e => setVideoHomeworkEnabled(e.target.checked)}
                            className="rounded border-input"
                          />
                          <Label className="text-xs cursor-pointer" onClick={() => setVideoHomeworkEnabled(!videoHomeworkEnabled)}>
                            إضافة واجب على الفيديو (لفتح الفيديو التالي)
                          </Label>
                        </div>

                        {videoHomeworkEnabled && (
                          <div className="space-y-2 bg-accent/30 rounded-lg p-3">
                            <Input
                              value={videoHomeworkDesc}
                              onChange={e => setVideoHomeworkDesc(e.target.value)}
                              placeholder="وصف الواجب (اختياري)"
                              className="text-xs"
                            />
                            <Label className="text-xs">أسئلة اختيار من متعدد</Label>
                            {videoHomeworkQuestions.map((q, qi) => (
                              <div key={qi} className="bg-card rounded-lg border border-border p-2 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold">سؤال {qi + 1}</span>
                                  <button className="text-destructive text-[10px]" onClick={() => setVideoHomeworkQuestions(prev => prev.filter((_, i) => i !== qi))}>حذف</button>
                                </div>
                                <Input
                                  value={q.question}
                                  onChange={e => {
                                    const u = [...videoHomeworkQuestions];
                                    u[qi].question = e.target.value;
                                    setVideoHomeworkQuestions(u);
                                  }}
                                  placeholder="نص السؤال"
                                  className="text-xs h-8"
                                />
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-1.5">
                                    <input
                                      type="radio"
                                      name={`dash-q-${qi}`}
                                      checked={q.correct === oi}
                                      onChange={() => {
                                        const u = [...videoHomeworkQuestions];
                                        u[qi].correct = oi;
                                        setVideoHomeworkQuestions(u);
                                      }}
                                    />
                                    <Input
                                      value={opt}
                                      onChange={e => {
                                        const u = [...videoHomeworkQuestions];
                                        u[qi].options[oi] = e.target.value;
                                        setVideoHomeworkQuestions(u);
                                      }}
                                      placeholder={`الخيار ${oi + 1}`}
                                      className="text-xs h-7"
                                    />
                                    {q.options.length > 2 && (
                                      <button className="text-destructive text-[10px] px-1" onClick={() => {
                                        const u = [...videoHomeworkQuestions];
                                        u[qi].options = u[qi].options.filter((_, i) => i !== oi);
                                        if (u[qi].correct >= u[qi].options.length) u[qi].correct = 0;
                                        setVideoHomeworkQuestions(u);
                                      }}>✕</button>
                                    )}
                                  </div>
                                ))}
                                {q.options.length < 5 && (
                                  <button className="text-xs text-primary" onClick={() => {
                                    const u = [...videoHomeworkQuestions];
                                    u[qi].options.push("");
                                    setVideoHomeworkQuestions(u);
                                  }}>+ خيار</button>
                                )}
                              </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => setVideoHomeworkQuestions(prev => [...prev, { question: "", options: ["", ""], correct: 0 }])}>
                              + إضافة سؤال
                            </Button>
                          </div>
                        )}
                      </div>

                      {uploading && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>جاري رفع الفيديو...</span>
                            <span className="font-bold text-primary">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div
                              className="h-3 rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button onClick={addVideo} size="sm" className="flex-1" disabled={uploading}>
                          {uploading ? `جاري الرفع... ${uploadProgress}%` : "حفظ"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAddVideo(false)} disabled={uploading}>إلغاء</Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <select value={videoGrade} onChange={e => setVideoGrade(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="">كل المراحل</option>
                      {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select value={videoSubject} onChange={e => setVideoSubject(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="">كل المواد</option>
                      {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {videos.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-6">لا توجد فيديوهات</p>
                    ) : videos.map(v => (
                      <div key={v.id} className="bg-background rounded-xl border border-border p-3 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm">{v.title}</h4>
                            {v.madhab && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                                {v.madhab}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{v.grade} · {v.subject} · {v.access_type === "subscribers_only" ? "للمشتركين فقط" : "للكل"}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteVideo(v.id)} className="text-destructive h-7 w-7">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications */}
              {adminTab === "notifications" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Send className="w-4 h-4" /> إرسال إشعار جديد
                  </h3>
                  <Input value={newNotif.title} onChange={e => setNewNotif({ ...newNotif, title: e.target.value })} placeholder="عنوان الإشعار" />
                  <textarea
                    value={newNotif.body}
                    onChange={e => setNewNotif({ ...newNotif, body: e.target.value })}
                    placeholder="محتوى الإشعار..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">استهداف حسب الاشتراك</Label>
                    <div className="flex gap-2 mb-3">
                      {[
                        { value: "all" as const, label: "الكل" },
                        { value: "subscribed" as const, label: "المشتركين فقط" },
                        { value: "unsubscribed" as const, label: "غير المشتركين فقط" },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setNewNotif({ ...newNotif, target_audience: opt.value })}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${newNotif.target_audience === opt.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">الصفوف المستهدفة (اتركها فارغة للجميع)</Label>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {allGrades.map(g => (
                        <label key={g} className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" checked={newNotif.target_grades.includes(g)} onChange={() => toggleGradeTarget(g)} className="rounded" />
                          {g}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button onClick={sendNotification} className="w-full gap-2" size="sm">
                    <Send className="w-4 h-4" /> إرسال
                  </Button>

                  <div className="border-t border-border pt-4 space-y-2 max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">الإشعارات السابقة</h4>
                      <Button variant="outline" size="sm" onClick={fetchNotifications} className="gap-1 h-7">
                        <RefreshCw className="w-3 h-3" /> تحديث
                      </Button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-4">لا توجد إشعارات</p>
                    ) : notifications.map(n => (
                      <div key={n.id} className="bg-background rounded-xl border border-border p-3 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-xs">{n.title}</h4>
                          <p className="text-xs text-muted-foreground">{n.body}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {n.target_audience === "subscribed" ? "المشتركين" : n.target_audience === "unsubscribed" ? "غير المشتركين" : "الكل"}
                            {n.target_grades.length > 0 ? ` · ${n.target_grades.join("، ")}` : ""} · {new Date(n.created_at).toLocaleDateString("ar-EG")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={async () => {
                            const { error } = await supabase.from("notifications").delete().eq("id", n.id);
                            if (error) { toast({ title: "خطأ", description: "فشل حذف الإشعار", variant: "destructive" }); }
                            else { toast({ title: "تم حذف الإشعار" }); fetchNotifications(); }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exams */}
              {adminTab === "exams" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">إدارة الامتحانات</h3>
                    <Button size="sm" onClick={() => setShowAddExam(!showAddExam)} className="gap-1">
                      <Plus className="w-3 h-3" /> إضافة امتحان
                    </Button>
                  </div>

                  {showAddExam && (
                    <div className="bg-muted rounded-xl p-4 space-y-3">
                      <Input value={newExam.title} onChange={e => setNewExam({ ...newExam, title: e.target.value })} placeholder="عنوان الامتحان" />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={newExam.grade} onChange={e => setNewExam({ ...newExam, grade: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                          <option value="">المرحلة</option>
                          {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select value={newExam.subject} onChange={e => setNewExam({ ...newExam, subject: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                          <option value="">المادة</option>
                          {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">متاح لـ</Label>
                        <div className="flex gap-2">
                          <button onClick={() => setNewExam({ ...newExam, access_type: "all" })} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${newExam.access_type === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>كل الطلاب</button>
                          <button onClick={() => setNewExam({ ...newExam, access_type: "subscribers_only" })} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${newExam.access_type === "subscribers_only" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>المشتركين فقط</button>
                        </div>
                      </div>

                      <div className="border-t border-border pt-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-sm">الأسئلة</h4>
                          <Button size="sm" variant="outline" onClick={addQuestion} className="gap-1 h-7">
                            <Plus className="w-3 h-3" /> سؤال
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {examQuestions.map((q, i) => (
                            <div key={i} className="bg-background rounded-lg border border-border p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">سؤال {i + 1}</span>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={q.question_type}
                                    onChange={e => updateQuestion(i, "question_type", e.target.value)}
                                    className="rounded border border-input bg-background px-2 py-1 text-xs"
                                  >
                                    <option value="mcq">اختيار من متعدد</option>
                                    <option value="essay">مقالي</option>
                                  </select>
                                  {examQuestions.length > 1 && (
                                    <button onClick={() => removeQuestion(i)} className="text-destructive">
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <textarea
                                value={q.question_text}
                                onChange={e => updateQuestion(i, "question_text", e.target.value)}
                                placeholder="نص السؤال..."
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              {q.question_type === "mcq" && (
                                <div className="space-y-1">
                                  {q.options.map((opt, j) => (
                                    <div key={j} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`correct-${i}`}
                                        checked={q.correct_answer === opt && opt !== ""}
                                        onChange={() => updateQuestion(i, "correct_answer", opt)}
                                        className="accent-primary"
                                      />
                                      <Input
                                        value={opt}
                                        onChange={e => {
                                          const newOpts = [...q.options];
                                          newOpts[j] = e.target.value;
                                          updateQuestion(i, "options", newOpts);
                                          if (q.correct_answer === opt) updateQuestion(i, "correct_answer", e.target.value);
                                        }}
                                        placeholder={`الخيار ${j + 1}`}
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  ))}
                                  <p className="text-xs text-muted-foreground">اختر الإجابة الصحيحة بالضغط على الدائرة</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={addExam} size="sm" className="flex-1">حفظ الامتحان</Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAddExam(false)}>إلغاء</Button>
                      </div>
                    </div>
                  )}

                  {/* Exam Results View */}
                  {viewingExamResults && !viewingAttemptAnswers && (
                    <div className="bg-muted rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          نتائج: {exams.find(e => e.id === viewingExamResults)?.title}
                        </h4>
                        <Button variant="outline" size="sm" onClick={() => setViewingExamResults(null)} className="h-7 text-xs">
                          رجوع
                        </Button>
                      </div>
                      {loadingResults ? (
                        <div className="flex justify-center py-6">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      ) : examResults.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-6">لا توجد نتائج بعد</p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          <div className="text-xs text-muted-foreground mb-2">عدد المحاولات: {examResults.length} - اضغط على الطالب لعرض إجاباته</div>
                          {examResults.map(r => (
                            <div
                              key={r.id}
                              className="bg-background rounded-lg border border-border p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                              onClick={() => fetchAttemptAnswers(r.id, viewingExamResults!)}
                            >
                              <div>
                                <p className="font-bold text-sm">{r.student_name}</p>
                                <p className="text-xs text-muted-foreground">{r.student_grade}</p>
                                <p className="text-xs text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-muted-foreground" />
                                <div className="text-center">
                                  <span className={`text-lg font-bold ${(r.score || 0) >= ((r.total || 1) * 0.5) ? "text-primary" : "text-destructive"}`}>
                                    {r.score || 0}/{r.total || 0}
                                  </span>
                                  <p className="text-xs text-muted-foreground">{r.total ? Math.round(((r.score || 0) / r.total) * 100) : 0}%</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Viewing a specific attempt's answers */}
                  {viewingAttemptAnswers && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setViewingAttemptAnswers(null)}>
                      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-lg">إجابات الطالب</h3>
                          <Button variant="ghost" size="sm" onClick={() => setViewingAttemptAnswers(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {loadingAnswers ? (
                          <div className="flex justify-center py-6">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {attemptQuestions.map((q: any, i: number) => {
                              const ans = attemptAnswers.find((a: any) => a.question_id === q.id);
                              const isEssay = q.question_type === "essay";
                              return (
                                <div key={q.id} className={`rounded-xl border p-4 ${isEssay ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}>
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="text-xs font-bold text-muted-foreground">{i + 1}.</span>
                                    <div className="flex-1">
                                      <p className="font-bold text-sm">{q.question_text}</p>
                                      <span className="text-xs text-muted-foreground">
                                        ({isEssay ? "مقالي" : "اختيار من متعدد"})
                                      </span>
                                    </div>
                                  </div>

                                  {/* Student's answer */}
                                  {ans?.answer && (
                                    <div className="bg-muted rounded-lg p-3 mb-2">
                                      <p className="text-xs font-medium mb-1">إجابة الطالب:</p>
                                      <p className="text-sm">{ans.answer}</p>
                                    </div>
                                  )}

                                  {/* Student's images */}
                                  {ans?.image_urls && ans.image_urls.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-xs font-medium mb-1">صور الحل:</p>
                                      <div className="grid grid-cols-2 gap-2">
                                        {ans.image_urls.map((url: string, j: number) => (
                                          <a key={j} href={url} target="_blank" rel="noopener noreferrer">
                                            <img src={url} className="w-full rounded-lg border border-border" alt={`صورة ${j + 1}`} />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* MCQ result */}
                                  {!isEssay && (
                                    <div className={`flex items-center gap-2 text-xs ${ans?.is_correct ? "text-green-600" : "text-destructive"}`}>
                                      {ans?.is_correct ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                      {ans?.is_correct ? "إجابة صحيحة" : `خطأ - الصحيح: ${q.correct_answer}`}
                                    </div>
                                  )}

                                  {/* Essay grading */}
                                  {isEssay && ans && (
                                    <div className="mt-2 border-t border-border pt-2">
                                      <label className="text-xs font-medium block mb-1">تقييم السؤال المقالي:</label>
                                      <div className="flex items-center gap-2">
                                        <select
                                          value={essayScores[ans.id] || ""}
                                          onChange={e => setEssayScores(prev => ({ ...prev, [ans.id]: e.target.value }))}
                                          className="rounded-lg border border-input bg-background px-3 py-2 text-sm flex-1"
                                        >
                                          <option value="">لم يُقيّم</option>
                                          <option value="0">0 - غير صحيح</option>
                                          <option value="1">1 - صحيح</option>
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Save button */}
                            {attemptQuestions.some((q: any) => q.question_type === "essay") && (
                              <Button onClick={() => saveEssayGrades(viewingAttemptAnswers!)} className="w-full gap-2">
                                <CheckCircle className="w-4 h-4" /> حفظ التصحيح
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {exams.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-6">لا توجد امتحانات</p>
                    ) : exams.map(e => (
                      <div key={e.id} className="bg-background rounded-xl border border-border p-3 flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm">{e.title}</h4>
                          <p className="text-xs text-muted-foreground">{e.grade} · {e.subject}</p>
                          <p className="text-xs text-muted-foreground">{e.access_type === "subscribers_only" ? "للمشتركين فقط" : "لكل الطلاب"}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" onClick={() => fetchExamResults(e.id)} className="h-7 w-7" title="عرض النتائج">
                            <BarChart3 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteExam(e.id)} className="text-destructive h-7 w-7">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Homework Admin */}
              {adminTab === "homework" && (
                <AdminHomeworkTab grades={allGrades} subjects={subjectsList} toast={toast} />
              )}

              {/* Submissions Admin */}
              {adminTab === "submissions" && (
                <AdminSubmissionsTab toast={toast} />
              )}

              {/* Leaderboard */}
              {adminTab === "leaderboard" && (
                <AdminLeaderboardTab />
              )}

              {/* Student Report */}
              {adminTab === "student-report" && (
                <AdminStudentReportTab />
              )}

              {/* Grade Promotion */}
              {adminTab === "promote" && (
                <AdminPromoteTab toast={toast} />
              )}

              {/* Messages Tab */}
              {adminTab === "messages" && (
                <div className="space-y-4">
                  {selectedConvo ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedConvo(null); fetchAdminMessages(); }} className="gap-1">
                            <ChevronLeft className="w-3 h-3" /> الرجوع
                          </Button>
                          <h3 className="font-bold text-sm">{selectedConvoName}</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1" onClick={async () => {
                          if (!confirm("هل أنت متأكد من حذف هذه المحادثة بالكامل؟")) return;
                          await supabase.from("messages").delete().eq("user_id", selectedConvo);
                          toast({ title: "تم حذف المحادثة" });
                          setSelectedConvo(null);
                          fetchAdminMessages();
                        }}>
                          <Trash2 className="w-3 h-3" /> حذف المحادثة
                        </Button>
                      </div>
                      <div className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="h-80 overflow-y-auto p-4 space-y-3">
                          {convoMessages.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm py-8">لا توجد رسائل</p>
                          ) : convoMessages.map(m => (
                            <div key={m.id} className={`flex ${m.is_admin_reply ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                                m.is_admin_reply ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                              }`}>
                                {m.is_admin_reply && <p className="text-xs font-bold mb-1 opacity-70">أنت (الإدارة)</p>}
                                <p>{m.content}</p>
                                <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 border-t border-border flex gap-2">
                          <textarea
                            value={adminReply}
                            onChange={e => setAdminReply(e.target.value)}
                            placeholder="اكتب ردك هنا..."
                            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[40px] max-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAdminReplyDash(); } }}
                          />
                          <Button onClick={sendAdminReplyDash} disabled={sendingReply || !adminReply.trim()} size="icon" className="h-10 w-10 flex-shrink-0">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold font-amiri flex items-center gap-2">
                          <MessageCircle className="w-5 h-5" /> رسائل الطلاب
                        </h2>
                        <Button variant="outline" size="sm" onClick={fetchAdminMessages} className="gap-1">
                          <RefreshCw className="w-3 h-3" /> تحديث
                        </Button>
                      </div>
                      {msgLoading ? (
                        <p className="text-center text-muted-foreground py-6">جاري التحميل...</p>
                      ) : msgConversations.length === 0 ? (
                        <div className="bg-card rounded-2xl border border-border p-8 text-center">
                          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">لا توجد رسائل بعد</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {msgConversations.map(c => (
                            <div
                              key={c.user_id}
                              onClick={() => openAdminConversation(c.user_id, c.student_name)}
                              className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary/50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm">{c.student_name}</h3>
                                    {c.unread_count > 0 && (
                                      <span className="bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{c.unread_count}</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{c.student_grade}</p>
                                  <p className="text-xs text-muted-foreground mt-1 truncate">{c.last_message}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(c.last_time).toLocaleDateString("ar-EG")}
                                  </span>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!confirm(`هل أنت متأكد من حذف محادثة ${c.student_name}؟`)) return;
                                      await supabase.from("messages").delete().eq("user_id", c.user_id);
                                      toast({ title: "تم حذف المحادثة" });
                                      fetchAdminMessages();
                                    }}
                                    className="text-destructive hover:text-destructive/80 p-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {adminTab === "stats" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> إحصائيات المنصة
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted rounded-xl p-3 text-center">
                      <span className="text-xl font-bold">{totalStudents}</span>
                      <p className="text-xs text-muted-foreground">طالب</p>
                    </div>
                    <div className="bg-muted rounded-xl p-3 text-center">
                      <span className="text-xl font-bold text-primary">{subscribedCount}</span>
                      <p className="text-xs text-muted-foreground">مشترك</p>
                    </div>
                    <div className="bg-muted rounded-xl p-3 text-center">
                      <span className="text-xl font-bold">{statsData?.totalViews || 0}</span>
                      <p className="text-xs text-muted-foreground">مشاهدة</p>
                    </div>
                  </div>

                  {statsData && statsData.gradeStats.length > 0 && (
                    <div className="bg-muted rounded-xl p-4">
                      <h4 className="font-bold text-xs mb-3">المشاهدات حسب الصف</h4>
                      <div className="space-y-2">
                        {statsData.gradeStats.map(g => (
                          <div key={g.grade} className="flex items-center gap-2">
                            <span className="text-xs w-32 truncate">{g.grade}</span>
                            <div className="flex-1 bg-background rounded-full h-4 overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${Math.min((g.count / (statsData.totalViews || 1)) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold w-8 text-left">{g.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {statsData && statsData.topVideos.length > 0 && (
                    <div className="bg-muted rounded-xl p-4">
                      <h4 className="font-bold text-xs mb-3">أكثر الفيديوهات مشاهدة</h4>
                      <div className="space-y-2">
                        {statsData.topVideos.map((v, i) => (
                          <div key={i} className="flex items-center justify-between bg-background rounded-lg p-2">
                            <span className="text-xs font-bold truncate flex-1">{i + 1}. {v.title}</span>
                            <span className="text-xs text-primary font-bold mr-2">{v.views} مشاهدة</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-muted rounded-xl p-4">
                    <h4 className="font-bold text-xs mb-3">الطلاب حسب الصف</h4>
                    <div className="space-y-2">
                      {allGrades.map(g => {
                        const count = profiles.filter(p => p.grade === g).length;
                        return count > 0 ? (
                          <div key={g} className="flex items-center justify-between bg-background rounded-lg p-2">
                            <span className="text-xs">{g.replace("الصف ", "")}</span>
                            <span className="text-xs font-bold">{count} طالب</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Student Notifications Banner */}
        {!adminUnlocked && studentNotifs.filter(n => !dismissedNotifs.includes(n.id)).length > 0 && (
          <div className="mb-6 space-y-2">
            {studentNotifs.filter(n => !dismissedNotifs.includes(n.id)).map(n => (
              <div key={n.id} className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-start gap-3">
                <Bell className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{n.title}</h4>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </div>
                <button onClick={() => setDismissedNotifs(prev => [...prev, n.id])} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Student View */}
        {!adminUnlocked && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-8 text-center">
          <h1 className="text-2xl font-bold font-amiri mb-2">أهلاً بك يا {profile?.full_name}</h1>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            مرحبًا بك في منصة الأستاذ إسماعيل أحمد عباده لتعليم أصول الدين والفقه الإسلامي
          </p>
          <div className="inline-block bg-muted rounded-xl p-4 text-sm space-y-1">
            <div className="font-bold">{profile?.full_name}</div>
            <div className="text-muted-foreground">{displayGrade}</div>
            {profile?.school && <div className="text-muted-foreground">{profile.school} - {profile.governorate}</div>}
            <div className="text-muted-foreground">{profile?.madhab}</div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <CheckCircle className={`w-4 h-4 ${profile?.is_subscribed ? "text-primary" : "text-muted-foreground"}`} />
              <span className={profile?.is_subscribed ? "text-primary font-medium" : "text-muted-foreground"}>
                {profile?.is_subscribed ? "مشترك" : "غير مشترك"}
              </span>
            </div>
            <div className="mt-3">
              <StudentLevelBadge points={studentPoints} showProgress />
            </div>
          </div>
          </div>
          )}

           {/* Quick Actions */}
           {!adminUnlocked && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {profile?.is_subscribed ? (
              <Link to="/my-results">
                <Button variant="outline" size="sm" className="gap-1">
                  <BarChart3 className="w-4 h-4" /> نتائجي
                </Button>
              </Link>
            ) : (
              <Link to="/subscribe">
                <Button variant="outline" size="sm" className="gap-1 opacity-60">
                  <Lock className="w-4 h-4" /> نتائجي
                </Button>
              </Link>
            )}
            {profile?.is_subscribed ? (
              <Link to="/homework" className="relative">
                <Button variant="outline" size="sm" className="gap-1">
                  <ClipboardList className="w-4 h-4" /> الواجبات
                </Button>
                <RedBadge count={badgeCounts.pendingHomework} />
              </Link>
            ) : (
              <Link to="/subscribe">
                <Button variant="outline" size="sm" className="gap-1 opacity-60">
                  <Lock className="w-4 h-4" /> الواجبات
                </Button>
              </Link>
            )}
            {profile?.is_subscribed ? (
              <Link to="/question-bank">
                <Button variant="outline" size="sm" className="gap-1">
                  <Library className="w-4 h-4" /> بنك الأسئلة
                </Button>
              </Link>
            ) : (
              <Link to="/subscribe">
                <Button variant="outline" size="sm" className="gap-1 opacity-60">
                  <Lock className="w-4 h-4" /> بنك الأسئلة
                </Button>
              </Link>
            )}
            {profile?.is_subscribed ? (
              <Link to="/report">
                <Button variant="outline" size="sm" className="gap-1">
                  <BarChart3 className="w-4 h-4" /> تقرير أدائي
                </Button>
              </Link>
            ) : (
              <Link to="/subscribe">
                <Button variant="outline" size="sm" className="gap-1 opacity-60">
                  <Lock className="w-4 h-4" /> تقرير أدائي
                </Button>
              </Link>
            )}
            <Link to="/certificates">
              <Button variant="outline" size="sm" className="gap-1">
                <Trophy className="w-4 h-4" /> شهاداتي
              </Button>
            </Link>
            <Link to="/contact" className="relative">
              <Button variant="outline" size="sm" className="gap-1">
                <MessageCircle className="w-4 h-4" /> التواصل مع المعلم
              </Button>
              <RedBadge count={badgeCounts.unreadMessages} />
            </Link>
          </div>
          )}

        {/* Push Notification Banner */}
        {!adminUnlocked && <PushNotificationBanner />}

        {/* Student Progress Tracker */}
        {!adminUnlocked && user && profile && <StudentProgressTracker userId={user.id} grade={displayGrade} />}

        {/* Achievement Badges */}
        {!adminUnlocked && user && <AchievementBadges userId={user.id} />}

        {/* Why Choose Us */}
        {!adminUnlocked && (
        <>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold font-amiri mb-2">لماذا تختار منصتنا؟</h2>
        </div>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10" staggerDelay={0.1}>
          {[
            { title: "شرح على أعلى مستوى", desc: "شروحات مفصلة ومبسطة لجميع المواد الشرعية" },
            { title: "متابعة مستمرة", desc: "متابعة دورية ومستمرة لمستوى كل طالب" },
            { title: "نتائج مضمونة", desc: "نتائج مميزة ومضمونة بإذن الله" },
            { title: "محتوى متجدد", desc: "محتوى تعليمي متجدد ومحدث باستمرار" },
          ].map((item, i) => (
            <StaggerItem key={i}>
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-xs">{item.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        </>
        )}

        {/* Student Exams */}
        {!adminUnlocked && studentExams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold font-amiri text-center mb-4 flex items-center justify-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              الامتحانات المتاحة
            </h2>
            <div className="space-y-3">
              {studentExams.map(e => (
                <div key={e.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{e.title}</h3>
                    <p className="text-xs text-muted-foreground">{e.subject}</p>
                  </div>
                  <Link to={`/exam/${e.id}`}>
                    <Button size="sm" className="gap-1">
                      ابدأ الامتحان
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subjects */}
        <div className="mb-6">
          <h2 className="text-xl font-bold font-amiri text-center mb-2">المواد الدراسية - {displayGrade}</h2>
          <p className="text-muted-foreground text-sm text-center mb-6 max-w-lg mx-auto">
            نقدم لك شرحًا شاملاً ومتميزًا لجميع مواد التربية الدينية الإسلامية بأسلوب سهل ومبسط
          </p>
        </div>

        <StaggerContainer className="space-y-4 max-w-2xl mx-auto" staggerDelay={0.12}>
          {subjects.map((subject, i) => (
            <StaggerItem key={i}>
              <div className="bg-card rounded-xl border border-border p-5 relative">
                {!adminUnlocked && badgeCounts.newVideosPerSubject[subject.title] > 0 && (
                  <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center gap-0.5">
                    <Video className="w-3 h-3" />
                    {badgeCounts.newVideosPerSubject[subject.title]}
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <subject.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">
                      {profile?.madhab && subject.title === "الفقه" ? `${subject.title} ${profile.madhab.replace("الفقه ", "")}` : subject.title}
                    </h3>
                    <p className="text-muted-foreground text-xs mb-3">{subject.description}</p>
                    <Link to={`/subject/${encodeURIComponent(subject.title)}?grade=${encodeURIComponent(displayGrade)}`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        ابدأ المشاهدة
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Subscription CTA for non-subscribed students */}
        {!isAdmin && !profile?.is_subscribed && (
          <div className="mt-12 mb-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-amiri mb-3">اشترك الآن وابدأ رحلتك التعليمية</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              احصل على وصول كامل لجميع المحتوى التعليمي والامتحانات
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-w-md mx-auto text-right">
              {[
                "شرح مفصل لجميع المواد الشرعية",
                "فيديوهات تعليمية عالية الجودة",
                "امتحانات تفاعلية مع تصحيح تلقائي",
                "متابعة مستمرة لمستواك الدراسي",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-primary">{subscriptionPrice}</span>
              <span className="text-muted-foreground text-sm mr-1">جنيه / شهرياً</span>
            </div>
            <Link to="/subscribe">
              <Button size="lg" className="gap-2 px-8">
                اشترك للوصول للمحتوى
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Install App Button */}
        {!isAdmin && (
          <div className="mt-8 mb-4 max-w-2xl mx-auto text-center">
            <InstallPWAButton />
          </div>
        )}

        {/* Contact Us Link - bottom of page */}
        {!isAdmin && (
          <div className="mt-4 mb-8 max-w-2xl mx-auto">
            <Link to="/contact">
              <div className="bg-muted/50 rounded-xl border border-border p-4 text-center hover:border-primary/30 transition-colors cursor-pointer">
                <p className="text-sm text-muted-foreground">هل لديك شكوى أو اقتراح؟ <span className="text-primary font-medium">تواصل معنا</span></p>
              </div>
            </Link>
          </div>
        )}

        <InstallPWABanner />
      </main>
    </div>
  );
};

export default Dashboard;
