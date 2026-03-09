import { useState } from "react";
import { CheckCircle, XCircle, Key, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const subjects = [
  { name: "التفسير", gradient: ["#1a3a5c", "#2d5f8a"], shape: "pointed" as const },
  { name: "الحديث الشريف", gradient: ["#0f4a2a", "#1a7a45"], shape: "star" as const },
  { name: "التوحيد", gradient: ["#5c4a1a", "#8a7a3a"], shape: "dome" as const },
  { name: "الفقه", gradient: ["#6b4a2a", "#a07850"], shape: "horseshoe" as const },
  { name: "السيرة النبوية", gradient: ["#3a2a4a", "#6a4a8a"], shape: "ogee" as const },
];

const ArchSvg = ({ shape, gradient, isHovered }: { shape: string; gradient: string[]; isHovered: boolean }) => {
  const paths: Record<string, string> = {
    pointed: "M25,130 L25,55 Q50,5 75,55 L75,130 Z",
    star: "M50,8 L58,30 L82,22 L68,44 L90,62 L66,60 L50,82 L34,60 L10,62 L32,44 L18,22 L42,30 Z",
    dome: "M22,130 L22,50 Q22,5 50,5 Q78,5 78,50 L78,130 Z",
    horseshoe: "M18,130 L18,52 Q18,5 50,5 Q82,5 82,52 L82,130 Z",
    ogee: "M25,130 L25,65 Q25,40 37,28 Q47,15 50,5 Q53,15 63,28 Q75,40 75,65 L75,130 Z",
  };
  const isStarShape = shape === "star";
  const gradId = `grad-${shape}`;

  return (
    <motion.svg
      viewBox="0 0 100 140"
      className="w-28 h-36 mx-auto drop-shadow-lg"
      animate={{ scale: isHovered ? 1.08 : 1, y: isHovered ? -4 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={gradient[1]} />
          <stop offset="100%" stopColor={gradient[0]} />
        </linearGradient>
        <filter id={`shadow-${shape}`}>
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={gradient[0]} floodOpacity="0.3" />
        </filter>
      </defs>
      <path d={paths[shape]} fill={`url(#${gradId})`} filter={`url(#shadow-${shape})`} />
      {isStarShape && <rect x="35" y="82" width="30" height="48" rx="3" fill={`url(#${gradId})`} />}
      {/* Decorative line */}
      <line x1="50" y1={isStarShape ? "8" : "5"} x2="50" y2={isStarShape ? "130" : "130"} stroke="white" strokeWidth="1" opacity="0.15" />
      {/* Keyhole decoration */}
      <motion.circle
        cx="50" cy={isStarShape ? "105" : "85"} r="4"
        fill="none" stroke="white" strokeWidth="1.5" opacity="0.8"
        animate={{ scale: isHovered ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0 }}
      />
      <line x1="50" y1={isStarShape ? "109" : "89"} x2="50" y2={isStarShape ? "122" : "108"} stroke="white" strokeWidth="1.5" opacity="0.8" />
      {/* Shine effect */}
      {isHovered && (
        <motion.rect
          x="0" y="0" width="100" height="140" rx="5"
          fill="white" opacity="0"
          animate={{ opacity: [0, 0.08, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
};

// Fetch questions from multiple sources
const fetchQuestion = async (subjectName: string, grade: string): Promise<any | null> => {
  const sources: (() => Promise<any | null>)[] = [];

  // Source 1: AI-generated question
  sources.push(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-competition-question", {
        body: { grade: grade || "الصف الأول الإعدادي", subjects: [subjectName] },
      });
      if (!error && data?.question_text && data?.options) {
        return { question_text: data.question_text, options: data.options, correct_answer: data.correct_answer, subject: subjectName };
      }
    } catch (e) { console.error("AI source failed:", e); }
    return null;
  });

  // Source 2: Question bank (practice questions)
  sources.push(async () => {
    try {
      const { data } = await supabase.rpc("get_practice_questions", { p_grade: grade || "الصف الأول الإعدادي", p_subject: subjectName });
      if (data && (data as any[]).length > 0) {
        const q = (data as any[])[Math.floor(Math.random() * (data as any[]).length)];
        return { question_text: q.question_text, options: q.options, correct_answer: q.correct_answer, subject: subjectName };
      }
    } catch (e) { console.error("Question bank failed:", e); }
    return null;
  });

  // Source 3: Video homework questions
  sources.push(async () => {
    try {
      const { data: vids } = await supabase.from("videos").select("id").eq("grade", grade || "الصف الأول الإعدادي").eq("subject", subjectName);
      if (!vids || vids.length === 0) return null;
      const videoIds = vids.map((v: any) => v.id);
      const { data: homeworks } = await supabase.from("video_homework").select("questions").in("video_id", videoIds);
      if (!homeworks) return null;
      const allQuestions: any[] = [];
      for (const hw of homeworks) {
        if (hw.questions && Array.isArray(hw.questions)) {
          for (const q of hw.questions as any[]) {
            if (q.text && q.options && q.options.length >= 2 && typeof q.correct === "number") {
              allQuestions.push(q);
            }
          }
        }
      }
      if (allQuestions.length === 0) return null;
      const randomQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
      return {
        question_text: randomQ.text,
        options: randomQ.options,
        correct_answer: randomQ.options[randomQ.correct],
        subject: subjectName,
      };
    } catch (e) { console.error("Video homework failed:", e); }
    return null;
  });

  // Shuffle sources for variety, but try AI first
  const shuffledFallbacks = sources.slice(1).sort(() => Math.random() - 0.5);
  const ordered = [sources[0], ...shuffledFallbacks];

  for (const source of ordered) {
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

  const noActiveComp = !activeComp;

  const handleSubjectSelect = async (subjectName: string) => {
    if (todayPlayed) return;
    if (noActiveComp) {
      toast({ title: "لا توجد مسابقة", description: "لا توجد مسابقة نشطة حالياً", variant: "destructive" });
      return;
    }
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

    const q = await fetchQuestion(subjectName, grade);
    if (q) {
      setQuestion(q);
      setSelectedAnswer("");
      setShowResult(false);
    } else {
      toast({ title: "حدث خطأ", description: "لم نتمكن من إنشاء سؤال، حاول مرة أخرى", variant: "destructive" });
      setSelectedSubject(null);
    }
    setGeneratingQuestion(false);
  };

  const submitAnswer = async () => {
    if (!question || !activeComp) return;
    const correct = selectedAnswer === question.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);
    onTodayPlayed();

    await supabase.from("competition_entries" as any).insert({
      user_id: userId, competition_id: activeComp.id, question_text: question.question_text,
      options: question.options, correct_answer: question.correct_answer,
      selected_answer: selectedAnswer, is_correct: correct, entry_date: new Date().toISOString().split("T")[0],
    } as any);
  };

  const resetToSubjects = () => {
    setSelectedSubject(null);
    setQuestion(null);
    setShowResult(false);
    setSelectedAnswer("");
  };

  // Show question flow
  if (selectedSubject && (generatingQuestion || question)) {
    const subjectData = subjects.find(s => s.name === selectedSubject);
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
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
            <motion.div
              className="w-16 h-16 border-4 border-t-transparent rounded-full mx-auto mb-5"
              style={{ borderColor: subjectData?.gradient[1], borderTopColor: "transparent" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="font-bold text-lg">جاري تحضير سؤال في {selectedSubject}...</p>
            <p className="text-sm text-muted-foreground mt-2">يتم البحث في بنك الأسئلة والذكاء الاصطناعي 🧠</p>
          </motion.div>
        ) : question ? (
          <AnimatePresence mode="wait">
            <motion.div key="q" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 20 }}>
              <div className="bg-card rounded-2xl border border-border p-5 mb-4 overflow-hidden relative">
                {/* Subtle colored top bar */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${subjectData?.gradient[0]}, ${subjectData?.gradient[1]})` }} />
                <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white inline-block mb-3"
                  style={{ background: `linear-gradient(135deg, ${subjectData?.gradient[0]}, ${subjectData?.gradient[1]})` }}>
                  {selectedSubject}
                </span>
                <h3 className="font-bold text-base leading-relaxed mb-4">{question.question_text}</h3>
                <div className="space-y-2.5">
                  {(question.options as string[])?.map((opt: string, j: number) => {
                    let cls = "bg-muted/50 border-transparent hover:border-primary/30 hover:bg-muted";
                    if (showResult) {
                      if (opt === question.correct_answer) cls = "bg-green-50 dark:bg-green-950/30 border-green-500";
                      else if (opt === selectedAnswer && !isCorrect) cls = "bg-red-50 dark:bg-red-950/30 border-red-500";
                    } else if (selectedAnswer === opt) {
                      cls = "bg-primary/10 border-primary";
                    }
                    return (
                      <motion.button
                        key={j}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: j * 0.08 }}
                        onClick={() => !showResult && setSelectedAnswer(opt)}
                        disabled={showResult}
                        className={`w-full text-right px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${cls}`}
                      >
                        {showResult && opt === question.correct_answer && <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />}
                        {showResult && opt === selectedAnswer && opt !== question.correct_answer && <XCircle className="w-4 h-4 inline ml-2 text-red-500" />}
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {showResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", damping: 15 }}
                  className={`rounded-2xl p-6 text-center ${isCorrect ? "bg-green-50 dark:bg-green-950/30 border-2 border-green-500" : "bg-red-50 dark:bg-red-950/30 border-2 border-red-500"}`}
                >
                  {isCorrect ? (
                    <>
                      <motion.div className="text-5xl mb-3" animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 0.6 }}>🎉</motion.div>
                      <p className="font-bold text-green-700 dark:text-green-400 text-lg">إجابة صحيحة!</p>
                      <p className="text-sm text-green-600 dark:text-green-500 mt-1">تم دخولك السحب الأسبوعي</p>
                    </>
                  ) : (
                    <>
                      <motion.div className="text-5xl mb-3" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5 }}>😔</motion.div>
                      <p className="font-bold text-red-700 dark:text-red-400 text-lg">إجابة خاطئة</p>
                      <p className="text-sm text-muted-foreground mt-1">حظ أفضل في المرة القادمة! 💪</p>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  <Button onClick={submitAnswer} disabled={!selectedAnswer} className="w-full h-12 text-base rounded-xl">
                    تأكيد الإجابة
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    );
  }

  // Subject selection view
  const isDisabled = todayPlayed || keysCount <= 0 || noActiveComp;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div className="text-right mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold mb-1">ابدأ التحدي</h2>
        <p className="text-muted-foreground text-sm">اختر الباب</p>
      </motion.div>

      {noActiveComp ? (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-500/20 p-4 text-center mb-6">
          <p className="font-bold text-sm">لا توجد مسابقة نشطة حالياً</p>
          <p className="text-xs text-muted-foreground">ترقب المسابقة القادمة! 🌟</p>
        </motion.div>
      ) : todayPlayed ? (
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
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        {subjects.map((subject, i) => (
          <motion.button
            key={subject.name}
            initial={{ opacity: 0, y: 25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 18 }}
            onClick={() => handleSubjectSelect(subject.name)}
            onHoverStart={() => !isDisabled && setHoveredCard(i)}
            onHoverEnd={() => setHoveredCard(null)}
            onTouchStart={() => !isDisabled && setHoveredCard(i)}
            onTouchEnd={() => setHoveredCard(null)}
            disabled={isDisabled}
            className={`relative bg-card rounded-2xl p-4 pt-6 pb-5 flex flex-col items-center gap-3 border border-border shadow-sm transition-shadow overflow-hidden ${
              isDisabled ? "opacity-40 cursor-not-allowed" : "hover:shadow-xl cursor-pointer"
            } ${subjects.length % 2 !== 0 && i === subjects.length - 1 ? "col-span-2 max-w-[55%] mx-auto" : ""}`}
          >
            {/* Subtle gradient glow on hover */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 30%, ${subject.gradient[1]}15, transparent 70%)` }}
              animate={{ opacity: hoveredCard === i ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
            <ArchSvg shape={subject.shape} gradient={subject.gradient} isHovered={hoveredCard === i} />
            <motion.span
              className="text-sm font-bold relative z-10"
              animate={{ scale: hoveredCard === i ? 1.05 : 1 }}
            >
              {subject.name}
            </motion.span>
          </motion.button>
        ))}
      </div>

      {/* Competition info */}
      {activeComp && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-6 bg-card/50 rounded-2xl border border-border p-4 text-center"
        >
          <p className="text-xs text-muted-foreground">
            🎁 {activeComp.prize_description} • من {new Date(activeComp.week_start).toLocaleDateString("ar-EG")} إلى {new Date(activeComp.week_end).toLocaleDateString("ar-EG")}
          </p>
        </motion.div>
      )}

      {/* My entries */}
      {myEntries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="mt-4 bg-card rounded-2xl border border-border p-4">
          <h4 className="text-xs font-bold mb-2">مشاركاتك هذا الأسبوع:</h4>
          <div className="space-y-1.5">
            {myEntries.map((e: any) => (
              <div key={e.id} className="flex items-center gap-2 text-xs">
                {e.is_correct ? <CheckCircle className="w-3 h-3 text-green-600 shrink-0" /> : <XCircle className="w-3 h-3 text-red-500 shrink-0" />}
                <span className="text-muted-foreground">{new Date(e.created_at).toLocaleDateString("ar-EG")}</span>
                <span>{e.is_correct ? "دخلت السحب ✅" : "لم تدخل السحب"}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CompetitionPlayTab;
