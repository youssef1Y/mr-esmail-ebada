import { Trophy, Medal, Star, Award, Zap, Crown } from "lucide-react";

interface LevelInfo {
  name: string;
  icon: React.ReactNode;
  minPoints: number;
  color: string;
  bgColor: string;
}

const levels: LevelInfo[] = [
  { name: "مبتدئ", icon: <Star className="w-5 h-5" />, minPoints: 0, color: "text-muted-foreground", bgColor: "bg-muted" },
  { name: "مجتهد", icon: <Zap className="w-5 h-5" />, minPoints: 50, color: "text-blue-600", bgColor: "bg-blue-500/10" },
  { name: "متوسط", icon: <Medal className="w-5 h-5" />, minPoints: 150, color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  { name: "متقدم", icon: <Trophy className="w-5 h-5" />, minPoints: 300, color: "text-amber-600", bgColor: "bg-amber-500/10" },
  { name: "متفوق", icon: <Award className="w-5 h-5" />, minPoints: 500, color: "text-purple-600", bgColor: "bg-purple-500/10" },
  { name: "نجم المنصة", icon: <Crown className="w-5 h-5" />, minPoints: 1000, color: "text-rose-600", bgColor: "bg-rose-500/10" },
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

  return (
    <div className="space-y-2">
      <div className={`inline-flex items-center gap-2 ${current.bgColor} ${current.color} px-3 py-1.5 rounded-full text-sm font-bold`}>
        {current.icon}
        <span>{current.name}</span>
      </div>
      {showProgress && next && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{points} نقطة</span>
            <span>{next.level.name} ({next.level.minPoints} نقطة)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: `${Math.min(100, ((points - getStudentLevel(points).minPoints) / (next.level.minPoints - getStudentLevel(points).minPoints)) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">باقي {next.pointsNeeded} نقطة للمستوى التالي</p>
        </div>
      )}
    </div>
  );
}

export default StudentLevelBadge;
