import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Trophy, Medal, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  grade: string;
  total_points: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState("");
  const [myUserId, setMyUserId] = useState("");

  const allGrades = [
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
  ];

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      // Only admins can access this page
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
      if (!roles || roles.length === 0) { navigate("/dashboard"); return; }
      setMyUserId(session.user.id);

      // Get all points grouped by user
      const { data: points } = await supabase.from("student_points").select("user_id, points");
      if (!points || points.length === 0) { setLoading(false); return; }

      const pointMap: Record<string, number> = {};
      points.forEach(p => {
        pointMap[p.user_id] = (pointMap[p.user_id] || 0) + p.points;
      });

      const userIds = Object.keys(pointMap);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, grade").in("user_id", userIds);

      const leaderboard: LeaderboardEntry[] = (profiles || []).map(p => ({
        user_id: p.user_id,
        full_name: p.full_name,
        grade: p.grade,
        total_points: pointMap[p.user_id] || 0,
      })).sort((a, b) => b.total_points - a.total_points);

      setEntries(leaderboard);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const filtered = filterGrade ? entries.filter(e => e.grade === filterGrade) : entries;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">{index + 1}</span>;
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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">ترتيب الطلاب</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-amiri mb-2">🏆 لوحة الشرف</h1>
          <p className="text-sm text-muted-foreground">أوائل الطلاب بناءً على النقاط المكتسبة</p>
        </div>

        <div className="mb-4">
          <select
            value={filterGrade}
            onChange={e => setFilterGrade(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">جميع الصفوف</option>
            {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">لا توجد نقاط بعد. ابدأ بحل الامتحانات والواجبات!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((entry, i) => (
              <div
                key={entry.user_id}
                className={`bg-card rounded-xl border p-4 flex items-center gap-3 ${
                  entry.user_id === myUserId ? "border-primary/50 bg-primary/5" : "border-border"
                } ${i < 3 ? "border-2" : ""}`}
              >
                <div className="flex-shrink-0">{getRankIcon(i)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">
                    {entry.full_name}
                    {entry.user_id === myUserId && <span className="text-primary text-xs mr-1">(أنت)</span>}
                  </h3>
                  <p className="text-xs text-muted-foreground">{entry.grade}</p>
                </div>
                <div className="text-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">{entry.total_points}</span>
                  <p className="text-xs text-muted-foreground">نقطة</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
