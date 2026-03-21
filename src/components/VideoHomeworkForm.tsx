import { useState } from "react";
import { CheckCircle2, Camera, ImageIcon, Send, Loader2, CheckCircle, XCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { compressImages } from "@/lib/image-compress";

interface MCQQuestion {
  question: string;
  options: string[];
  correct?: number; // May not be present if hidden from client
}

interface VideoHomeworkFormProps {
  homeworkId: string;
  description: string | null;
  questions: MCQQuestion[];
  userId: string;
  onSubmitted: () => void;
}

const VideoHomeworkForm = ({ homeworkId, description, questions, userId, onSubmitted }: VideoHomeworkFormProps) => {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [gradedAnswers, setGradedAnswers] = useState<{ questionIndex: number; selectedOption: number; isCorrect: boolean }[]>([]);

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    if (result) return; // Don't allow changes after submission
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (questions.length > 0) {
      const unanswered = questions.findIndex((_, i) => answers[i] === undefined);
      if (unanswered !== -1) {
        toast({ title: "أجب على جميع الأسئلة", description: `السؤال ${unanswered + 1} لم يتم الإجابة عليه`, variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const ext = file.name.split(".").pop();
        const path = `video-homework/${userId}/${homeworkId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("submissions").upload(path, file);
        if (!error) uploadedUrls.push(path);
      }

      // Submit via server-side grading function (prevents score injection)
      const answersArray = questions.map((q, i) => ({
        questionIndex: i,
        selectedOption: answers[i] ?? -1,
      }));

      const { data: gradeResult, error } = await supabase.rpc("submit_video_homework", {
        p_homework_id: homeworkId,
        p_user_id: userId,
        p_answers: answersArray,
        p_image_urls: uploadedUrls,
      });

      if (error) {
        console.error("Submit error:", error);
        toast({ title: "خطأ", description: error.message || "حدث خطأ أثناء إرسال الواجب", variant: "destructive" });
      } else {
        const serverResult = gradeResult as any;
        const score = serverResult?.score;
        const total = serverResult?.total;
        const submissionId = serverResult?.id;
        
        // Fetch graded answers from server
        if (submissionId) {
          const { data: submission } = await supabase
            .from("video_homework_submissions")
            .select("answers")
            .eq("id", submissionId)
            .single();
          if (submission?.answers) {
            setGradedAnswers(submission.answers as any);
          }
        }
        
        if (score !== null && total !== null && total > 0) {
          setResult({ score, total });
          const points = Math.max(2, Math.min(8, Math.round((score / total) * 8)));
          toast({ title: `تم إرسال الواجب! النتيجة: ${score}/${total} 🎉`, description: `حصلت على ${points} نقطة` });
        } else {
          toast({ title: "تم إرسال الواجب بنجاح! ✅" });
        }
        onSubmitted();
      }
    } catch (err) {
      toast({ title: "خطأ", description: "حدث خطأ غير متوقع", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-border p-4 space-y-4 bg-accent/30">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
        </div>
        <h4 className="font-bold text-sm">واجب الفيديو</h4>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3">{description}</p>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-card rounded-xl border-2 border-primary/30 p-4 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">{result.score} / {result.total}</div>
          <p className="text-xs text-muted-foreground">
            نسبة النجاح: {Math.round((result.score / result.total) * 100)}%
          </p>
          <p className="text-xs font-medium text-emerald-600">
            +{Math.max(2, Math.min(8, Math.round((result.score / result.total) * 8)))} نقطة 🎉
          </p>
        </div>
      )}

      {/* MCQ Questions */}
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="space-y-2">
          <p className="text-sm font-medium">
            <span className="text-muted-foreground ml-1">{qIndex + 1}.</span>
            {q.question}
          </p>
          <div className="grid gap-1.5">
            {q.options.map((opt, optIndex) => {
              const isSelected = answers[qIndex] === optIndex;
              const showResult = result !== null;
              const isCorrectOption = optIndex === q.correct;

              let className = "w-full text-right px-3 py-2 rounded-lg border text-xs transition-colors ";
              if (showResult) {
                if (isCorrectOption) {
                  className += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium";
                } else if (isSelected && !isCorrectOption) {
                  className += "border-destructive bg-destructive/10 text-destructive font-medium";
                } else {
                  className += "border-border bg-card opacity-50";
                }
              } else {
                className += isSelected
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border bg-card hover:border-primary/50";
              }

              return (
                <button
                  key={optIndex}
                  onClick={() => handleSelectAnswer(qIndex, optIndex)}
                  disabled={!!result}
                  className={className}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="text-muted-foreground ml-2">{String.fromCharCode(1571 + optIndex)})</span>
                      {opt}
                    </span>
                    {showResult && isCorrectOption && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                    {showResult && isSelected && !isCorrectOption && <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Image Upload - hide after submission */}
      {!result && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">أرفق صور الحل (اختياري)</p>
          <div className="flex gap-2">
            <label className="flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-border bg-card cursor-pointer hover:border-primary/50 transition-colors text-xs">
              <Camera className="w-3.5 h-3.5" />
              التقاط صورة
              <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
            </label>
            <label className="flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-border bg-card cursor-pointer hover:border-primary/50 transition-colors text-xs">
              <ImageIcon className="w-3.5 h-3.5" />
              من المعرض
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          {imagePreviews.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl-lg px-1 text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!result && (
        <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {submitting ? "جاري الإرسال..." : "إرسال الواجب"}
        </Button>
      )}
    </div>
  );
};

export default VideoHomeworkForm;
