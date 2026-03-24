import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, RotateCcw, Library, Filter, Trophy, Target, Zap, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

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

const subjectsList = ["الفقه", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية"];
const gradesList = [
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
];

const QuestionBank = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [lesson, setLesson] = useState("");
  const [availableLessons, setAvailableLessons] = useState<string[]>([]);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
      const adminUser = !!(roles && roles.length > 0);
      setIsAdmin(adminUser);
      
      const { data: profile } = await supabase.from("profiles").select("grade").eq("user_id", session.user.id).single();
      if (profile && !adminUser) setGrade(profile.grade);
      setLoading(false);
    };
    init();
  }, [navigate]);

  // Fetch available lessons when grade + subject change
  useEffect(() => {
    if (!grade || !subject) {
      setAvailableLessons([]);
      setLesson("");
      return;
    }
    const fetchLessons = async () => {
      setLoadingLessons(true);
      const { data } = await supabase
        .from("question_bank")
        .select("lesson")
        .eq("grade", grade)
        .eq("subject", subject)
        .not("lesson", "is", null);
      
      if (data) {
        const unique = [...new Set(data.map(d => d.lesson).filter(Boolean))] as string[];
        setAvailableLessons(unique.sort());
      }
      setLoadingLessons(false);
    };
    fetchLessons();
  }, [grade, subject]);

  const startPractice = async () => {
    if (!grade) {
      toast({ title: "خطأ", description: "اختر الصف أولاً", variant: "destructive" });
      return;
    }
    if (!subject) {
      toast({ title: "خطأ", description: "اختر المادة أولاً", variant: "destructive" });
      return;
    }

    const { data } = await supabase.rpc("get_practice_questions", { p_grade: grade, p_subject: subject });
    if (!data || data.length === 0) {
      toast({ title: "لا توجد أسئلة", description: "لم يتم إضافة أسئلة لهذه المادة بعد" });
      return;
    }

    let filtered = data as BankQuestion[];
    if (lesson) {
      filtered = filtered.filter(q => q.lesson === lesson);
      if (filtered.length === 0) {
        toast({ title: "لا توجد أسئلة", description: "لم يتم إضافة أسئلة لهذا الدرس بعد" });
        return;
      }
    }
    filtered = filtered.filter(q => q.question_type === "mcq" && q.options && q.options.length >= 2);
    if (filtered.length === 0) {
      toast({ title: "لا توجد أسئلة اختيارية", description: "لا توجد أسئلة اختيار من متعدد لهذا التحديد" });
      return;
    }

    const selected = filtered.slice(0, questionCount);
    setQuestions(selected);
    setStarted(true);
    setCurrentIndex(0);
    setScore(0);
    setTotal(0);
    setFinished(false);
    setStreak(0);
    setBestStreak(0);
  };

  const checkAnswer = () => {
    const q = questions[currentIndex];
    const correct = q.correct_answer === selectedAnswer;
    if (correct) {
      setScore(s => s + 1);
      setStreak(s => {
        const newStreak = s + 1;
        setBestStreak(b => Math.max(b, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }
    setTotal(t => t + 1);
    setShowResult(true);
  };

  const nextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer("");
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const restart = () => {
    setStarted(false);
    setFinished(false);
    setCurrentIndex(0);
    setScore(0);
    setTotal(0);
    setSelectedAnswer("");
    setShowResult(false);
    setStreak(0);
    setBestStreak(0);
  };

  const progressPercent = questions.length > 0 ? ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100 : 0;

  const getScoreEmoji = () => {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    if (pct >= 90) return "🏆";
    if (pct >= 70) return "⭐";
    if (pct >= 50) return "👍";
    return "💪";
  };

  const getScoreMessage = () => {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    if (pct >= 90) return "ممتاز! أداء رائع جداً";
    if (pct >= 70) return "جيد جداً! استمر في التقدم";
    if (pct >= 50) return "جيد! تحتاج مزيد من التدريب";
    return "لا تيأس! حاول مرة أخرى";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const currentQ = questions[currentIndex];

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

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <AnimatePresence mode="wait">
          {!started ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {/* Hero */}
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
                    <select 
                      value={grade} 
                      onChange={e => { setGrade(e.target.value); setSubject(""); setLesson(""); }}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">اختر الصف</option>
                      {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1.5 block text-right">المادة</label>
                  <select 
                    value={subject} 
                    onChange={e => { setSubject(e.target.value); setLesson(""); }}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">اختر المادة</option>
                    {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {availableLessons.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-right flex items-center gap-1 justify-end">
                      <Filter className="w-3.5 h-3.5" />
                      الدرس (اختياري)
                    </label>
                    <select 
                      value={lesson} 
                      onChange={e => setLesson(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">المنهج كامل</option>
                      {availableLessons.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                )}
                {loadingLessons && (
                  <p className="text-xs text-muted-foreground text-center">جاري تحميل الدروس...</p>
                )}

                <div>
                  <label className="text-sm font-medium mb-1.5 block text-right">عدد الأسئلة</label>
                  <div className="flex gap-2 justify-center">
                    {[10, 15, 20].map(n => (
                      <button
                        key={n}
                        onClick={() => setQuestionCount(n)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          questionCount === n 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-background border-input hover:border-primary/50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={startPractice} className="w-full gap-2" size="lg">
                  <Zap className="w-4 h-4" />
                  ابدأ التدريب
                </Button>
              </div>
            </motion.div>
          ) : finished ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-card rounded-2xl border-2 border-primary/30 p-6 text-center">
                <div className="text-5xl mb-3">{getScoreEmoji()}</div>
                <h2 className="text-xl font-bold mb-1">انتهى التدريب!</h2>
                <p className="text-sm text-muted-foreground mb-4">{getScoreMessage()}</p>
                
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
                  <Button onClick={restart} className="flex-1 gap-2">
                    <RotateCcw className="w-4 h-4" /> تدريب جديد
                  </Button>
                  <Link to="/dashboard" className="flex-1">
                    <Button variant="outline" className="w-full">العودة</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : currentQ ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">سؤال {currentIndex + 1} من {questions.length}</span>
                  <div className="flex items-center gap-3">
                    {streak >= 2 && (
                      <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
                        🔥 {streak}
                      </span>
                    )}
                    <span className="text-xs font-bold text-primary">{score}/{total} صحيح</span>
                  </div>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Lesson badge */}
              {currentQ.lesson && (
                <div className="mb-3">
                  <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {currentQ.lesson}
                  </span>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="bg-card rounded-2xl border border-border p-5"
                >
                  <h3 className="font-bold text-sm mb-4 leading-relaxed">{currentQ.question_text}</h3>
                  
                  {currentQ.question_type === "mcq" && currentQ.options ? (
                    <div className="space-y-2">
                      {(currentQ.options as string[]).map((opt, j) => {
                        let cls = "bg-background border-input hover:border-primary/50 hover:bg-primary/5";
                        if (showResult) {
                          if (opt === currentQ.correct_answer) cls = "bg-green-50 dark:bg-green-950/30 border-green-500 text-green-700 dark:text-green-400";
                          else if (opt === selectedAnswer && opt !== currentQ.correct_answer) cls = "bg-red-50 dark:bg-red-950/30 border-destructive text-destructive";
                          else cls = "bg-background border-input opacity-60";
                        } else if (selectedAnswer === opt) {
                          cls = "bg-primary text-primary-foreground border-primary shadow-md";
                        }
                        return (
                          <motion.button
                            key={j}
                            whileTap={!showResult ? { scale: 0.98 } : {}}
                            onClick={() => !showResult && setSelectedAnswer(opt)}
                            disabled={showResult}
                            className={`w-full text-right px-4 py-3 rounded-xl border text-sm transition-all duration-200 flex items-center gap-2 ${cls}`}
                          >
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
                      <Button onClick={checkAnswer} disabled={!selectedAnswer} className="w-full" size="lg">
                        تحقق من الإجابة
                      </Button>
                    ) : (
                      <Button onClick={nextQuestion} className="w-full gap-2" size="lg">
                        {currentIndex + 1 >= questions.length ? (
                          <><Trophy className="w-4 h-4" /> عرض النتيجة</>
                        ) : (
                          <>السؤال التالي <ArrowLeft className="w-4 h-4" /></>
                        )}
                      </Button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default QuestionBank;
