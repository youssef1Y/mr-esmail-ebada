import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BookOpen, ChevronRight, Trophy, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import VideoHomeworkForm from "@/components/VideoHomeworkForm";

interface MCQQuestion {
  question: string;
  options: string[];
  correct: number;
}

const VideoHomeworkPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [homework, setHomework] = useState<{ id: string; description: string | null; questions: MCQQuestion[] } | null>(null);
  const [submission, setSubmission] = useState<{ score: number | null; total: number | null; answers: any[] } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      setUserId(session.user.id);

      // Fetch video title
      const { data: video } = await supabase.from("videos").select("title").eq("id", videoId!).single();
      if (video) setVideoTitle(video.title);

      // Fetch homework
      const { data: hw } = await supabase
        .from("video_homework" as any)
        .select("*")
        .eq("video_id", videoId!)
        .single();

      if (hw) {
        const hwData = hw as any;
        setHomework({ id: hwData.id, description: hwData.description, questions: hwData.questions || [] });

        // Check if already submitted
        const { data: sub } = await supabase
          .from("video_homework_submissions" as any)
          .select("*")
          .eq("homework_id", hwData.id)
          .eq("user_id", session.user.id)
          .single();

        if (sub) {
          const subData = sub as any;
          setSubmission({ score: subData.score, total: subData.total, answers: subData.answers || [] });
          setSubmitted(true);
        }
      }

      setLoading(false);
    };
    init();
  }, [videoId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">لا يوجد واجب لهذا الفيديو</p>
          <Button variant="ghost" onClick={() => navigate(-1)}>العودة</Button>
        </div>
      </div>
    );
  }

  const questions = homework.questions;
  const percentage = submission?.total ? Math.round(((submission.score || 0) / submission.total) * 100) : 0;
  const points = submission?.total ? Math.max(5, Math.min(15, Math.round(((submission.score || 0) / submission.total) * 15))) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">واجب الفيديو</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(-1)}>
            العودة
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold">{videoTitle}</h1>
          <p className="text-xs text-muted-foreground mt-1">واجب على الفيديو</p>
        </div>

        {submitted && submission ? (
          <div className="space-y-4">
            {/* Score Card */}
            <div className="bg-card rounded-xl border-2 border-primary/30 p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary">{submission.score} / {submission.total}</div>
              <p className="text-sm text-muted-foreground">نسبة النجاح: {percentage}%</p>
              <p className="text-sm font-medium text-emerald-600">+{points} نقطة 🎉</p>
            </div>

            {/* Review Answers */}
            <div className="space-y-4">
              {questions.map((q, qIndex) => {
                const studentAnswer = submission.answers?.find((a: any) => a.questionIndex === qIndex);
                const selectedOption = studentAnswer?.selectedOption ?? -1;

                return (
                  <div key={qIndex} className="bg-card rounded-xl border border-border p-4 space-y-2">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground ml-1">{qIndex + 1}.</span>
                      {q.question}
                    </p>
                    <div className="grid gap-1.5">
                      {q.options.map((opt, optIndex) => {
                        const isCorrectOption = optIndex === q.correct;
                        const isSelected = optIndex === selectedOption;

                        let className = "w-full text-right px-3 py-2 rounded-lg border text-xs ";
                        if (isCorrectOption) {
                          className += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium";
                        } else if (isSelected && !isCorrectOption) {
                          className += "border-destructive bg-destructive/10 text-destructive font-medium";
                        } else {
                          className += "border-border bg-card opacity-50";
                        }

                        return (
                          <div key={optIndex} className={className}>
                            <div className="flex items-center justify-between">
                              <span>
                                <span className="text-muted-foreground ml-2">{String.fromCharCode(1571 + optIndex)})</span>
                                {opt}
                              </span>
                              {isCorrectOption && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                              {isSelected && !isCorrectOption && <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : userId ? (
          <VideoHomeworkForm
            homeworkId={homework.id}
            description={homework.description}
            questions={homework.questions}
            userId={userId}
            onSubmitted={() => {
              // Re-fetch submission
              window.location.reload();
            }}
          />
        ) : null}
      </main>
    </div>
  );
};

export default VideoHomeworkPage;
