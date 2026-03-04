import { useEffect, useState } from "react";
import { BookMarked, Star, Scroll, BookHeart, BookOpen, Video, ClipboardList, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SubjectProgress {
  subject: string;
  videosTotal: number;
  videosWatched: number;
  homeworkTotal: number;
  homeworkDone: number;
  examsTotal: number;
  examsDone: number;
  overallPercent: number;
}

const subjectIcons: Record<string, any> = {
  "الفقه": BookMarked,
  "التوحيد": Star,
  "التفسير": Scroll,
  "الحديث الشريف": BookHeart,
  "السيرة النبوية": BookOpen,
};

export const StudentProgressTracker = ({ userId, grade }: { userId: string; grade: string }) => {
  const [progress, setProgress] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !grade) return;
    const fetchProgress = async () => {
      setLoading(true);
      
      const [videosRes, viewsRes, homeworkRes, hwSubsRes, examsRes, attemptsRes] = await Promise.all([
        supabase.from("videos").select("id, subject").eq("grade", grade),
        supabase.from("video_views").select("video_id").eq("user_id", userId),
        supabase.from("homework").select("id, subject").eq("grade", grade),
        supabase.from("homework_submissions").select("homework_id").eq("user_id", userId),
        supabase.from("exams").select("id, subject").eq("grade", grade),
        supabase.from("exam_attempts").select("exam_id").eq("user_id", userId),
      ]);

      const videos = videosRes.data || [];
      const views = new Set((viewsRes.data || []).map(v => v.video_id));
      const homework = homeworkRes.data || [];
      const hwSubs = new Set((hwSubsRes.data || []).map(h => h.homework_id));
      const exams = examsRes.data || [];
      const attempts = new Set((attemptsRes.data || []).map(a => a.exam_id));

      const subjects = [...new Set([...videos.map(v => v.subject), ...homework.map(h => h.subject), ...exams.map(e => e.subject)])];

      const subjectProgress = subjects.map(subject => {
        const subjectVideos = videos.filter(v => v.subject === subject);
        const subjectHw = homework.filter(h => h.subject === subject);
        const subjectExams = exams.filter(e => e.subject === subject);

        const videosWatched = subjectVideos.filter(v => views.has(v.id)).length;
        const homeworkDone = subjectHw.filter(h => hwSubs.has(h.id)).length;
        const examsDone = subjectExams.filter(e => attempts.has(e.id)).length;

        const totalItems = subjectVideos.length + subjectHw.length + subjectExams.length;
        const doneItems = videosWatched + homeworkDone + examsDone;
        const overallPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

        return {
          subject,
          videosTotal: subjectVideos.length,
          videosWatched,
          homeworkTotal: subjectHw.length,
          homeworkDone,
          examsTotal: subjectExams.length,
          examsDone,
          overallPercent,
        };
      });

      setProgress(subjectProgress.sort((a, b) => b.overallPercent - a.overallPercent));
      setLoading(false);
    };

    fetchProgress();
  }, [userId, grade]);

  if (loading) return null;
  if (progress.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold font-amiri text-center mb-4">📊 تقدمك في المواد</h2>
      <div className="space-y-3 max-w-2xl mx-auto">
        {progress.map(p => {
          const Icon = subjectIcons[p.subject] || BookOpen;
          return (
            <div key={p.subject} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{p.subject}</h3>
                </div>
                <span className="text-sm font-bold text-primary">{p.overallPercent}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${p.overallPercent}%` }}
                />
              </div>
              {/* Details */}
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3" /> {p.videosWatched}/{p.videosTotal} فيديو
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardList className="w-3 h-3" /> {p.homeworkDone}/{p.homeworkTotal} واجب
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {p.examsDone}/{p.examsTotal} امتحان
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
