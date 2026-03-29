import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, RotateCcw, Library, Filter, Trophy, Target, Zap, ArrowLeft, ChevronRight, FileText, Eye, BookOpen, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "@/lib/image-compress";

interface BankQuestion {
  id: string;
  grade: string;
  subject: string;
  lesson: string | null;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string | null;
}

interface WorksheetFile {
  id: string;
  grade: string;
  subject: string;
  title: string;
  description: string | null;
  pdf_url: string | null;
  answer_key_url: string | null;
  created_at: string;
}

const subjectsList = ["الفقه", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية"];
const gradesList = [
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
];

type LessonFilter = "all" | "watched" | "specific";

const QuestionBank = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"training" | "worksheets">("training");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [lesson, setLesson] = useState("");
  const [lessonFilter, setLessonFilter] = useState<LessonFilter>("all");
  const [availableLessons, setAvailableLessons] = useState<string[]>([]);
  const [watchedLessons, setWatchedLessons] = useState<{title: string; videoId: string}[]>([]);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [started, setStarted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [questionCount, setQuestionCount] = useState(100);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [userId, setUserId] = useState("");

  // Worksheets state
  const [worksheets, setWorksheets] = useState<WorksheetFile[]>([]);
  const [loadingWorksheets, setLoadingWorksheets] = useState(false);
  const [wsFilterSubject, setWsFilterSubject] = useState("");
  const [showAnswerKey, setShowAnswerKey] = useState<string | null>(null);

  // Worksheet interactive questions state
  const [wsQuestions, setWsQuestions] = useState<BankQuestion[]>([]);
  const [wsStarted, setWsStarted] = useState(false);
  const [wsCurrentIndex, setWsCurrentIndex] = useState(0);
  const [wsSelectedAnswer, setWsSelectedAnswer] = useState("");
  const [wsShowResult, setWsShowResult] = useState(false);
  const [wsScore, setWsScore] = useState(0);
  const [wsTotal, setWsTotal] = useState(0);
  const [wsFinished, setWsFinished] = useState(false);
  const [wsPhotoUrl, setWsPhotoUrl] = useState<string | null>(null);
  const [wsUploading, setWsUploading] = useState(false);
  const [wsPhotoAnswers, setWsPhotoAnswers] = useState<Record<number, string>>({});
  const [wsSubject, setWsSubject] = useState("");
  const [wsLesson, setWsLesson] = useState("");
  const [wsLessonFilter, setWsLessonFilter] = useState<LessonFilter>("all");
  const [wsAvailableLessons, setWsAvailableLessons] = useState<string[]>([]);
  const [wsWatchedLessons, setWsWatchedLessons] = useState<{title: string; videoId: string}[]>([]);
  const [wsQuestionCount, setWsQuestionCount] = useState(100);
  const [wsLoadingQuestions, setWsLoadingQuestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      setUserId(session.user.id);

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
      const adminUser = !!(roles && roles.length > 0);
      setIsAdmin(adminUser);

      const { data: profile } = await supabase.from("profiles").select("grade").eq("user_id", session.user.id).single();
      if (profile && !adminUser) setGrade(profile.grade);
      setLoading(false);
    };
    init();
  }, [navigate]);

  // Fetch available lessons from VIDEOS table + watched lessons when grade + subject change
  useEffect(() => {
    if (!grade || !subject) {
      setAvailableLessons([]);
      setWatchedLessons([]);
      setLesson("");
      return;
    }
    const fetchLessons = async () => {
      setLoadingLessons(true);

      // Get all video titles as lessons
      const { data: allVideos } = await supabase
        .from("videos")
        .select("id, title")
        .eq("grade", grade)
        .eq("subject", subject);

      if (allVideos) {
        const titles = [...new Set(allVideos.map(v => v.title).filter(Boolean))];
        setAvailableLessons(titles.sort());
      }

      // Get watched video titles for this student
      if (userId) {
        const { data: views } = await supabase
          .from("video_views")
          .select("video_id")
          .eq("user_id", userId);

        if (views && views.length > 0) {
          const viewedIds = [...new Set(views.map(v => v.video_id))];
          const { data: videos } = await supabase
            .from("videos")
            .select("id, title")
            .eq("grade", grade)
            .eq("subject", subject)
            .in("id", viewedIds);

          if (videos) {
            setWatchedLessons(videos.map(v => ({ title: v.title, videoId: v.id })));
          }
        } else {
          setWatchedLessons([]);
        }
      }

      setLoadingLessons(false);
    };
    fetchLessons();
  }, [grade, subject, userId]);

  // Fetch worksheets
  useEffect(() => {
    if (activeTab !== "worksheets" || !grade) return;
    const fetchWorksheets = async () => {
      setLoadingWorksheets(true);
      let query = supabase.from("question_bank_files").select("*").eq("grade", grade).order("created_at", { ascending: false });
      if (wsFilterSubject) query = query.eq("subject", wsFilterSubject);
      const { data } = await query;
      setWorksheets((data as WorksheetFile[]) || []);
      setLoadingWorksheets(false);
    };
    fetchWorksheets();
  }, [activeTab, grade, wsFilterSubject]);

  // Fetch ws lessons from videos
  useEffect(() => {
    if (!grade || !wsSubject) { setWsAvailableLessons([]); setWsWatchedLessons([]); return; }
    const fetchWsLessons = async () => {
      const { data: allVideos } = await supabase
        .from("videos")
        .select("id, title")
        .eq("grade", grade)
        .eq("subject", wsSubject);

      if (allVideos) {
        const titles = [...new Set(allVideos.map(v => v.title).filter(Boolean))];
        setWsAvailableLessons(titles.sort());
      }

      if (userId) {
        const { data: views } = await supabase
          .from("video_views")
          .select("video_id")
          .eq("user_id", userId);

        if (views && views.length > 0) {
          const viewedIds = [...new Set(views.map(v => v.video_id))];
          const { data: videos } = await supabase
            .from("videos")
            .select("id, title")
            .eq("grade", grade)
            .eq("subject", wsSubject)
            .in("id", viewedIds);

          if (videos) {
            setWsWatchedLessons(videos.map(v => ({ title: v.title, videoId: v.id })));
          }
        } else {
          setWsWatchedLessons([]);
        }
      }
    };
    fetchWsLessons();
  }, [grade, wsSubject, userId]);

  const startPractice = async () => {
    if (!grade) { toast({ title: "خطأ", description: "اختر الصف أولاً", variant: "destructive" }); return; }
    if (!subject) { toast({ title: "خطأ", description: "اختر المادة أولاً", variant: "destructive" }); return; }

    setGenerating(true);
    setGeneratingMessage("جاري تحميل الأسئلة...");

    try {
      const { data } = await supabase.rpc("get_practice_questions", { p_grade: grade, p_subject: subject });
      let filtered = (data as BankQuestion[]) || [];

      // Apply lesson filter
      if (filtered.length > 0) {
        if (lessonFilter === "watched" && watchedLessons.length > 0) {
          const watchedTitles = watchedLessons.map(w => w.title);
          filtered = filtered.filter(q => q.lesson && watchedTitles.some(wl =>
            q.lesson!.includes(wl) || wl.includes(q.lesson!)
          ));
        } else if (lessonFilter === "specific" && lesson) {
          filtered = filtered.filter(q => q.lesson === lesson || (q.lesson && q.lesson.includes(lesson)));
        }
      }

      // Filter MCQs only
      filtered = filtered.filter(q => q.question_type === "mcq" && q.options && q.options.length >= 2);

      if (filtered.length === 0) {
        toast({ title: "لا توجد أسئلة بعد", description: "الأسئلة يتم توليدها تلقائياً عند إضافة الفيديوهات. انتظر قليلاً أو اختر مادة أخرى" });
        setGenerating(false);
        return;
      }

      // Shuffle and select
      const shuffled = filtered.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, questionCount);
      setQuestions(selected);
      setStarted(true);
      setCurrentIndex(0);
      setScore(0);
      setTotal(0);
      setFinished(false);
      setStreak(0);
      setBestStreak(0);
    } catch (e) {
      console.error("Practice error:", e);
      toast({ title: "خطأ", description: "حدث خطأ أثناء تحضير الأسئلة", variant: "destructive" });
    }
    setGenerating(false);
  };

  const checkAnswer = () => {
    const q = questions[currentIndex];
    const correct = q.correct_answer === selectedAnswer;
    if (correct) {
      setScore(s => s + 1);
      setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns; });
    } else { setStreak(0); }
    setTotal(t => t + 1);
    setShowResult(true);
  };

  const nextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer("");
    if (currentIndex + 1 >= questions.length) setFinished(true);
    else setCurrentIndex(i => i + 1);
  };

  const restart = () => {
    setStarted(false); setFinished(false); setCurrentIndex(0); setScore(0); setTotal(0);
    setSelectedAnswer(""); setShowResult(false); setStreak(0); setBestStreak(0);
  };

  // Worksheet interactive questions - same approach
  const startWsQuestions = async () => {
    if (!grade || !wsSubject) { toast({ title: "خطأ", description: "اختر المادة أولاً", variant: "destructive" }); return; }
    setWsLoadingQuestions(true);

    try {
      // Try question bank first
      const { data } = await supabase.rpc("get_practice_questions", { p_grade: grade, p_subject: wsSubject });
      let filtered = (data as BankQuestion[]) || [];

      // Apply lesson filter
      if (filtered.length > 0) {
        if (wsLessonFilter === "watched" && wsWatchedLessons.length > 0) {
          const watchedTitles = wsWatchedLessons.map(w => w.title);
          filtered = filtered.filter(q => q.lesson && watchedTitles.some(wl =>
            q.lesson!.includes(wl) || wl.includes(q.lesson!)
          ));
        } else if (wsLessonFilter === "specific" && wsLesson) {
          filtered = filtered.filter(q => q.lesson === wsLesson || (q.lesson && q.lesson.includes(wsLesson)));
        }
      }

      // Filter MCQs
      filtered = filtered.filter(q => q.question_type === "mcq" && q.options && q.options.length >= 2);

      const selected = filtered.slice(0, wsQuestionCount);
      if (selected.length === 0) {
        toast({ title: "لا توجد أسئلة", description: "لم يتمكن النظام من توليد أسئلة" });
        setWsLoadingQuestions(false);
        return;
      }

      setWsQuestions(selected);
      setWsStarted(true);
      setWsCurrentIndex(0);
      setWsScore(0);
      setWsTotal(0);
      setWsFinished(false);
      setWsPhotoUrl(null);
      setWsPhotoAnswers({});
    } catch (e) {
      console.error("WS Questions error:", e);
      toast({ title: "خطأ", description: "حدث خطأ أثناء تحضير الأسئلة", variant: "destructive" });
    }
    setWsLoadingQuestions(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWsUploading(true);

    try {
      const compressed = await compressImage(file);
      const ext = file.name.split(".").pop() || "jpg";
      const path = `question-answers/${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("submissions").upload(path, compressed);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("submissions").getPublicUrl(path);
      const url = urlData.publicUrl;
      setWsPhotoUrl(url);
      setWsPhotoAnswers(prev => ({ ...prev, [wsCurrentIndex]: url }));
    } catch {
      toast({ title: "خطأ", description: "فشل رفع الصورة", variant: "destructive" });
    }
    setWsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const wsCheckAnswer = () => {
    const q = wsQuestions[wsCurrentIndex];
    if (q.question_type === "mcq" && q.correct_answer) {
      const correct = q.correct_answer === wsSelectedAnswer;
      if (correct) setWsScore(s => s + 1);
    }
    setWsTotal(t => t + 1);
    setWsShowResult(true);
  };

  const wsNextQuestion = () => {
    setWsShowResult(false);
    setWsSelectedAnswer("");
    setWsPhotoUrl(null);
    if (wsCurrentIndex + 1 >= wsQuestions.length) setWsFinished(true);
    else setWsCurrentIndex(i => i + 1);
  };

  const wsRestart = () => {
    setWsStarted(false); setWsFinished(false); setWsCurrentIndex(0); setWsScore(0); setWsTotal(0);
    setWsSelectedAnswer(""); setWsShowResult(false); setWsPhotoUrl(null); setWsPhotoAnswers({});
  };

  const progressPercent = questions.length > 0 ? ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100 : 0;
  const wsProgressPercent = wsQuestions.length > 0 ? ((wsCurrentIndex + (wsShowResult ? 1 : 0)) / wsQuestions.length) * 100 : 0;

  const getScoreEmoji = (s: number, t: number) => {
    const pct = t > 0 ? Math.round((s / t) * 100) : 0;
    if (pct >= 90) return "🏆"; if (pct >= 70) return "⭐"; if (pct >= 50) return "👍"; return "💪";
  };
  const getScoreMessage = (s: number, t: number) => {
    const pct = t > 0 ? Math.round((s / t) * 100) : 0;
    if (pct >= 90) return "ممتاز! أداء رائع جداً"; if (pct >= 70) return "جيد جداً! استمر في التقدم";
    if (pct >= 50) return "جيد! تحتاج مزيد من التدريب"; return "لا تيأس! حاول مرة أخرى";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const currentQ = questions[currentIndex];
  const wsCurrentQ = wsQuestions[wsCurrentIndex];

  // Lesson filter UI component
  const renderLessonFilter = (
    filterType: LessonFilter,
    setFilterType: (f: LessonFilter) => void,
    lessons: string[],
    watched: {title: string; videoId: string}[],
    selectedLesson: string,
    setSelectedLesson: (l: string) => void
  ) => (
    <>
      {lessons.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-1.5 block text-right flex items-center gap-1 justify-end">
            <Filter className="w-3.5 h-3.5" />
            نطاق الأسئلة
          </label>
          <div className="flex gap-2 flex-wrap justify-center mb-2">
            <button onClick={() => { setFilterType("all"); setSelectedLesson(""); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${filterType === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:border-primary/50"}`}>
              كل الدروس
            </button>
            <button onClick={() => { setFilterType("watched"); setSelectedLesson(""); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${filterType === "watched" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:border-primary/50"}`}>
              الدروس المشاهدة ({watched.length})
            </button>
            <button onClick={() => setFilterType("specific")}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${filterType === "specific" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:border-primary/50"}`}>
              درس محدد
            </button>
          </div>

          {filterType === "specific" && (
            <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="">اختر الدرس</option>
              {lessons.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}

          {filterType === "watched" && watched.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-1">لم تشاهد أي فيديوهات لهذه المادة بعد</p>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Library className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">بنك الأسئلة</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Tabs - only show when not in quiz mode */}
      {!started && !wsStarted && !generating && (
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="flex">
              <button
                onClick={() => setActiveTab("training")}
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
                  activeTab === "training" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Target className="w-4 h-4 inline-block ml-1" />
                تدريب ذاتي
              </button>
              <button
                onClick={() => setActiveTab("worksheets")}
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
                  activeTab === "worksheets" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-4 h-4 inline-block ml-1" />
                ملفات المستر
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <AnimatePresence mode="wait">
          {/* Generating state */}
          {generating && (
            <motion.div key="generating" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="text-lg font-bold mb-2">جاري تحضير الأسئلة</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">{generatingMessage}</p>
              <p className="text-xs text-muted-foreground mt-3">🤖 الذكاء الاصطناعي يقرأ الفيديوهات ويولّد أسئلة حصرية لك</p>
            </motion.div>
          )}

          {!generating && activeTab === "training" ? (
            <>
              {!started ? (
                <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
                  <div className="mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Target className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold font-amiri mb-1">التدريب الذاتي</h1>
                    <p className="text-sm text-muted-foreground">اختر المادة والدرس وابدأ التدريب</p>
                  </div>

                  <div className="bg-card rounded-2xl border border-border p-5 max-w-md mx-auto space-y-4">
                    {isAdmin && (
                      <div>
                        <label className="text-sm font-medium mb-1.5 block text-right">الصف الدراسي</label>
                        <select value={grade} onChange={e => { setGrade(e.target.value); setSubject(""); setLesson(""); setLessonFilter("all"); }}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                          <option value="">اختر الصف</option>
                          {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium mb-1.5 block text-right">المادة</label>
                      <select value={subject} onChange={e => { setSubject(e.target.value); setLesson(""); setLessonFilter("all"); }}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                        <option value="">اختر المادة</option>
                        {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Lesson filter */}
                    {subject && !loadingLessons && renderLessonFilter(
                      lessonFilter, setLessonFilter,
                      availableLessons, watchedLessons,
                      lesson, setLesson
                    )}
                    {loadingLessons && <p className="text-xs text-muted-foreground text-center">جاري تحميل الدروس...</p>}

                    <div>
                      <label className="text-sm font-medium mb-1.5 block text-right">عدد الأسئلة</label>
                      <div className="flex gap-2 justify-center">
                        {[10, 15, 20].map(n => (
                          <button key={n} onClick={() => setQuestionCount(n)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${questionCount === n ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:border-primary/50"}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button onClick={startPractice} className="w-full gap-2" size="lg" disabled={generating}>
                      <Zap className="w-4 h-4" />
                      ابدأ التدريب
                    </Button>

                    <p className="text-[10px] text-muted-foreground text-center">
                      🤖 يتم توليد الأسئلة تلقائياً من محتوى الفيديوهات بالذكاء الاصطناعي
                    </p>
                  </div>
                </motion.div>
              ) : finished ? (
                <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto">
                  <div className="bg-card rounded-2xl border-2 border-primary/30 p-6 text-center">
                    <div className="text-5xl mb-3">{getScoreEmoji(score, total)}</div>
                    <h2 className="text-xl font-bold mb-1">انتهى التدريب!</h2>
                    <p className="text-sm text-muted-foreground mb-4">{getScoreMessage(score, total)}</p>
                    <div className="text-4xl font-bold text-primary mb-4">{score} / {total}</div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-background rounded-xl p-3 border border-border">
                        <div className="text-lg font-bold text-primary">{total > 0 ? Math.round((score / total) * 100) : 0}%</div>
                        <div className="text-[10px] text-muted-foreground">نسبة النجاح</div>
                      </div>
                      <div className="bg-background rounded-xl p-3 border border-border">
                        <div className="text-lg font-bold text-primary">{bestStreak}</div>
                        <div className="text-[10px] text-muted-foreground">أفضل سلسلة</div>
                      </div>
                      <div className="bg-background rounded-xl p-3 border border-border">
                        <div className="text-lg font-bold text-primary">{total}</div>
                        <div className="text-[10px] text-muted-foreground">إجمالي الأسئلة</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={restart} className="flex-1 gap-2"><RotateCcw className="w-4 h-4" /> تدريب جديد</Button>
                      <Link to="/dashboard" className="flex-1"><Button variant="outline" className="w-full">العودة</Button></Link>
                    </div>
                  </div>
                </motion.div>
              ) : currentQ ? (
                <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">سؤال {currentIndex + 1} من {questions.length}</span>
                      <div className="flex items-center gap-3">
                        {streak >= 2 && <span className="text-xs font-bold text-orange-500 flex items-center gap-1">🔥 {streak}</span>}
                        <span className="text-xs font-bold text-primary">{score}/{total} صحيح</span>
                      </div>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                  {currentQ.lesson && (
                    <div className="mb-3">
                      <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full">{currentQ.lesson}</span>
                    </div>
                  )}
                  <AnimatePresence mode="wait">
                    <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}
                      className="bg-card rounded-2xl border border-border p-5">
                      <h3 className="font-bold text-sm mb-4 leading-relaxed">{currentQ.question_text}</h3>
                      {currentQ.question_type === "mcq" && currentQ.options ? (
                        <div className="space-y-2">
                          {(currentQ.options as string[]).map((opt, j) => {
                            let cls = "bg-background border-input hover:border-primary/50 hover:bg-primary/5";
                            if (showResult) {
                              if (opt === currentQ.correct_answer) cls = "bg-green-50 dark:bg-green-950/30 border-green-500 text-green-700 dark:text-green-400";
                              else if (opt === selectedAnswer && opt !== currentQ.correct_answer) cls = "bg-red-50 dark:bg-red-950/30 border-destructive text-destructive";
                              else cls = "bg-background border-input opacity-60";
                            } else if (selectedAnswer === opt) cls = "bg-primary text-primary-foreground border-primary shadow-md";
                            return (
                              <motion.button key={j} whileTap={!showResult ? { scale: 0.98 } : {}} onClick={() => !showResult && setSelectedAnswer(opt)} disabled={showResult}
                                className={`w-full text-right px-4 py-3 rounded-xl border text-sm transition-all duration-200 flex items-center gap-2 ${cls}`}>
                                {showResult && opt === currentQ.correct_answer && <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />}
                                {showResult && opt === selectedAnswer && opt !== currentQ.correct_answer && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                                <span className="flex-1">{opt}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      ) : null}
                      <div className="mt-4">
                        {!showResult ? (
                          <Button onClick={checkAnswer} disabled={!selectedAnswer} className="w-full" size="lg">تحقق من الإجابة</Button>
                        ) : (
                          <Button onClick={nextQuestion} className="w-full gap-2" size="lg">
                            {currentIndex + 1 >= questions.length ? <><Trophy className="w-4 h-4" /> عرض النتيجة</> : <>السؤال التالي <ArrowLeft className="w-4 h-4" /></>}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              ) : null}
            </>
          ) : !generating && activeTab === "worksheets" ? (
            /* ===== WORKSHEETS TAB ===== */
            <>
              {!wsStarted ? (
                <motion.div key="worksheets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  {/* Section 1: Interactive Questions */}
                  <div className="mb-8">
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <Target className="w-7 h-7 text-primary" />
                      </div>
                      <h2 className="text-lg font-bold font-amiri">أسئلة تفاعلية</h2>
                      <p className="text-xs text-muted-foreground">أجب على الأسئلة واحدة تلو الأخرى مع إمكانية تصوير إجابتك</p>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-4 max-w-md mx-auto space-y-3">
                      {isAdmin && (
                        <div>
                          <label className="text-sm font-medium mb-1 block text-right">الصف</label>
                          <select value={grade} onChange={e => { setGrade(e.target.value); setWsSubject(""); setWsLesson(""); }}
                            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                            <option value="">اختر الصف</option>
                            {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium mb-1 block text-right">المادة</label>
                        <select value={wsSubject} onChange={e => { setWsSubject(e.target.value); setWsLesson(""); setWsLessonFilter("all"); }}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                          <option value="">اختر المادة</option>
                          {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* Lesson filter for worksheets */}
                      {wsSubject && renderLessonFilter(
                        wsLessonFilter, setWsLessonFilter,
                        wsAvailableLessons, wsWatchedLessons,
                        wsLesson, setWsLesson
                      )}

                      <div>
                        <label className="text-sm font-medium mb-1 block text-right">عدد الأسئلة</label>
                        <div className="flex gap-2 justify-center">
                          {[5, 10, 15].map(n => (
                            <button key={n} onClick={() => setWsQuestionCount(n)}
                              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${wsQuestionCount === n ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:border-primary/50"}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button onClick={startWsQuestions} disabled={wsLoadingQuestions} className="w-full gap-2" size="lg">
                        {wsLoadingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {wsLoadingQuestions ? "جاري توليد الأسئلة..." : "ابدأ الأسئلة"}
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">
                        🤖 يتم توليد الأسئلة تلقائياً من محتوى الفيديوهات
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-6 max-w-md mx-auto">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-bold">أو</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Section 2: PDF Worksheets */}
                  <div>
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <FileText className="w-7 h-7 text-primary" />
                      </div>
                      <h2 className="text-lg font-bold font-amiri">أوراق عمل وملفات</h2>
                      <p className="text-xs text-muted-foreground">ملفات PDF وأوراق عمل مع الحلول النموذجية</p>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-4 mb-4 max-w-md mx-auto">
                      <div className="space-y-3">
                        {isAdmin && (
                          <div>
                            <label className="text-sm font-medium mb-1 block text-right">الصف الدراسي</label>
                            <select value={grade} onChange={e => { setGrade(e.target.value); setWsFilterSubject(""); }}
                              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                              <option value="">اختر الصف</option>
                              {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium mb-1 block text-right">المادة (اختياري)</label>
                          <select value={wsFilterSubject} onChange={e => setWsFilterSubject(e.target.value)}
                            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                            <option value="">كل المواد</option>
                            {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {!grade ? (
                      <p className="text-center text-sm text-muted-foreground py-8">اختر الصف الدراسي أولاً</p>
                    ) : loadingWorksheets ? (
                      <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" /></div>
                    ) : worksheets.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">لا توجد ملفات لهذا الصف حالياً</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-w-md mx-auto">
                        {worksheets.map(ws => (
                          <motion.div key={ws.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm mb-0.5">{ws.title}</h3>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{ws.subject}</span>
                                  <span className="text-[10px] text-muted-foreground">{new Date(ws.created_at).toLocaleDateString("ar-EG")}</span>
                                </div>
                                {ws.description && <p className="text-xs text-muted-foreground leading-relaxed mb-2">{ws.description}</p>}
                                <div className="flex gap-2 flex-wrap">
                                  {ws.pdf_url && (
                                    <a href={ws.pdf_url} target="_blank" rel="noopener noreferrer">
                                      <Button variant="outline" size="sm" className="gap-1 text-xs h-8"><Eye className="w-3 h-3" /> عرض الأسئلة</Button>
                                    </a>
                                  )}
                                  {ws.answer_key_url && (
                                    showAnswerKey === ws.id ? (
                                      <a href={ws.answer_key_url} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" className="gap-1 text-xs h-8"><Eye className="w-3 h-3" /> فتح الحل</Button>
                                      </a>
                                    ) : (
                                      <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={() => setShowAnswerKey(ws.id)}>
                                        <CheckCircle className="w-3 h-3" /> عرض الحل النموذجي
                                      </Button>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : wsFinished ? (
                /* WS Results */
                <motion.div key="ws-results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto">
                  <div className="bg-card rounded-2xl border-2 border-primary/30 p-6 text-center">
                    <div className="text-5xl mb-3">{getScoreEmoji(wsScore, wsTotal)}</div>
                    <h2 className="text-xl font-bold mb-1">انتهت الأسئلة!</h2>
                    <p className="text-sm text-muted-foreground mb-4">{getScoreMessage(wsScore, wsTotal)}</p>
                    <div className="text-4xl font-bold text-primary mb-4">{wsScore} / {wsTotal}</div>

                    {Object.keys(wsPhotoAnswers).length > 0 && (
                      <div className="mb-4 p-3 bg-background rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground mb-2">📷 تم تصوير {Object.keys(wsPhotoAnswers).length} إجابة</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={wsRestart} className="flex-1 gap-2"><RotateCcw className="w-4 h-4" /> أسئلة جديدة</Button>
                      <Link to="/dashboard" className="flex-1"><Button variant="outline" className="w-full">العودة</Button></Link>
                    </div>
                  </div>
                </motion.div>
              ) : wsCurrentQ ? (
                /* WS Question */
                <motion.div key="ws-quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">سؤال {wsCurrentIndex + 1} من {wsQuestions.length}</span>
                      <span className="text-xs font-bold text-primary">{wsScore}/{wsTotal} صحيح</span>
                    </div>
                    <Progress value={wsProgressPercent} className="h-2" />
                  </div>

                  {wsCurrentQ.lesson && (
                    <div className="mb-3">
                      <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full">{wsCurrentQ.lesson}</span>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div key={wsCurrentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}
                      className="bg-card rounded-2xl border border-border p-5">
                      <h3 className="font-bold text-sm mb-4 leading-relaxed">{wsCurrentQ.question_text}</h3>

                      {/* MCQ options */}
                      {wsCurrentQ.question_type === "mcq" && wsCurrentQ.options ? (
                        <div className="space-y-2 mb-3">
                          {(wsCurrentQ.options as string[]).map((opt, j) => {
                            let cls = "bg-background border-input hover:border-primary/50 hover:bg-primary/5";
                            if (wsShowResult) {
                              if (opt === wsCurrentQ.correct_answer) cls = "bg-green-50 dark:bg-green-950/30 border-green-500 text-green-700 dark:text-green-400";
                              else if (opt === wsSelectedAnswer && opt !== wsCurrentQ.correct_answer) cls = "bg-red-50 dark:bg-red-950/30 border-destructive text-destructive";
                              else cls = "bg-background border-input opacity-60";
                            } else if (wsSelectedAnswer === opt) cls = "bg-primary text-primary-foreground border-primary shadow-md";
                            return (
                              <motion.button key={j} whileTap={!wsShowResult ? { scale: 0.98 } : {}} onClick={() => !wsShowResult && setWsSelectedAnswer(opt)} disabled={wsShowResult}
                                className={`w-full text-right px-4 py-3 rounded-xl border text-sm transition-all duration-200 flex items-center gap-2 ${cls}`}>
                                {wsShowResult && opt === wsCurrentQ.correct_answer && <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />}
                                {wsShowResult && opt === wsSelectedAnswer && opt !== wsCurrentQ.correct_answer && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                                <span className="flex-1">{opt}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Essay question - photo upload */
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-2">سؤال مقالي - صوّر إجابتك</p>
                        </div>
                      )}

                      {/* Photo upload section */}
                      {!wsShowResult && (
                        <div className="mb-3">
                          <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-1 text-xs flex-1" onClick={() => fileInputRef.current?.click()} disabled={wsUploading}>
                              {wsUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                              {wsPhotoUrl ? "تغيير الصورة" : "📷 صوّر إجابتك"}
                            </Button>
                          </div>
                          {wsPhotoUrl && (
                            <div className="mt-2 rounded-xl border border-border overflow-hidden">
                              <img src={wsPhotoUrl} alt="إجابتك" className="w-full max-h-48 object-contain bg-background" />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4">
                        {!wsShowResult ? (
                          <Button onClick={wsCheckAnswer}
                            disabled={wsCurrentQ.question_type === "mcq" ? !wsSelectedAnswer : (!wsPhotoUrl && !wsSelectedAnswer)}
                            className="w-full" size="lg">
                            {wsCurrentQ.question_type === "mcq" ? "تحقق من الإجابة" : "التالي"}
                          </Button>
                        ) : (
                          <Button onClick={wsNextQuestion} className="w-full gap-2" size="lg">
                            {wsCurrentIndex + 1 >= wsQuestions.length ? <><Trophy className="w-4 h-4" /> عرض النتيجة</> : <>السؤال التالي <ArrowLeft className="w-4 h-4" /></>}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Back button */}
                  <div className="mt-4 text-center">
                    <Button variant="ghost" size="sm" onClick={wsRestart} className="text-xs text-muted-foreground">
                      إلغاء والعودة
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default QuestionBank;
