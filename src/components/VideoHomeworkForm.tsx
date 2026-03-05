import { useState } from "react";
import { CheckCircle2, Camera, ImageIcon, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MCQQuestion {
  question: string;
  options: string[];
  correct: number;
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

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
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
    // Validate MCQ answers
    if (questions.length > 0) {
      const unanswered = questions.findIndex((_, i) => answers[i] === undefined);
      if (unanswered !== -1) {
        toast({ title: "أجب على جميع الأسئلة", description: `السؤال ${unanswered + 1} لم يتم الإجابة عليه`, variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);
    try {
      // Upload images
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const ext = file.name.split(".").pop();
        const path = `video-homework/${userId}/${homeworkId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("submissions").upload(path, file);
        if (!error) uploadedUrls.push(path);
      }

      // Build answers array
      const answersArray = questions.map((q, i) => ({
        questionIndex: i,
        selectedOption: answers[i] ?? -1,
        isCorrect: answers[i] === q.correct,
      }));

      const { error } = await supabase.from("video_homework_submissions").insert({
        homework_id: homeworkId,
        user_id: userId,
        answers: answersArray,
        image_urls: uploadedUrls,
      });

      if (error) {
        console.error("Submit error:", error);
        toast({ title: "خطأ", description: "حدث خطأ أثناء إرسال الواجب", variant: "destructive" });
      } else {
        toast({ title: "تم إرسال الواجب بنجاح! ✅" });
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

      {/* MCQ Questions */}
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="space-y-2">
          <p className="text-sm font-medium">
            <span className="text-muted-foreground ml-1">{qIndex + 1}.</span>
            {q.question}
          </p>
          <div className="grid gap-1.5">
            {q.options.map((opt, optIndex) => (
              <button
                key={optIndex}
                onClick={() => handleSelectAnswer(qIndex, optIndex)}
                className={`w-full text-right px-3 py-2 rounded-lg border text-xs transition-colors ${
                  answers[qIndex] === optIndex
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <span className="text-muted-foreground ml-2">{String.fromCharCode(1571 + optIndex)})</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Image Upload */}
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

      <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {submitting ? "جاري الإرسال..." : "إرسال الواجب"}
      </Button>
    </div>
  );
};

export default VideoHomeworkForm;
