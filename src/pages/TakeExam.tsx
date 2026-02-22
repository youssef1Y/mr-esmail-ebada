import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BookOpen, ChevronRight, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  sort_order: number;
}

interface Exam {
  id: string;
  title: string;
  grade: string;
  subject: string;
}

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; details: { questionId: string; correct: boolean; correctAnswer: string | null }[] } | null>(null);
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }

      // Check if already taken
      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select("id, score, total")
        .eq("exam_id", examId!)
        .eq("user_id", session.user.id);
      
      if (attempts && attempts.length > 0) {
        setAlreadyTaken(true);
        setResult({ score: attempts[0].score!, total: attempts[0].total!, details: [] });
      }

      // Fetch exam
      const { data: examData } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId!)
        .single();
      if (examData) setExam(examData);

      // Fetch questions WITHOUT correct_answer
      const { data: questionsData } = await supabase
        .from("exam_questions")
        .select("id, question_text, question_type, options, sort_order")
        .eq("exam_id", examId!)
        .order("sort_order", { ascending: true });
      if (questionsData) {
        setQuestions(questionsData.map(q => ({
          ...q,
          options: q.options as string[] | null,
        })));
      }

      setLoading(false);
    };
    init();
  }, [examId, navigate]);

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast({ title: "تنبيه", description: `يوجد ${unanswered.length} سؤال بدون إجابة`, variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      // Grade server-side via edge function
      const { data, error } = await supabase.functions.invoke("grade-exam", {
        body: { exam_id: examId, answers },
      });

      if (error || !data?.success) {
        toast({ title: "خطأ", description: data?.error || "حدث خطأ في التصحيح", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      setResult({ score: data.score, total: data.total, details: data.details });
      toast({ title: "تم تسليم الامتحان بنجاح" });
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ في التصحيح", variant: "destructive" });
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">منصة الأستاذ إسماعيل</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronRight className="w-4 h-4" />
              الرجوع
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {exam && (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-amiri mb-1">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">{exam.grade} · {exam.subject}</p>
            <p className="text-xs text-muted-foreground mt-1">{questions.length} سؤال</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-card rounded-2xl border-2 border-primary/30 p-6 mb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-bold text-xl mb-2">
              {alreadyTaken ? "لقد أديت هذا الامتحان من قبل" : "تم تسليم الامتحان!"}
            </h2>
            {result.total > 0 && (
              <div className="text-3xl font-bold text-primary mb-2">
                {result.score} / {result.total}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {result.total > 0
                ? `نسبة النجاح: ${Math.round((result.score / result.total) * 100)}%`
                : "الامتحان يحتوي على أسئلة مقالية فقط"}
            </p>
            {!alreadyTaken && result.details.length > 0 && (
              <div className="mt-6 space-y-3 text-right">
                {questions.map((q, i) => {
                  const detail = result.details.find((d: any) => d.questionId === q.id);
                  if (q.question_type !== "mcq") return null;
                  return (
                    <div key={q.id} className={`p-3 rounded-xl border ${detail?.correct ? "border-green-500/30 bg-green-50 dark:bg-green-950/20" : "border-destructive/30 bg-red-50 dark:bg-red-950/20"}`}>
                      <div className="flex items-start gap-2">
                        {detail?.correct ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{i + 1}. {q.question_text}</p>
                          <p className="text-xs mt-1">إجابتك: {answers[q.id]}</p>
                          {!detail?.correct && detail?.correctAnswer && (
                            <p className="text-xs text-green-600 mt-0.5">الإجابة الصحيحة: {detail.correctAnswer}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Link to="/dashboard" className="block mt-6">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        )}

        {/* Questions */}
        {!result && (
          <div className="space-y-6">
            {questions.map((q, i) => (
              <div key={q.id} className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-bold text-sm mb-3">
                  <span className="text-muted-foreground ml-2">{i + 1}.</span>
                  {q.question_text}
                  <span className="text-xs text-muted-foreground mr-2">
                    ({q.question_type === "mcq" ? "اختيار من متعدد" : "مقالي"})
                  </span>
                </h3>

                {q.question_type === "mcq" && q.options ? (
                  <div className="space-y-2">
                    {q.options.map((opt, j) => (
                      <button
                        key={j}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        className={`w-full text-right px-4 py-3 rounded-lg border text-sm transition-colors ${
                          answers[q.id] === opt
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>
            ))}

            <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2" size="lg">
              {submitting ? "جاري التسليم..." : "تسليم الامتحان"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default TakeExam;
