import { Trophy, Medal, Star, Award, Zap, Crown, Gem, Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface LevelInfo {
  name: string;
  tier: string;
  icon: React.ReactNode;
  minPoints: number;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

const levels: LevelInfo[] = [
  { name: "مبتدئ", tier: "🥉", icon: <Star className="w-5 h-5" />, minPoints: 0, color: "text-muted-foreground", bgColor: "bg-muted", borderColor: "border-border", glowColor: "" },
  { name: "برونزي", tier: "🥉", icon: <Zap className="w-5 h-5" />, minPoints: 50, color: "text-amber-700 dark:text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/30", borderColor: "border-amber-300 dark:border-amber-700", glowColor: "shadow-amber-200/50 dark:shadow-amber-800/30" },
  { name: "فضي", tier: "🥈", icon: <Medal className="w-5 h-5" />, minPoints: 150, color: "text-slate-600 dark:text-slate-300", bgColor: "bg-slate-100 dark:bg-slate-800/40", borderColor: "border-slate-300 dark:border-slate-600", glowColor: "shadow-slate-200/50 dark:shadow-slate-700/30" },
  { name: "ذهبي", tier: "🥇", icon: <Trophy className="w-5 h-5" />, minPoints: 300, color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-50 dark:bg-yellow-900/20", borderColor: "border-yellow-400 dark:border-yellow-600", glowColor: "shadow-yellow-200/60 dark:shadow-yellow-700/30" },
  { name: "بلاتيني", tier: "💎", icon: <Gem className="w-5 h-5" />, minPoints: 500, color: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-50 dark:bg-cyan-900/20", borderColor: "border-cyan-400 dark:border-cyan-600", glowColor: "shadow-cyan-200/60 dark:shadow-cyan-700/30" },
  { name: "ماسي", tier: "👑", icon: <Crown className="w-5 h-5" />, minPoints: 800, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-900/20", borderColor: "border-purple-400 dark:border-purple-600", glowColor: "shadow-purple-200/60 dark:shadow-purple-700/30" },
  { name: "أسطوري", tier: "🚀", icon: <Rocket className="w-5 h-5" />, minPoints: 1200, color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-50 dark:bg-rose-900/20", borderColor: "border-rose-400 dark:border-rose-600", glowColor: "shadow-rose-200/60 dark:shadow-rose-700/30" },
];

export function getStudentLevel(points: number): LevelInfo {
  let current = levels[0];
  for (const level of levels) {
    if (points >= level.minPoints) current = level;
    else break;
  }
  return current;
}

export function getNextLevel(points: number): { level: LevelInfo; pointsNeeded: number } | null {
  for (const level of levels) {
    if (points < level.minPoints) {
      return { level, pointsNeeded: level.minPoints - points };
    }
  }
  return null;
}

export function StudentLevelBadge({ points, showProgress = false }: { points: number; showProgress?: boolean }) {
  const current = getStudentLevel(points);
  const next = getNextLevel(points);
  const progressPercent = next
    ? Math.min(100, ((points - current.minPoints) / (next.level.minPoints - current.minPoints)) * 100)
    : 100;

  return (
    <div className="space-y-3">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center gap-2.5 ${current.bgColor} ${current.color} border ${current.borderColor} px-4 py-2 rounded-2xl text-sm font-bold shadow-md ${current.glowColor}`}
      >
        <span className="text-lg">{current.tier}</span>
        {current.icon}
        <span>{current.name}</span>
        <span className="text-xs opacity-70">({points} نقطة)</span>
      </motion.div>

      {showProgress && next && (
        <div className="space-y-1.5 max-w-xs mx-auto">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={current.color}>{current.name}</span>
            <span className={next.level.color}>{next.level.tier} {next.level.name}</span>
          </div>
          <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-3 rounded-full bg-gradient-to-l from-primary to-primary/60"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            باقي <span className="font-bold text-foreground">{next.pointsNeeded}</span> نقطة للمستوى التالي
          </p>
        </div>
      )}

      {showProgress && !next && (
        <p className="text-xs text-center font-bold text-primary">🎉 وصلت لأعلى مستوى! أنت أسطورة!</p>
      )}
    </div>
  );
}

export default StudentLevelBadge;
