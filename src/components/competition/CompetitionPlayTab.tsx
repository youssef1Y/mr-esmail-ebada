import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle, XCircle, Key, Clock, Zap, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const subjects = [
  { name: "التفسير", gradient: ["#1a3a5c", "#2d5f8a"], shape: "pointed" as const, emoji: "📖" },
  { name: "الحديث الشريف", gradient: ["#0f4a2a", "#1a7a45"], shape: "star" as const, emoji: "📜" },
  { name: "التوحيد", gradient: ["#5c4a1a", "#8a7a3a"], shape: "dome" as const, emoji: "🕌" },
  { name: "الفقه", gradient: ["#6b4a2a", "#a07850"], shape: "horseshoe" as const, emoji: "⚖️" },
  { name: "السيرة النبوية", gradient: ["#3a2a4a", "#6a4a8a"], shape: "ogee" as const, emoji: "🌙" },
];

const QUESTION_TIME_SECONDS = 30;

// Confetti particle component
const Confetti = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    color: ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"][i % 6],
    size: 4 + Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[200]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: "-5%",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: window.innerHeight * 1.2,
            opacity: [1, 1, 0],
            rotate: Math.random() * 720 - 360,
            x: [0, (Math.random() - 0.5) * 200],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
};

// Countdown timer ring
const CountdownRing = ({ timeLeft, total }: { timeLeft: number; total: number }) => {
  const progress = timeLeft / total;
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference * (1 - progress);
  const isUrgent = timeLeft <= 10;
  const isDanger = timeLeft <= 5;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/30" />
        <motion.circle
          cx="24" cy="24" r="22" fill="none"
          strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={isDanger ? "text-red-500" : isUrgent ? "text-amber-500" : "text-primary"}
          animate={isDanger ? { opacity: [1, 0.5, 1] } : {}}
          transition={isDanger ? { duration: 0.5, repeat: Infinity } : {}}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className={`text-sm font-bold tabular-nums ${isDanger ? "text-red-500" : isUrgent ? "text-amber-500" : "text-foreground"}`}
          animate={isDanger ? { scale: [1, 1.15, 1] } : {}}
          transition={isDanger ? { duration: 0.5, repeat: Infinity } : {}}
        >
          {timeLeft}
        </motion.span>
      </div>
    </div>
  );
};

// Arch SVG for subject cards
const ArchSvg = ({ shape, gradient, isHovered }: { shape: string; gradient: string[]; isHovered: boolean }) => {
  const paths: Record<string, string> = {
    pointed: "M25,130 L25,55 Q50,5 75,55 L75,130 Z",
    star: "M50,8 L58,30 L82,22 L68,44 L90,62 L66,60 L50,82 L34,60 L10,62 L32,44 L18,22 L42,30 Z",
    dome: "M22,130 L22,50 Q22,5 50,5 Q78,5 78,50 L78,130 Z",
    horseshoe: "M18,130 L18,52 Q18,5 50,5 Q82,5 82,52 L82,130 Z",
    ogee: "M25,130 L25,65 Q25,40 37,28 Q47,15 50,5 Q53,15 63,28 Q75,40 75,65 L75,130 Z",
  };
  const isStarShape = shape === "star";
  const gradId = `grad-${shape}-${gradient[0].replace("#", "")}`;

  return (
    <motion.svg
      viewBox="0 0 100 140"
      className="w-24 h-32 mx-auto drop-shadow-lg"
      animate={{ scale: isHovered ? 1.1 : 1, y: isHovered ? -6 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={gradient[1]} />
          <stop offset="100%" stopColor={gradient[0]} />
        </linearGradient>
        <filter id={`glow-${shape}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={paths[shape]} fill={`url(#${gradId})`} filter={isHovered ? `url(#glow-${shape})` : undefined} />
      {isStarShape && <rect x="35" y="82" width="30" height="48" rx="3" fill={`url(#${gradId})`} />}
      <line x1="50" y1={isStarShape ? "8" : "5"} x2="50" y2="130" stroke="white" strokeWidth="1" opacity="0.15" />
      <motion.circle
        cx="50" cy={isStarShape ? "105" : "85"} r="4"
        fill="none" stroke="white" strokeWidth="1.5" opacity="0.8"
        animate={{ scale: isHovered ? [1, 1.4, 1] : 1, opacity: isHovered ? [0.8, 1, 0.8] : 0.8 }}
        transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0 }}
      />
      <line x1="50" y1={isStarShape ? "109" : "89"} x2="50" y2={isStarShape ? "122" : "108"} stroke="white" strokeWidth="1.5" opacity="0.8" />
      {isHovered && (
        <motion.rect
          x="0" y="0" width="100" height="140" rx="5"
          fill="white" opacity="0"
          animate={{ opacity: [0, 0.12, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
};

// Fetch questions: prioritize teacher-created content over AI
const fetchQuestion = async (subjectName: string, grade: string): Promise<any | null> => {
  const g = grade || "الصف الأول الإعدادي";

  const fromQuestionBank = async () => {
    try {
      const { data } = await supabase.rpc("get_competition_question", { p_grade: g, p_subject: subjectName });
      if (data && (data as any[]).length > 0) {
        const q = (data as any[])[0];
        const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
        let optionsList: string[];
        if (Array.isArray(opts)) {
          optionsList = opts;
        } else if (typeof opts === "object") {
          optionsList = Object.values(opts).filter(v => typeof v === "string") as string[];
        } else {
          return null;
        }
        if (optionsList.length >= 2 && q.correct_answer) {
          return { question_text: q.question_text, options: optionsList, correct_answer: q.correct_answer, subject: subjectName };
        }
      }
    } catch (e) { console.error("Question bank failed:", e); }
    return null;
  };

  const fromVideoHomework = async () => {
    try {
      const { data: vids } = await supabase.from("videos").select("id").eq("grade", g).eq("subject", subjectName);
      if (!vids || vids.length === 0) return null;
      const videoIds = vids.map((v: any) => v.id);
      const { data: homeworks } = await supabase.from("video_homework").select("questions").in("video_id", videoIds);
      if (!homeworks) return null;
      const allQuestions: any[] = [];
      for (const hw of homeworks) {
        if (hw.questions && Array.isArray(hw.questions)) {
          for (const q of hw.questions as any[]) {
            if (q.question && q.options && q.options.length >= 2 && typeof q.correct === "number") {
              allQuestions.push(q);
            }
          }
        }
      }
      if (allQuestions.length === 0) return null;
      const randomQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
      return { question_text: randomQ.question, options: randomQ.options, correct_answer: randomQ.options[randomQ.correct], subject: subjectName };
    } catch (e) { console.error("Video homework failed:", e); }
    return null;
  };

  const fromVideoExams = async () => {
    try {
      const { data: questions } = await supabase.rpc("get_competition_exam_questions" as any, { p_grade: g, p_subject: subjectName });
      if (!questions || (questions as any[]).length === 0) return null;
      const valid = (questions as any[]).filter((q: any) => q.question_text && q.options && q.correct_answer);
      if (valid.length === 0) return null;
      const randomQ = valid[Math.floor(Math.random() * valid.length)];
      const opts = typeof randomQ.options === "string" ? JSON.parse(randomQ.options) : randomQ.options;
      const optionsList = Array.isArray(opts) ? opts : Object.values(opts).filter(v => typeof v === "string");
      if (optionsList.length < 2) return null;
      return { question_text: randomQ.question_text, options: optionsList as string[], correct_answer: randomQ.correct_answer, subject: subjectName };
    } catch (e) { console.error("Video exams failed:", e); }
    return null;
  };

  const fromAI = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-competition-question", {
        body: { grade: g, subjects: [subjectName] },
      });
      if (!error && data?.question_text && data?.options) {
        return { question_text: data.question_text, options: data.options, correct_answer: data.correct_answer, subject: subjectName };
      }
    } catch (e) { console.error("AI source failed:", e); }
    return null;
  };

  const sources = [fromQuestionBank, fromVideoHomework, fromVideoExams, fromAI];
  for (const source of sources) {
    const result = await source();
    if (result) return result;
  }
  return null;
};

interface PlayTabProps {
  keysCount: number;
  activeComp: any;
  todayPlayed: boolean;
  grade: string;
  userId: string;
  myEntries: any[];
  onKeyUsed: () => void;
  onTodayPlayed: () => void;
}

const CompetitionPlayTab = ({
  keysCount, activeComp, todayPlayed, grade, userId, myEntries, onKeyUsed, onTodayPlayed,
}: PlayTabProps) => {
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load streak from entries
  useEffect(() => {
    if (myEntries.length > 0) {
      let s = 0;
      for (const entry of myEntries) {
        if ((entry as any).is_correct) s++;
        else break;
      }
      setStreak(s);
    }
  }, [myEntries]);

  // Countdown timer
  useEffect(() => {
    if (question && !showResult && !generatingQuestion) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - auto submit with wrong answer
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question, showResult, generatingQuestion]);

  // Handle time up
  useEffect(() => {
    if (timeLeft === 0 && question && !showResult) {
      handleTimeUp();
    }
  }, [timeLeft]);

  const handleTimeUp = useCallback(async () => {
    if (!question || showResult) return;
    setIsCorrect(false);
    setShowResult(true);
    setStreak(0);
    onTodayPlayed();

    if (activeComp) {
      await supabase.from("competition_entries" as any).insert({
        user_id: userId, competition_id: activeComp.id, question_text: question.question_text,
        options: question.options, correct_answer: question.correct_answer,
        selected_answer: "انتهى الوقت", is_correct: false, entry_date: new Date().toISOString().split("T")[0],
      } as any);
    }
  }, [question, showResult, activeComp, userId, onTodayPlayed]);

  const handleSubjectSelect = async (subjectName: string) => {
    if (todayPlayed) return;
    if (keysCount <= 0) {
      toast({ title: "لا توجد مفاتيح", description: "شارك رابط المنصة للحصول على مفاتيح!", variant: "destructive" });
      return;
    }

    const { data: keyUsed } = await supabase.rpc("use_key", { p_user_id: userId });
    if (!keyUsed) {
      toast({ title: "خطأ", description: "لا توجد مفاتيح كافية", variant: "destructive" });
      return;
    }

    onKeyUsed();
    setSelectedSubject(subjectName);
    setGeneratingQuestion(true);
    setTimeLeft(QUESTION_TIME_SECONDS);

    const q = await fetchQuestion(subjectName, grade);
    if (q) {
      setQuestion(q);
      setSelectedAnswer("");
      setShowResult(false);
      setTimeLeft(QUESTION_TIME_SECONDS);
    } else {
      toast({ title: "حدث خطأ", description: "لم نتمكن من إنشاء سؤال، حاول مرة أخرى", variant: "destructive" });
      setSelectedSubject(null);
    }
    setGeneratingQuestion(false);
  };

  const submitAnswer = async () => {
    if (!question) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = selectedAnswer === question.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);
    onTodayPlayed();

    if (correct) {
      setStreak(s => s + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      setStreak(0);
    }

    if (activeComp) {
      await supabase.from("competition_entries" as any).insert({
        user_id: userId, competition_id: activeComp.id, question_text: question.question_text,
        options: question.options, correct_answer: question.correct_answer,
        selected_answer: selectedAnswer, is_correct: correct, entry_date: new Date().toISOString().split("T")[0],
      } as any);
    }
  };

  const resetToSubjects = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedSubject(null);
    setQuestion(null);
    setShowResult(false);
    setSelectedAnswer("");
    setTimeLeft(QUESTION_TIME_SECONDS);
  };

  // Question flow view
  if (selectedSubject && (generatingQuestion || question)) {
    const subjectData = subjects.find(s => s.name === selectedSubject);
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        {showConfetti && <Confetti />}
        
        <motion.button
          onClick={resetToSubjects}
          className="text-sm text-muted-foreground mb-5 flex items-center gap-1 hover:text-foreground transition-colors"
          disabled={generatingQuestion}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          ← العودة للمواد
        </motion.button>

        {generatingQuestion ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-t-transparent"
                style={{ borderColor: subjectData?.gradient[1], borderTopColor: "transparent" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-2 rounded-full border-4 border-b-transparent"
                style={{ borderColor: subjectData?.gradient[0], borderBottomColor: "transparent" }}
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {subjectData?.emoji}
              </div>
            </div>
            <p className="font-bold text-lg">جاري تحضير سؤال في {selectedSubject}...</p>
            <p className="text-sm text-muted-foreground mt-2">يتم البحث في بنك الأسئلة 📚</p>
          </motion.div>
        ) : question ? (
          <AnimatePresence mode="wait">
            <motion.div key="q" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 20 }}>
              {/* Question card */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden relative">
                {/* Top gradient bar */}
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${subjectData?.gradient[0]}, ${subjectData?.gradient[1]})` }} />
                
                <div className="p-5">
                  {/* Header: subject badge + timer */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full text-white"
                      style={{ background: `linear-gradient(135deg, ${subjectData?.gradient[0]}, ${subjectData?.gradient[1]})` }}>
                      {subjectData?.emoji} {selectedSubject}
                    </span>
                    {!showResult && <CountdownRing timeLeft={timeLeft} total={QUESTION_TIME_SECONDS} />}
                  </div>
                  
                  <h3 className="font-bold text-base leading-relaxed mb-5">{question.question_text}</h3>
                  
                  {/* Options */}
                  <div className="space-y-2.5">
                    {(question.options as string[])?.map((opt: string, j: number) => {
                      const optLetter = String.fromCharCode(0x0623 + j); // أ، ب، ج، د
                      let cls = "bg-muted/40 border-transparent hover:border-primary/30 hover:bg-muted/60";
                      let iconEl: React.ReactNode = null;

                      if (showResult) {
                        if (opt === question.correct_answer) {
                          cls = "bg-green-50 dark:bg-green-950/30 border-green-500 shadow-sm shadow-green-500/10";
                          iconEl = <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />;
                        } else if (opt === selectedAnswer && !isCorrect) {
                          cls = "bg-red-50 dark:bg-red-950/30 border-red-500 shadow-sm shadow-red-500/10";
                          iconEl = <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
                        }
                      } else if (selectedAnswer === opt) {
                        cls = "bg-primary/10 border-primary shadow-sm shadow-primary/10";
                      }

                      return (
                        <motion.button
                          key={j}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: j * 0.1, type: "spring", stiffness: 200 }}
                          onClick={() => !showResult && timeLeft > 0 && setSelectedAnswer(opt)}
                          disabled={showResult || timeLeft === 0}
                          className={`w-full flex items-center gap-3 text-right px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${cls}`}
                        >
                          <span className="w-7 h-7 rounded-lg bg-background/80 flex items-center justify-center text-xs font-bold shrink-0">
                            {optLetter}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {iconEl}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Result or Submit */}
              <div className="mt-4">
                {showResult ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    {isCorrect ? (
                      <div className="rounded-2xl p-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-2 border-green-500">
                        <motion.div className="text-6xl mb-3" animate={{ scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] }} transition={{ duration: 0.8, type: "spring" }}>
                          🎉
                        </motion.div>
                        <p className="font-bold text-lg" style={{ color: "hsl(var(--primary))" }}>إجابة صحيحة! ممتاز!</p>
                        <p className="text-sm text-muted-foreground mt-1">تم دخولك السحب الأسبوعي 🏆</p>
                        {streak > 1 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-3 inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full px-4 py-1.5 text-sm font-bold"
                          >
                            <Zap className="w-4 h-4" />
                            سلسلة {streak} إجابات صحيحة! 🔥
                          </motion.div>
                        )}
                        {timeLeft > 0 && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-xs text-muted-foreground mt-2"
                          >
                            أجبت في {QUESTION_TIME_SECONDS - timeLeft} ثانية ⚡
                          </motion.p>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl p-6 text-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-2 border-red-400">
                        <motion.div className="text-6xl mb-3" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6 }}>
                          {timeLeft === 0 ? "⏰" : "😔"}
                        </motion.div>
                        <p className="font-bold text-lg text-red-700 dark:text-red-400">
                          {timeLeft === 0 ? "انتهى الوقت!" : "إجابة خاطئة"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">حظ أفضل في المرة القادمة! 💪</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <Button
                      onClick={submitAnswer}
                      disabled={!selectedAnswer || timeLeft === 0}
                      className="w-full h-13 text-base rounded-xl font-bold gap-2"
                      style={selectedAnswer ? {
                        background: `linear-gradient(135deg, ${subjectData?.gradient[0]}, ${subjectData?.gradient[1]})`,
                      } : undefined}
                    >
                      {timeLeft === 0 ? "انتهى الوقت" : "تأكيد الإجابة ✓"}
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    );
  }

  // Subject selection view
  const isDisabled = todayPlayed || keysCount <= 0;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div className="text-right mb-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold mb-1">ابدأ التحدي</h2>
        <p className="text-muted-foreground text-sm">اختر باب المادة واستعد للسؤال</p>
      </motion.div>

      {/* Stats bar */}
      {myEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-5 bg-card rounded-xl border border-border p-3"
        >
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-foreground">{myEntries.length}</p>
            <p className="text-[10px] text-muted-foreground">مشاركاتك</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex-1 text-center">
            <p className="text-lg font-bold" style={{ color: "hsl(var(--primary))" }}>
              {myEntries.filter((e: any) => e.is_correct).length}
            </p>
            <p className="text-[10px] text-muted-foreground">إجابات صحيحة</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{streak}</p>
            <p className="text-[10px] text-muted-foreground">سلسلة 🔥</p>
          </div>
        </motion.div>
      )}

      {todayPlayed ? (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5 text-center mb-6">
          <CheckCircle className="w-10 h-10 text-primary mx-auto mb-2" />
          <p className="font-bold">لقد شاركت اليوم بالفعل!</p>
          <p className="text-sm text-muted-foreground">عُد غداً لسؤال جديد 🌟</p>
        </motion.div>
      ) : keysCount <= 0 ? (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5 text-center mb-6">
          <Key className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="font-bold">تحتاج مفتاح واحد على الأقل</p>
          <p className="text-sm text-muted-foreground">شارك رابط المنصة للحصول على مفاتيح!</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-500/20 rounded-xl px-4 py-2.5 mb-5"
        >
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{QUESTION_TIME_SECONDS} ثانية</span> للإجابة على كل سؤال
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {subjects.map((subject, i) => (
          <motion.button
            key={subject.name}
            initial={{ opacity: 0, y: 25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 18 }}
            onClick={() => handleSubjectSelect(subject.name)}
            onMouseEnter={() => !isDisabled && setHoveredCard(i)}
            onMouseLeave={() => setHoveredCard(null)}
            onTouchStart={() => !isDisabled && setHoveredCard(i)}
            onTouchEnd={() => setTimeout(() => setHoveredCard(null), 300)}
            disabled={isDisabled}
            className={`relative bg-card rounded-2xl p-4 pt-5 pb-4 flex flex-col items-center gap-2 border border-border shadow-sm transition-shadow overflow-hidden ${
              isDisabled ? "opacity-40 cursor-not-allowed" : "hover:shadow-xl active:scale-[0.97] cursor-pointer"
            } ${subjects.length % 2 !== 0 && i === subjects.length - 1 ? "col-span-2 max-w-[55%] mx-auto" : ""}`}
          >
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 30%, ${subject.gradient[1]}18, transparent 70%)` }}
              animate={{ opacity: hoveredCard === i ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
            <ArchSvg shape={subject.shape} gradient={subject.gradient} isHovered={hoveredCard === i} />
            <p className="font-bold text-sm text-foreground relative z-10">{subject.name}</p>
          </motion.button>
        ))}
      </div>

      {/* My entries history */}
      {myEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <h3 className="text-sm font-bold text-muted-foreground mb-3">سجل مشاركاتك</h3>
          <div className="space-y-2">
            {myEntries.slice(0, 5).map((entry: any, i: number) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-3 flex items-center gap-3"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  entry.is_correct ? "bg-green-100 dark:bg-green-950/30" : "bg-red-100 dark:bg-red-950/30"
                }`}>
                  {entry.is_correct ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{entry.question_text}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CompetitionPlayTab;
