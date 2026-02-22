import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, CheckCircle, XCircle, RotateCcw, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const QuestionBank = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("grade").eq("user_id", session.user.id).single();
      if (profile) setGrade(profile.grade);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const startPractice = async () => {
    if (!subject) {
      toast({ title: "خطأ", description: "اختر المادة أولاً", variant: "destructive" });
      return;
    }
    const { data } = await supabase.rpc("get_practice_questions", { p_grade: grade, p_subject: subject });
    if (!data || data.length === 0) {
      toast({ title: "لا توجد أسئلة", description: "لم يتم إضافة أسئلة لهذه المادة بعد" });
      return;
    }
    // Shuffle and pick 10 questions (already randomized by RPC)
    const shuffled = (data as BankQuestion[]).slice(0, 10);
    setQuestions(shuffled);
    setStarted(true);
    setCurrentIndex(0);
    setScore(0);
    setTotal(0);
    setFinished(false);
  };

  const checkAnswer = () => {
    const q = questions[currentIndex];
    const correct = q.correct_answer === selectedAnswer;
    if (correct) setScore(s => s + 1);
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {!started ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold font-amiri mb-2">بنك الأسئلة</h1>
            <p className="text-sm text-muted-foreground mb-6">تدرّب على أسئلة عشوائية من المنهج</p>
            <div className="bg-card rounded-2xl border border-border p-6 max-w-md mx-auto space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">الصف: {grade}</label>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">اختر المادة</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر المادة</option>
                  {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Button onClick={startPractice} className="w-full" size="lg">ابدأ التدريب</Button>
            </div>
          </div>
        ) : finished ? (
          <div className="bg-card rounded-2xl border-2 border-primary/30 p-8 text-center max-w-md mx-auto">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">انتهى التدريب!</h2>
            <div className="text-3xl font-bold text-primary mb-2">{score} / {total}</div>
            <p className="text-sm text-muted-foreground mb-6">نسبة الإجابات الصحيحة: {Math.round((score / total) * 100)}%</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={restart} className="gap-2">
                <RotateCcw className="w-4 h-4" /> تدريب جديد
              </Button>
              <Link to="/dashboard"><Button variant="outline">العودة</Button></Link>
            </div>
          </div>
        ) : currentQ ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground">سؤال {currentIndex + 1} من {questions.length}</span>
              <span className="text-xs font-bold text-primary">{score}/{total} صحيح</span>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-bold mb-4">{currentQ.question_text}</h3>
              {currentQ.question_type === "mcq" && currentQ.options ? (
                <div className="space-y-2">
                  {(currentQ.options as string[]).map((opt, j) => {
                    let cls = "bg-background border-border hover:border-primary/50";
                    if (showResult) {
                      if (opt === currentQ.correct_answer) cls = "bg-green-50 dark:bg-green-950/20 border-green-500";
                      else if (opt === selectedAnswer && opt !== currentQ.correct_answer) cls = "bg-red-50 dark:bg-red-950/20 border-destructive";
                    } else if (selectedAnswer === opt) {
                      cls = "bg-primary text-primary-foreground border-primary";
                    }
                    return (
                      <button
                        key={j}
                        onClick={() => !showResult && setSelectedAnswer(opt)}
                        disabled={showResult}
                        className={`w-full text-right px-4 py-3 rounded-lg border text-sm transition-colors ${cls}`}
                      >
                        {showResult && opt === currentQ.correct_answer && <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />}
                        {showResult && opt === selectedAnswer && opt !== currentQ.correct_answer && <XCircle className="w-4 h-4 inline ml-2 text-destructive" />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <div className="mt-4">
                {!showResult ? (
                  <Button onClick={checkAnswer} disabled={!selectedAnswer} className="w-full">تحقق من الإجابة</Button>
                ) : (
                  <Button onClick={nextQuestion} className="w-full">
                    {currentIndex + 1 >= questions.length ? "عرض النتيجة" : "السؤال التالي"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default QuestionBank;
