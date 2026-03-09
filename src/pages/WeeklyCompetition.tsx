import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Key, ChevronRight, CheckCircle, XCircle, Share2, Copy, Gift, Sparkles, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const WeeklyCompetition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [keysCount, setKeysCount] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [activeComp, setActiveComp] = useState<any>(null);
  const [todayPlayed, setTodayPlayed] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pastWinners, setPastWinners] = useState<any[]>([]);
  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [grade, setGrade] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth/login"); return; }
    const uid = session.user.id;
    setUserId(uid);

    // Give first key
    await supabase.rpc("give_first_key", { p_user_id: uid });

    // Get keys count
    const { data: keysData } = await supabase.from("student_keys" as any).select("keys_count").eq("user_id", uid).single();
    if (keysData) setKeysCount((keysData as any).keys_count || 0);

    // Get referral code
    const { data: refCode } = await supabase.rpc("get_or_create_referral_code", { p_user_id: uid });
    if (refCode) setReferralCode(refCode as string);

    // Get profile grade
    const { data: profile } = await supabase.from("profiles").select("grade").eq("user_id", uid).single();
    if (profile) setGrade(profile.grade);

    // Get active competition
    const { data: comps } = await supabase.from("weekly_competitions" as any).select("*").eq("status", "active").order("created_at", { ascending: false }).limit(1);
    if (comps && comps.length > 0) {
      const comp = comps[0] as any;
      setActiveComp(comp);

      // Check if already played today
      const { data: entryCount } = await supabase.rpc("get_today_competition_entry", { p_user_id: uid, p_competition_id: comp.id });
      if (entryCount && (entryCount as number) > 0) setTodayPlayed(true);

      // Get my entries for this competition
      const { data: entries } = await supabase.from("competition_entries" as any).select("*").eq("user_id", uid).eq("competition_id", comp.id).order("created_at", { ascending: false });
      if (entries) setMyEntries(entries as any[]);
    }

    // Get past winners
    const { data: pastComps } = await supabase.from("weekly_competitions" as any).select("*").eq("status", "completed").order("week_end", { ascending: false }).limit(5);
    if (pastComps) setPastWinners(pastComps as any[]);

    setLoading(false);
  };

  const [generatingQuestion, setGeneratingQuestion] = useState(false);

  const startQuestion = async () => {
    if (keysCount <= 0) {
      toast({ title: "لا توجد مفاتيح", description: "شارك رابط المنصة للحصول على مفاتيح!", variant: "destructive" });
      return;
    }

    // Use a key
    const { data: keyUsed } = await supabase.rpc("use_key", { p_user_id: userId });
    if (!keyUsed) {
      toast({ title: "خطأ", description: "لا توجد مفاتيح كافية", variant: "destructive" });
      return;
    }

    setKeysCount(k => k - 1);
    setGeneratingQuestion(true);

    try {
      // Try AI-generated question first
      const { data: aiQuestion, error: aiError } = await supabase.functions.invoke("generate-competition-question", {
        body: { grade, subjects: ["الفقه", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية"] },
      });

      if (!aiError && aiQuestion && !aiQuestion.error && aiQuestion.question_text) {
        setQuestion({
          question_text: aiQuestion.question_text,
          options: aiQuestion.options,
          correct_answer: aiQuestion.correct_answer,
          subject: aiQuestion.subject,
        });
        setSelectedAnswer("");
        setShowResult(false);
        setGeneratingQuestion(false);
        return;
      }
    } catch (e) {
      console.error("AI question generation failed, falling back to question bank:", e);
    }

    // Fallback to question_bank
    const { data: questions } = await supabase.rpc("get_practice_questions", { p_grade: grade, p_subject: ["الفقه", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية"][Math.floor(Math.random() * 5)] });
    
    if (!questions || (questions as any[]).length === 0) {
      toast({ title: "لا توجد أسئلة متاحة حالياً", description: "جرب مرة أخرى لاحقاً" });
      setGeneratingQuestion(false);
      return;
    }

    const randomQ = (questions as any[])[Math.floor(Math.random() * (questions as any[]).length)];
    setQuestion(randomQ);
    setSelectedAnswer("");
    setShowResult(false);
    setGeneratingQuestion(false);
  };

  const submitAnswer = async () => {
    if (!question || !activeComp) return;
    const correct = selectedAnswer === question.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);
    setTodayPlayed(true);

    // Save entry
    await supabase.from("competition_entries" as any).insert({
      user_id: userId,
      competition_id: activeComp.id,
      question_text: question.question_text,
      options: question.options,
      correct_answer: question.correct_answer,
      selected_answer: selectedAnswer,
      is_correct: correct,
      entry_date: new Date().toISOString().split("T")[0],
    } as any);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast({ title: "تم النسخ!", description: "تم نسخ رابط الدعوة" });
  };

  const shareReferralLink = () => {
    const link = `${window.location.origin}/auth/register?ref=${referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: "منصة الأستاذ إسماعيل أحمد عباده",
        text: "سجل الآن في أفضل منصة لتعليم التربية الدينية الإسلامية!",
        url: link,
      });
    } else {
      copyReferralLink();
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">المسابقة الأسبوعية</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Keys Display */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 mb-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Key className="w-6 h-6 text-amber-500" />
            <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{keysCount}</span>
          </div>
          <p className="text-sm text-muted-foreground">مفاتيحك المتاحة</p>
          <p className="text-xs text-muted-foreground mt-1">كل سؤال يكلف مفتاح واحد 🔑</p>
        </motion.div>

        {/* Share Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 mb-6"
        >
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" /> احصل على مفاتيح إضافية
          </h3>
          <p className="text-xs text-muted-foreground mb-3">شارك رابط المنصة مع أصدقائك. عندما يسجل طالب جديد برابطك، تحصل على مفتاح!</p>
          <div className="flex gap-2">
            <Button onClick={shareReferralLink} size="sm" className="gap-1 flex-1">
              <Share2 className="w-3 h-3" /> مشاركة الرابط
            </Button>
            <Button onClick={copyReferralLink} variant="outline" size="sm" className="gap-1">
              <Copy className="w-3 h-3" /> نسخ
            </Button>
          </div>
        </motion.div>

        {/* Competition Section */}
        {activeComp ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border-2 border-primary/20 rounded-2xl p-5 mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-bold">{activeComp.title}</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              من {new Date(activeComp.week_start).toLocaleDateString("ar-EG")} إلى {new Date(activeComp.week_end).toLocaleDateString("ar-EG")}
            </p>
            <p className="text-xs text-muted-foreground mb-4">🎁 الجائزة: {activeComp.prize_description}</p>

            {todayPlayed && !showResult ? (
              <div className="bg-muted rounded-xl p-4 text-center">
                <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-bold">لقد شاركت اليوم بالفعل!</p>
                <p className="text-xs text-muted-foreground">عُد غداً لسؤال جديد 🌟</p>
              </div>
            ) : generatingQuestion ? (
              <div className="text-center py-6">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                <p className="font-bold text-sm">جاري إنشاء سؤال فريد لك...</p>
                <p className="text-xs text-muted-foreground mt-1">يتم استخدام الذكاء الاصطناعي لإنشاء سؤال صعب 🧠</p>
              </div>
            ) : question ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key="question"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="bg-muted/50 rounded-xl p-4 mb-3">
                    <h3 className="font-bold text-sm mb-3">{question.question_text}</h3>
                    <div className="space-y-2">
                      {(question.options as string[])?.map((opt: string, j: number) => {
                        let cls = "bg-background border-border hover:border-primary/50";
                        if (showResult) {
                          if (opt === question.correct_answer) cls = "bg-green-50 dark:bg-green-950/20 border-green-500";
                          else if (opt === selectedAnswer && !isCorrect) cls = "bg-red-50 dark:bg-red-950/20 border-destructive";
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
                            {showResult && opt === question.correct_answer && <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />}
                            {showResult && opt === selectedAnswer && opt !== question.correct_answer && <XCircle className="w-4 h-4 inline ml-2 text-destructive" />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {showResult ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl p-4 text-center ${isCorrect ? "bg-green-50 dark:bg-green-950/20 border border-green-500" : "bg-red-50 dark:bg-red-950/20 border border-destructive"}`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                          <p className="font-bold text-green-700 dark:text-green-400">🎉 إجابة صحيحة!</p>
                          <p className="text-sm text-green-600 dark:text-green-500">تم دخولك السحب الأسبوعي</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
                          <p className="font-bold text-destructive">إجابة خاطئة</p>
                          <p className="text-sm text-muted-foreground">حظ أفضل في المرة القادمة! 💪</p>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <Button onClick={submitAnswer} disabled={!selectedAnswer} className="w-full">
                      تأكيد الإجابة
                    </Button>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center">
                {keysCount > 0 ? (
                  <Button onClick={startQuestion} size="lg" className="gap-2">
                    <Key className="w-4 h-4" /> ابدأ سؤال اليوم (مفتاح واحد)
                  </Button>
                ) : (
                  <div>
                    <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">تحتاج مفتاح واحد على الأقل</p>
                    <p className="text-xs text-muted-foreground">شارك رابط المنصة للحصول على مفاتيح!</p>
                  </div>
                )}
              </div>
            )}

            {/* My entries this week */}
            {myEntries.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-xs font-bold mb-2">مشاركاتك هذا الأسبوع:</h4>
                <div className="space-y-1">
                  {myEntries.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-2 text-xs">
                      {e.is_correct ? <CheckCircle className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-destructive" />}
                      <span className="text-muted-foreground">{new Date(e.created_at).toLocaleDateString("ar-EG")}</span>
                      <span>{e.is_correct ? "دخلت السحب ✅" : "لم تدخل السحب"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-2xl p-8 text-center mb-6"
          >
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold">لا توجد مسابقة نشطة حالياً</p>
            <p className="text-sm text-muted-foreground">ترقب المسابقة القادمة!</p>
          </motion.div>
        )}

        {/* Past Winners */}
        {pastWinners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> الفائزون السابقون
            </h3>
            <div className="space-y-2">
              {pastWinners.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-bold">{w.winner_name || "لم يُحدد"}</p>
                    <p className="text-xs text-muted-foreground">{w.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(w.week_end).toLocaleDateString("ar-EG")}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default WeeklyCompetition;
