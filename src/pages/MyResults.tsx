import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, FileText, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ExamResult {
  id: string;
  exam_id: string;
  score: number | null;
  total: number | null;
  submitted_at: string;
  exam_title?: string;
  exam_subject?: string;
}

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

  const chartData = results.slice(0, 10).reverse().map((r, i) => ({
    name: r.exam_title?.substring(0, 15) || `امتحان ${i + 1}`,
    score: r.total ? Math.round(((r.score || 0) / r.total) * 100) : 0,
  }));

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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-amiri mb-1">نتائجي</h1>
          <p className="text-sm text-muted-foreground">تتبع أداءك في الامتحانات</p>
        </div>

        {results.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">لم تخض أي امتحان بعد</p>
            <Link to="/dashboard">
              <Button size="sm" className="mt-4">العودة للمنصة</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <FileText className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="text-xl font-bold">{results.length}</span>
                <p className="text-xs text-muted-foreground">امتحان</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="text-xl font-bold">{avgScore}%</span>
                <p className="text-xs text-muted-foreground">متوسط الدرجات</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <Trophy className="w-5 h-5 text-accent mx-auto mb-1" />
                <span className="text-xl font-bold">
                  {results.filter(r => r.total && (r.score || 0) >= r.total * 0.8).length}
                </span>
                <p className="text-xs text-muted-foreground">تفوق</p>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 1 && (
              <div className="bg-card rounded-2xl border border-border p-4 mb-6">
                <h2 className="font-bold text-sm mb-4">تطور الأداء</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v}%`, "الدرجة"]} />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Results List */}
            <div className="space-y-3">
              {results.map(r => (
                <div key={r.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{r.exam_title}</h3>
                    <p className="text-xs text-muted-foreground">{r.exam_subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.submitted_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className={`text-lg font-bold ${(r.score || 0) >= ((r.total || 1) * 0.5) ? "text-primary" : "text-destructive"}`}>
                      {r.score || 0}/{r.total || 0}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {r.total ? Math.round(((r.score || 0) / r.total) * 100) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MyResults;
