import { useEffect, useState } from "react";
import { Flame, Video, ClipboardList, FileText, MessageCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  points: number;
}

export const DailyChallenges = ({ userId, grade }: { userId: string; grade: string }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !grade) return;

    const fetchChallenges = async () => {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      const [viewsRes, hwSubsRes, attemptsRes, commentsRes] = await Promise.all([
        supabase.from("video_views").select("id").eq("user_id", userId).gte("viewed_at", `${today}T00:00:00`),
        supabase.from("homework_submissions").select("id").eq("user_id", userId).gte("submitted_at", `${today}T00:00:00`),
        supabase.from("exam_attempts").select("id").eq("user_id", userId).gte("submitted_at", `${today}T00:00:00`),
        supabase.from("video_comments").select("id").eq("user_id", userId).gte("created_at", `${today}T00:00:00`),
      ]);

      const todayViews = viewsRes.data?.length || 0;
      const todayHw = hwSubsRes.data?.length || 0;
      const todayExams = attemptsRes.data?.length || 0;
      const todayComments = commentsRes.data?.length || 0;

      setChallenges([
        {
          id: "watch",
          title: "شاهد فيديو",
          description: "شاهد فيديو واحد على الأقل اليوم",
          icon: Video,
          completed: todayViews >= 1,
          points: 1,
        },
        {
          id: "homework",
          title: "سلّم واجب",
          description: "أكمل واجب واحد اليوم",
          icon: ClipboardList,
          completed: todayHw >= 1,
          points: 2,
        },
        {
          id: "exam",
          title: "ادخل امتحان",
          description: "اختبر نفسك بامتحان واحد",
          icon: FileText,
          completed: todayExams >= 1,
          points: 2,
        },
        {
          id: "comment",
          title: "شارك رأيك",
          description: "اكتب تعليق على فيديو",
          icon: MessageCircle,
          completed: todayComments >= 1,
          points: 1,
        },
      ]);

      setLoading(false);
    };

    fetchChallenges();
  }, [userId, grade]);

  if (loading) return null;

  const completedCount = challenges.filter(c => c.completed).length;
  const allDone = completedCount === challenges.length;

  return (
    <div className="mb-8">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold font-amiri flex items-center justify-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          تحديات اليوم
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          أكمل التحديات اليومية واكسب نقاط إضافية
        </p>
      </div>

      {/* Progress summary */}
      <div className="max-w-md mx-auto mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>{completedCount}/{challenges.length} مكتمل</span>
          {allDone && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-primary font-bold"
            >
              🎉 أحسنت! أكملت كل التحديات
            </motion.span>
          )}
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / challenges.length) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-2 rounded-full bg-gradient-to-l from-orange-500 to-amber-400"
          />
        </div>
      </div>

      {/* Challenge cards */}
      <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
        <AnimatePresence>
          {challenges.map((ch, i) => {
            const Icon = ch.icon;
            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative bg-card rounded-xl border p-3 text-center transition-all ${
                  ch.completed
                    ? "border-primary/40 bg-primary/5"
                    : "border-border"
                }`}
              >
                {ch.completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -left-1.5"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                  </motion.div>
                )}
                <div className={`w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center ${
                  ch.completed ? "bg-primary/10" : "bg-muted"
                }`}>
                  <Icon className={`w-4 h-4 ${ch.completed ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <h4 className="font-bold text-xs mb-0.5">{ch.title}</h4>
                <p className="text-[10px] text-muted-foreground leading-tight">{ch.description}</p>
                <span className={`text-[10px] font-bold mt-1 inline-block ${ch.completed ? "text-primary" : "text-muted-foreground"}`}>
                  +{ch.points} نقطة
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
