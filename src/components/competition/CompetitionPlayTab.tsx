import { useState } from "react";
import { CheckCircle, XCircle, Key, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const subjects = [
  { name: "التفسير", color: "#2C4A7C", shape: "pointed" as const },
  { name: "الحديث الشريف", color: "#1B6B3B", shape: "star" as const },
  { name: "التوحيد", color: "#7B6B2E", shape: "dome" as const },
  { name: "الفقه", color: "#A88B5E", shape: "horseshoe" as const },
  { name: "السيرة النبوية", color: "#5E4A3A", shape: "ogee" as const },
];

const ArchSvg = ({ shape, color }: { shape: string; color: string }) => {
  const paths: Record<string, string> = {
    pointed: "M25,130 L25,55 Q50,5 75,55 L75,130 Z",
    star: "M50,8 L58,30 L82,22 L68,44 L90,62 L66,60 L50,82 L34,60 L10,62 L32,44 L18,22 L42,30 Z",
    dome: "M22,130 L22,50 Q22,5 50,5 Q78,5 78,50 L78,130 Z",
    horseshoe: "M18,130 L18,52 Q18,5 50,5 Q82,5 82,52 L82,130 Z",
    ogee: "M25,130 L25,65 Q25,40 37,28 Q47,15 50,5 Q53,15 63,28 Q75,40 75,65 L75,130 Z",
  };

  const isStarShape = shape === "star";

  return (
    <svg viewBox="0 0 100 140" className="w-24 h-32 mx-auto">
      <path d={paths[shape]} fill={color} />
      {isStarShape && <rect x="35" y="82" width="30" height="48" rx="2" fill={color} />}
      <circle cx="50" cy={isStarShape ? "105" : "85"} r="3.5" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
      <line x1="50" y1={isStarShape ? "109" : "89"} x2="50" y2={isStarShape ? "122" : "108"} stroke="white" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
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

    // AI-generated question
    try {
      const { data: aiQuestion, error: aiError } = await supabase.functions.invoke("generate-competition-question", {
        body: { grade: grade || "الصف الأول الإعدادي", subjects: [subjectName] },
      });
      if (!aiError && aiQuestion?.question_text && aiQuestion?.options) {
        setQuestion({ question_text: aiQuestion.question_text, options: aiQuestion.options, correct_answer: aiQuestion.correct_answer, subject: subjectName });
        setSelectedAnswer("");
        setShowResult(false);
        setGeneratingQuestion(false);
        return;
      }
    } catch (e) { console.error("AI failed:", e); }

    // Fallback: question_bank
    try {
      const { data: questions } = await supabase.rpc("get_practice_questions", { p_grade: grade || "الصف الأول الإعدادي", p_subject: subjectName });
      if (questions && (questions as any[]).length > 0) {
        const randomQ = (questions as any[])[Math.floor(Math.random() * (questions as any[]).length)];
        setQuestion({ ...randomQ, subject: subjectName });
        setSelectedAnswer("");
        setShowResult(false);
        setGeneratingQuestion(false);
        return;
      }
    } catch (e) { console.error("Fallback failed:", e); }

    toast({ title: "حدث خطأ", description: "جاري المحاولة مرة أخرى", variant: "destructive" });
    setGeneratingQuestion(false);
    setSelectedSubject(null);
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

  if (!activeComp) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="font-bold text-lg mb-1">لا توجد مسابقة نشطة حالياً</p>
        <p className="text-sm text-muted-foreground">ترقب المسابقة القادمة!</p>
      </div>
    );
  }

  // Show question flow
  if (selectedSubject && (generatingQuestion || question)) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <button onClick={resetToSubjects} className="text-sm text-muted-foreground mb-4 flex items-center gap-1 hover:text-foreground transition-colors" disabled={generatingQuestion}>
          ← العودة للمواد
        </button>

        {generatingQuestion ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="font-bold">جاري إنشاء سؤال في {selectedSubject}...</p>
            <p className="text-sm text-muted-foreground mt-1">يتم استخدام الذكاء الاصطناعي 🧠</p>
          </motion.div>
        ) : question ? (
          <AnimatePresence mode="wait">
            <motion.div key="q" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-card rounded-2xl border border-border p-5 mb-4">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">{selectedSubject}</span>
                <h3 className="font-bold mt-3 mb-4 leading-relaxed">{question.question_text}</h3>
                <div className="space-y-2.5">
                  {(question.options as string[])?.map((opt: string, j: number) => {
                    let cls = "bg-muted/50 border-transparent hover:border-primary/30";
                    if (showResult) {
                      if (opt === question.correct_answer) cls = "bg-green-50 dark:bg-green-950/30 border-green-500";
                      else if (opt === selectedAnswer && !isCorrect) cls = "bg-red-50 dark:bg-red-950/30 border-red-500";
                    } else if (selectedAnswer === opt) {
                      cls = "bg-primary/10 border-primary";
                    }
                    return (
                      <button key={j} onClick={() => !showResult && setSelectedAnswer(opt)} disabled={showResult}
                        className={`w-full text-right px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${cls}`}>
                        {showResult && opt === question.correct_answer && <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />}
                        {showResult && opt === selectedAnswer && opt !== question.correct_answer && <XCircle className="w-4 h-4 inline ml-2 text-red-500" />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {showResult ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-2xl p-6 text-center ${isCorrect ? "bg-green-50 dark:bg-green-950/30 border-2 border-green-500" : "bg-red-50 dark:bg-red-950/30 border-2 border-red-500"}`}>
                  {isCorrect ? (
                    <>
                      <div className="text-4xl mb-2">🎉</div>
                      <p className="font-bold text-green-700 dark:text-green-400 text-lg">إجابة صحيحة!</p>
                      <p className="text-sm text-green-600 dark:text-green-500 mt-1">تم دخولك السحب الأسبوعي</p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">😔</div>
                      <p className="font-bold text-red-700 dark:text-red-400 text-lg">إجابة خاطئة</p>
                      <p className="text-sm text-muted-foreground mt-1">حظ أفضل في المرة القادمة! 💪</p>
                    </>
                  )}
                </motion.div>
              ) : (
                <Button onClick={submitAnswer} disabled={!selectedAnswer} className="w-full h-12 text-base rounded-xl">
                  تأكيد الإجابة
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    );
  }

  // Subject selection view
  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="text-right mb-6">
        <h2 className="text-xl font-bold mb-1">ابدأ التحدي</h2>
        <p className="text-muted-foreground text-sm">اختر الباب</p>
      </div>

      {todayPlayed ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-6 text-center mb-6">
          <CheckCircle className="w-10 h-10 text-primary mx-auto mb-2" />
          <p className="font-bold">لقد شاركت اليوم بالفعل!</p>
          <p className="text-sm text-muted-foreground">عُد غداً لسؤال جديد 🌟</p>
        </motion.div>
      ) : keysCount <= 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-6 text-center mb-6">
          <Key className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="font-bold">تحتاج مفتاح واحد على الأقل</p>
          <p className="text-sm text-muted-foreground">شارك رابط المنصة للحصول على مفاتيح!</p>
        </motion.div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {subjects.map((subject, i) => (
          <motion.button
            key={subject.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => handleSubjectSelect(subject.name)}
            disabled={todayPlayed || keysCount <= 0}
            className={`bg-card rounded-2xl p-4 pt-6 pb-5 flex flex-col items-center gap-3 border border-border shadow-sm transition-all ${
              todayPlayed || keysCount <= 0 ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            } ${subjects.length % 2 !== 0 && i === subjects.length - 1 ? "col-span-2 max-w-[50%] mx-auto" : ""}`}
          >
            <ArchSvg shape={subject.shape} color={subject.color} />
            <span className="text-sm font-bold">{subject.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Competition info */}
      <div className="mt-6 bg-card/50 rounded-2xl border border-border p-4 text-center">
        <p className="text-xs text-muted-foreground">
          🎁 {activeComp.prize_description} • من {new Date(activeComp.week_start).toLocaleDateString("ar-EG")} إلى {new Date(activeComp.week_end).toLocaleDateString("ar-EG")}
        </p>
      </div>

      {/* My entries */}
      {myEntries.length > 0 && (
        <div className="mt-4 bg-card rounded-2xl border border-border p-4">
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
        </div>
      )}
    </div>
  );
};

export default CompetitionPlayTab;
