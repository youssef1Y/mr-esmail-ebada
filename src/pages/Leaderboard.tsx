import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Trophy, Medal, Award, Crown, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { StudentLevelBadge, getStudentLevel } from "@/components/StudentLevel";

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
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
      if (!roles || roles.length === 0) { navigate("/dashboard"); return; }
      setMyUserId(session.user.id);

      const { data: points } = await supabase.from("student_points").select("user_id, points");
      if (!points || points.length === 0) { setLoading(false); return; }

      const pointMap: Record<string, number> = {};
      points.forEach(p => { pointMap[p.user_id] = (pointMap[p.user_id] || 0) + p.points; });

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

  const getRankDecoration = (index: number) => {
    if (index === 0) return { icon: <Crown className="w-6 h-6" />, bg: "bg-gradient-to-br from-yellow-400 to-amber-500", text: "text-yellow-900", ring: "ring-2 ring-yellow-400/50", shadow: "shadow-lg shadow-yellow-500/20" };
    if (index === 1) return { icon: <Medal className="w-5 h-5" />, bg: "bg-gradient-to-br from-slate-300 to-slate-400", text: "text-slate-800", ring: "ring-2 ring-slate-300/50", shadow: "shadow-lg shadow-slate-400/20" };
    if (index === 2) return { icon: <Award className="w-5 h-5" />, bg: "bg-gradient-to-br from-amber-600 to-amber-700", text: "text-amber-100", ring: "ring-2 ring-amber-600/50", shadow: "shadow-lg shadow-amber-600/20" };
    return null;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">جاري تحميل الترتيب...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 flex items-center justify-between h-14 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">لوحة الشرف</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1 rounded-xl">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-amber-100/50 dark:from-amber-950/20 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 px-4"
        >
          <div className="text-4xl mb-2">🏆</div>
          <h1 className="text-2xl font-bold font-amiri mb-1">لوحة الشرف</h1>
          <p className="text-sm text-muted-foreground">أوائل الطلاب بناءً على النقاط المكتسبة</p>
        </motion.div>
      </div>

      <main className="container mx-auto px-4 pb-8 max-w-2xl -mt-2">
        {/* Grade Filter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <select
            value={filterGrade}
            onChange={e => setFilterGrade(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          >
            <option value="">جميع الصفوف</option>
            {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </motion.div>

        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card rounded-2xl border border-border p-10 text-center">
            <Trophy className="w-14 h-14 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد نقاط بعد</p>
            <p className="text-xs text-muted-foreground mt-1">ابدأ بحل الامتحانات والواجبات!</p>
          </motion.div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {filtered.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-end justify-center gap-3 mb-6 px-2"
              >
                {/* 2nd place */}
                <div className="flex-1 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-400/20 mb-2">
                    <Medal className="w-6 h-6 text-slate-800" />
                  </div>
                  <p className="font-bold text-xs truncate">{filtered[1].full_name}</p>
                  <p className="text-xs text-muted-foreground">{filtered[1].total_points} نقطة</p>
                  <div className="bg-slate-200 dark:bg-slate-800 rounded-t-xl h-16 mt-2 flex items-center justify-center">
                    <span className="font-bold text-lg text-slate-600 dark:text-slate-400">2</span>
                  </div>
                </div>
                {/* 1st place */}
                <div className="flex-1 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 mb-2 ring-2 ring-yellow-400/30">
                    <Crown className="w-7 h-7 text-yellow-900" />
                  </div>
                  <p className="font-bold text-sm truncate">{filtered[0].full_name}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">{filtered[0].total_points} نقطة</p>
                  <div className="bg-amber-200 dark:bg-amber-900/40 rounded-t-xl h-24 mt-2 flex items-center justify-center">
                    <span className="font-bold text-2xl text-amber-600 dark:text-amber-400">1</span>
                  </div>
                </div>
                {/* 3rd place */}
                <div className="flex-1 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/20 mb-2">
                    <Award className="w-6 h-6 text-amber-100" />
                  </div>
                  <p className="font-bold text-xs truncate">{filtered[2].full_name}</p>
                  <p className="text-xs text-muted-foreground">{filtered[2].total_points} نقطة</p>
                  <div className="bg-amber-100 dark:bg-amber-900/20 rounded-t-xl h-12 mt-2 flex items-center justify-center">
                    <span className="font-bold text-lg text-amber-700 dark:text-amber-500">3</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Full List */}
            <div className="space-y-2">
              {filtered.map((entry, i) => {
                const level = getStudentLevel(entry.total_points);
                const decoration = getRankDecoration(i);
                const isMe = entry.user_id === myUserId;

                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * Math.min(i, 15) }}
                    className={`bg-card rounded-xl border p-4 flex items-center gap-3 transition-all ${
                      isMe ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10" : "border-border hover:border-primary/20"
                    } ${i < 3 ? "border-2" : ""}`}
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center">
                      {decoration ? (
                        <div className={`w-9 h-9 rounded-xl ${decoration.bg} ${decoration.shadow} flex items-center justify-center`}>
                          <span className={`font-bold text-sm ${decoration.text}`}>{i + 1}</span>
                        </div>
                      ) : (
                        <span className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm truncate">{entry.full_name}</h3>
                        {isMe && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold">أنت</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">{entry.grade}</p>
                        <span className={`text-[10px] ${level.color} font-medium`}>{level.tier} {level.name}</span>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-center flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span className="text-lg font-bold text-primary">{entry.total_points}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">نقطة</p>
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

export default Leaderboard;
