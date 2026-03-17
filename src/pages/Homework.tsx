import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, FileText, Upload, CheckCircle, Clock, Image as ImageIcon, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as AuthUser } from "@supabase/supabase-js";

interface HomeworkItem {
  id: string;
  title: string;
  description: string | null;
  grade: string;
  subject: string;
  due_date: string | null;
  created_at: string;
  pdf_url: string | null;
}

interface Submission {
  id: string;
  homework_id: string;
  content: string | null;
  image_urls: string[];
  score: number | null;
  feedback: string | null;
  submitted_at: string;
}

const Homework = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [grade, setGrade] = useState("");
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHw, setSelectedHw] = useState<HomeworkItem | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerImages, setAnswerImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      setUser(session.user);

      const { data: profile } = await supabase.from("profiles").select("grade").eq("user_id", session.user.id).single();
      if (profile) {
        setGrade(profile.grade);
        const { data: hw } = await supabase.from("homework").select("*").eq("grade", profile.grade).order("created_at", { ascending: false });
        if (hw) setHomeworkList(hw as HomeworkItem[]);

        const { data: subs } = await supabase.from("homework_submissions").select("*").eq("user_id", session.user.id);
        if (subs) setSubmissions(subs as Submission[]);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const getSubmission = (hwId: string) => submissions.find(s => s.homework_id === hwId);

  const handleSubmit = async () => {
    if (!user || !selectedHw) return;
    if (!answerText && answerImages.length === 0) {
      toast({ title: "خطأ", description: "اكتب إجابتك أو ارفع صور", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const imageUrls: string[] = [];

    for (const file of answerImages) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from("submissions").upload(path, file);
      if (!error) {
        // Use signed URLs for private submissions bucket
        const { data } = await supabase.storage.from("submissions").createSignedUrl(path, 86400);
        if (data) imageUrls.push(data.signedUrl);
      }
    }

    const { error } = await supabase.from("homework_submissions").insert({
      homework_id: selectedHw.id,
      user_id: user.id,
      content: answerText || null,
      image_urls: imageUrls,
    });

    // Points are awarded server-side only (admin or edge functions)

    setSubmitting(false);
    if (error) {
      console.error("Homework submission error:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء تسليم الواجب", variant: "destructive" });
    } else {
      toast({ title: "تم التسليم", description: "تم تسليم الواجب بنجاح" });
      setSelectedHw(null);
      setAnswerText("");
      setAnswerImages([]);
      // Refresh submissions
      const { data: subs } = await supabase.from("homework_submissions").select("*").eq("user_id", user.id);
      if (subs) setSubmissions(subs as Submission[]);
    }
  };

  const removeImage = (index: number) => setAnswerImages(prev => prev.filter((_, i) => i !== index));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">الواجبات المنزلية</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold font-amiri text-center mb-6">الواجبات المنزلية</h1>

        {/* Submit dialog */}
        {selectedHw && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedHw(null)}>
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="font-bold text-lg mb-1">{selectedHw.title}</h2>
              {selectedHw.description && <p className="text-sm text-muted-foreground mb-2">{selectedHw.description}</p>}
              {(selectedHw as any).pdf_url && (
                <a href={(selectedHw as any).pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4">
                  <FileText className="w-4 h-4" />
                  عرض ملف PDF الواجب
                </a>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">إجابتك</label>
                  <textarea
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">رفع صور الحل</label>
                  <div className="flex gap-2">
                    {/* Camera capture */}
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-primary/50 rounded-xl p-4 cursor-pointer hover:bg-primary/5 transition-colors">
                      <Camera className="w-6 h-6 text-primary mb-1" />
                      <span className="text-xs text-primary font-medium">التقاط من الكاميرا</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
                        if (e.target.files) setAnswerImages(prev => [...prev, ...Array.from(e.target.files!)]);
                      }} />
                    </label>
                    {/* Gallery pick */}
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">اختيار من المعرض</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                        if (e.target.files) setAnswerImages(prev => [...prev, ...Array.from(e.target.files!)]);
                      }} />
                    </label>
                  </div>
                  {answerImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {answerImages.map((f, i) => (
                        <div key={i} className="relative">
                          <img src={URL.createObjectURL(f)} className="w-16 h-16 object-cover rounded-lg border border-border" />
                          <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                    {submitting ? "جاري التسليم..." : "تسليم الواجب"}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedHw(null)}>إلغاء</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {homeworkList.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">لا توجد واجبات حالياً</p>
          </div>
        ) : (
          <div className="space-y-3">
            {homeworkList.map(hw => {
              const sub = getSubmission(hw.id);
              const isOverdue = hw.due_date && new Date(hw.due_date) < new Date();
              return (
                <div key={hw.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm">{hw.title}</h3>
                      <p className="text-xs text-muted-foreground">{hw.subject}</p>
                      {hw.description && <p className="text-xs text-muted-foreground mt-1">{hw.description}</p>}
                      {hw.due_date && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                          <Clock className="w-3 h-3" />
                          الموعد النهائي: {new Date(hw.due_date).toLocaleDateString("ar-EG")}
                        </p>
                      )}
                      {(hw as any).pdf_url && (
                        <a href={(hw as any).pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                          <FileText className="w-3 h-3" />
                          عرض ملف PDF
                        </a>
                      )}
                    </div>
                    {sub ? (
                      <div className="text-center">
                        <CheckCircle className="w-5 h-5 text-primary mx-auto" />
                        <span className="text-xs text-primary">تم التسليم</span>
                        {sub.score !== null && (
                          <p className="text-xs font-bold text-primary mt-0.5">{sub.score}/{(sub as any).total || "?"}</p>
                        )}
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => setSelectedHw(hw)} disabled={!!isOverdue}>
                        {isOverdue ? "انتهى الوقت" : "تسليم الواجب"}
                      </Button>
                    )}
                  </div>
                  {sub?.feedback && (
                    <div className="mt-2 bg-primary/5 rounded-lg p-2">
                      <p className="text-xs font-medium">ملاحظات الأستاذ:</p>
                      <p className="text-xs text-muted-foreground">{sub.feedback}</p>
                    </div>
                  )}
                  {sub?.image_urls && sub.image_urls.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {sub.image_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} className="w-12 h-12 object-cover rounded-lg border border-border" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Homework;
