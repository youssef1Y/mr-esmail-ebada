import { useState } from "react";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface WinnersTabProps {
  pastWinners: any[];
}

const CompetitionWinnersTab = ({ pastWinners }: WinnersTabProps) => {
  const [filter, setFilter] = useState<"all" | "7" | "30">("all");

  const filters = [
    { id: "all" as const, label: "كل الأوقات" },
    { id: "7" as const, label: "آخر ٧ أيام" },
    { id: "30" as const, label: "آخر ٣٠ يومًا" },
  ];

  const now = new Date();
  const filtered = pastWinners.filter((w) => {
    if (filter === "all") return true;
    const end = new Date(w.week_end);
    const days = (now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24);
    return days <= parseInt(filter);
  });

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="text-right mb-2">
        <h2 className="text-xl font-bold">الفائزون</h2>
        <p className="text-muted-foreground text-sm">قائمة الفائزين</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-0 bg-muted rounded-xl p-1 mb-6">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 text-xs font-medium py-2.5 rounded-lg transition-all ${
              filter === f.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">لا يوجد فائزون في هذه الفترة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w: any, i: number) => {
            const initial = w.winner_name ? w.winner_name.charAt(0) : "؟";
            return (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground shrink-0">
                  {initial}
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="font-bold text-base truncate">{w.winner_name || "لم يُحدد"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(w.week_end).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 mt-1.5">
                    🏆 {w.title}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompetitionWinnersTab;
