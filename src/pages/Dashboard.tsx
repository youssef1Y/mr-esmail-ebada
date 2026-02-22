import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, User, LogOut, CheckCircle, ChevronLeft, Star, BookMarked, Scroll, BookHeart, Shield, Bell, Video, Users, Search, RefreshCw, Trash2, UserCheck, UserX, Plus, Send, Lock, ChevronDown, Play, Upload, FileText, X, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as AuthUser } from "@supabase/supabase-js";

const ADMIN_PASSWORD = "Esmail01097602493";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [adminTab, setAdminTab] = useState<"subscribers" | "videos" | "notifications" | "exams">("subscribers");

  // Grade videos for admin preview
  const [gradeVideos, setGradeVideos] = useState<VideoItem[]>([]);

  // Admin data
  const [profiles, setProfiles] = useState<ProfileFull[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSubscription, setFilterSubscription] = useState("");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videoGrade, setVideoGrade] = useState("");
  const [videoSubject, setVideoSubject] = useState("");
  const [newVideo, setNewVideo] = useState({ title: "", description: "", grade: "", subject: "", access_type: "all" });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddVideo, setShowAddVideo] = useState(false);
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

  // Student notifications
  const [studentNotifs, setStudentNotifs] = useState<Notification[]>([]);
  const [studentExams, setStudentExams] = useState<ExamItem[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);

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
      setSelectedGrade(data.grade);
      fetchStudentNotifications(data.grade, data.is_subscribed);
      fetchStudentExams(data.grade, data.is_subscribed);
    }
    setLoading(false);
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

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setShowAdminLogin(false);
      setAdminPassword("");
      toast({ title: "تم الدخول كأدمن" });
      fetchProfiles();
    } else {
      toast({ title: "خطأ", description: "كلمة المرور غير صحيحة", variant: "destructive" });
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

    if (error) { toast({ title: "خطأ", description: error.message, variant: "destructive" }); return; }

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

  // Fetch videos when grade changes (for admin)
  useEffect(() => {
    if (isAdmin && selectedGrade) {
      fetchGradeVideos(selectedGrade);
    }
  }, [isAdmin, selectedGrade]);

  useEffect(() => {
    if (adminUnlocked) {
      if (adminTab === "videos") fetchVideos();
      if (adminTab === "notifications") fetchNotifications();
      if (adminTab === "exams") fetchExams();
    }
  }, [adminTab, videoGrade, videoSubject, adminUnlocked]);

  const toggleSubscription = async (p: ProfileFull) => {
    const newPrice = p.grade.includes("إعدادي") ? 150 : 200;
    await supabase.from("profiles").update({ is_subscribed: !p.is_subscribed, subscription_price: p.is_subscribed ? 0 : newPrice }).eq("id", p.id);
    fetchProfiles();
    toast({ title: p.is_subscribed ? "تم إلغاء الاشتراك" : "تم تفعيل الاشتراك" });
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
    setUploading(true);
    const fileExt = videoFile.name.split('.').pop();
    const filePath = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("videos").upload(filePath, videoFile);
    if (uploadError) {
      toast({ title: "خطأ في رفع الفيديو", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("videos").getPublicUrl(filePath);
    const { error } = await supabase.from("videos").insert({ ...newVideo, video_url: urlData.publicUrl });
    if (error) { toast({ title: "خطأ", description: error.message, variant: "destructive" }); }
    else { toast({ title: "تم إضافة الفيديو" }); setNewVideo({ title: "", description: "", grade: "", subject: "", access_type: "all" }); setVideoFile(null); setShowAddVideo(false); fetchVideos(); fetchGradeVideos(selectedGrade); }
    setUploading(false);
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
    if (error) { toast({ title: "خطأ", description: error.message, variant: "destructive" }); }
    else { toast({ title: "تم إرسال الإشعار" }); setNewNotif({ title: "", body: "", target_audience: "all", target_grades: [] }); fetchNotifications(); }
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
            <Link to="/profile">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 ml-1" />
                <span className="hidden sm:inline">الملف الشخصي</span>
              </Button>
            </Link>
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
                  onClick={() => setSelectedGrade(g)}
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

            {/* Subscription status toggle */}
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-muted-foreground">عرض كـ:</span>
              <button
                onClick={() => setAdminViewSubscribed(true)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${adminViewSubscribed ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"}`}
              >
                مشترك
              </button>
              <button
                onClick={() => setAdminViewSubscribed(false)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!adminViewSubscribed ? "bg-destructive text-destructive-foreground border-destructive" : "bg-card border-border text-foreground"}`}
              >
                غير مشترك
              </button>
              <span className="text-xs text-muted-foreground mr-2">
                ({subscriptionPrice} جنيه)
              </span>
            </div>

            {/* Videos for this grade */}
            {gradeVideos.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  فيديوهات {selectedGrade.replace("الصف ", "")} ({gradeVideos.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {gradeVideos.map(v => (
                    <div key={v.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Play className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{v.title}</h4>
                        <p className="text-xs text-muted-foreground">{v.subject}</p>
                      </div>
                      <a href={v.video_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                          مشاهدة
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {gradeVideos.length === 0 && (
              <p className="text-xs text-muted-foreground mt-3">لا توجد فيديوهات لهذا الصف حتى الآن</p>
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
                { key: "notifications" as const, label: "الإشعارات", icon: Bell },
              ].map(t => (
                <Button key={t.key} variant={adminTab === t.key ? "default" : "outline"} size="sm" onClick={() => setAdminTab(t.key)} className="gap-1">
                  <t.icon className="w-4 h-4" />
                  {t.label}
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
                        <select value={newVideo.subject} onChange={e => setNewVideo({ ...newVideo, subject: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                          <option value="">المادة</option>
                          {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">متاح لـ</Label>
                        <div className="flex gap-2">
                          <button onClick={() => setNewVideo({ ...newVideo, access_type: "all" })} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${newVideo.access_type === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>كل الطلاب</button>
                          <button onClick={() => setNewVideo({ ...newVideo, access_type: "subscribers_only" })} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${newVideo.access_type === "subscribers_only" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>المشتركين فقط</button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={addVideo} size="sm" className="flex-1" disabled={uploading}>{uploading ? "جاري الرفع..." : "حفظ"}</Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAddVideo(false)}>إلغاء</Button>
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
                          <h4 className="font-bold text-sm">{v.title}</h4>
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
                      <div key={n.id} className="bg-background rounded-xl border border-border p-3">
                        <h4 className="font-bold text-xs">{n.title}</h4>
                        <p className="text-xs text-muted-foreground">{n.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {n.target_audience === "subscribed" ? "المشتركين" : n.target_audience === "unsubscribed" ? "غير المشتركين" : "الكل"}
                          {n.target_grades.length > 0 ? ` · ${n.target_grades.join("، ")}` : ""} · {new Date(n.created_at).toLocaleDateString("ar-EG")}
                        </p>
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
                  {viewingExamResults && (
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
                          <div className="text-xs text-muted-foreground mb-2">عدد المحاولات: {examResults.length}</div>
                          {examResults.map(r => (
                            <div key={r.id} className="bg-background rounded-lg border border-border p-3 flex items-center justify-between">
                              <div>
                                <p className="font-bold text-sm">{r.student_name}</p>
                                <p className="text-xs text-muted-foreground">{r.student_grade}</p>
                                <p className="text-xs text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                              <div className="text-center">
                                <span className={`text-lg font-bold ${(r.score || 0) >= ((r.total || 1) * 0.5) ? "text-primary" : "text-destructive"}`}>
                                  {r.score || 0}/{r.total || 0}
                                </span>
                                <p className="text-xs text-muted-foreground">{r.total ? Math.round(((r.score || 0) / r.total) * 100) : 0}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
            </div>
          </div>
        )}

        {/* Student Notifications Banner */}
        {studentNotifs.filter(n => !dismissedNotifs.includes(n.id)).length > 0 && (
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
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold font-amiri mb-2">لماذا تختار منصتنا؟</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {[
            { title: "شرح على أعلى مستوى", desc: "شروحات مفصلة ومبسطة لجميع المواد الشرعية" },
            { title: "متابعة مستمرة", desc: "متابعة دورية ومستمرة لمستوى كل طالب" },
            { title: "نتائج مضمونة", desc: "نتائج مميزة ومضمونة بإذن الله" },
            { title: "محتوى متجدد", desc: "محتوى تعليمي متجدد ومحدث باستمرار" },
          ].map((item, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-bold text-sm mb-1">{item.title}</h3>
              <p className="text-muted-foreground text-xs">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Student Exams */}
        {studentExams.length > 0 && (
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

        <div className="space-y-4 max-w-2xl mx-auto">
          {subjects.map((subject, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5">
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
          ))}
        </div>

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
      </main>
    </div>
  );
};

export default Dashboard;
