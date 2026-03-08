import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, FileText, Trophy, TrendingUp, Award, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

interface ExamResult {
  id: string;
  exam_id: string;
  score: number | null;
  total: number | null;
  submitted_at: string;
  exam_title?: string;
  exam_subject?: string;
}

const getScoreColor = (percent: number) => {
  if (percent >= 80) return "hsl(var(--primary))";
  if (percent >= 60) return "hsl(var(--accent))";
  return "hsl(var(--destructive))";
};

const getGrade = (percent: number) => {
  if (percent >= 90) return { label: "ممتاز", emoji: "🏆" };
  if (percent >= 80) return { label: "جيد جداً", emoji: "⭐" };
  if (percent >= 70) return { label: "جيد", emoji: "👍" };
  if (percent >= 60) return { label: "مقبول", emoji: "📝" };
  return { label: "يحتاج تحسين", emoji: "💪" };
};

const MyResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }

      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("submitted_at", { ascending: false });

      if (attempts && attempts.length > 0) {
        const examIds = [...new Set(attempts.map(a => a.exam_id))];
        const { data: exams } = await supabase
          .from("exams")
          .select("id, title, subject")
          .in("id", examIds);
        const examMap = new Map(exams?.map(e => [e.id, e]) || []);

        setResults(attempts.map(a => ({
          ...a,
          exam_title: examMap.get(a.exam_id)?.title || "امتحان محذوف",
          exam_subject: examMap.get(a.exam_id)?.subject || "",
        })));
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + ((r.score || 0) / (r.total || 1)) * 100, 0) / results.length)
    : 0;

  const bestScore = results.length > 0
    ? Math.round(Math.max(...results.map(r => r.total ? ((r.score || 0) / r.total) * 100 : 0)))
    : 0;

  const chartData = results.slice(0, 10).reverse().map((r, i) => ({
    name: r.exam_title?.substring(0, 12) || `امتحان ${i + 1}`,
    score: r.total ? Math.round(((r.score || 0) / r.total) * 100) : 0,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20"
          >
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-bold font-amiri mb-1">نتائجي</h1>
          <p className="text-sm text-muted-foreground">تتبع أداءك في الامتحانات</p>
        </motion.div>

        {results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border p-8 text-center"
          >
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">لم تخض أي امتحان بعد</p>
            <Link to="/dashboard">
              <Button size="sm" className="mt-4">العودة للمنصة</Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: FileText, label: "عدد الامتحانات", value: results.length, color: "primary" },
                { icon: TrendingUp, label: "متوسط الدرجات", value: `${avgScore}%`, color: "primary" },
                { icon: Target, label: "أعلى درجة", value: `${bestScore}%`, color: "accent" },
                { icon: Award, label: "مرات التفوق", value: results.filter(r => r.total && (r.score || 0) >= r.total * 0.8).length, color: "accent" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                  className="bg-card rounded-xl border border-border p-4 text-center hover:border-primary/30 transition-colors"
                >
                  <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color === "accent" ? "text-accent" : "text-primary"}`} />
                  <span className="text-xl font-bold block">{stat.value}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Overall Grade */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="bg-card rounded-2xl border border-border p-5 mb-6 flex items-center gap-4"
            >
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <motion.circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={getScoreColor(avgScore)}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - avgScore / 100) }}
                    transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{avgScore}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">التقدير العام</p>
                <p className="text-xl font-bold">{getGrade(avgScore).emoji} {getGrade(avgScore).label}</p>
                <p className="text-xs text-muted-foreground mt-1">بناءً على {results.length} امتحان</p>
              </div>
            </motion.div>

            {/* Chart */}
            {chartData.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="bg-card rounded-2xl border border-border p-5 mb-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-accent" />
                  <h2 className="font-bold text-sm">تطور الأداء</h2>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "الدرجة"]}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={getScoreColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Results List */}
            <div className="space-y-3">
              {results.map((r, i) => {
                const percent = r.total ? Math.round(((r.score || 0) / r.total) * 100) : 0;
                const grade = getGrade(percent);
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                    className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${getScoreColor(percent)}15` }}
                      >
                        {grade.emoji}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{r.exam_title}</h3>
                        <p className="text-xs text-muted-foreground">{r.exam_subject}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(r.submitted_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-bold" style={{ color: getScoreColor(percent) }}>
                        {r.score || 0}/{r.total || 0}
                      </span>
                      <div className="w-16 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: getScoreColor(percent) }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{percent}%</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MyResults;
