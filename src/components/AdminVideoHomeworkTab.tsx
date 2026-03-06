import { useEffect, useState } from "react";
import { Trash2, Search, Eye, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const grades = [
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
];

interface VideoHwSubmission {
  id: string;
  homework_id: string;
  user_id: string;
  answers: any[];
  image_urls: string[];
  submitted_at: string;
  score: number | null;
  total: number | null;
  // joined
  video_title: string;
  video_grade: string;
  video_subject: string;
  hw_questions: any[];
  student_name: string;
  student_phone: string;
  parent_phone: string | null;
  student_grade: string;
  student_school: string | null;
  student_governorate: string | null;
}

const AdminVideoHomeworkTab = ({ toast }: { toast: any }) => {
  const [submissions, setSubmissions] = useState<VideoHwSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterGrade, setFilterGrade] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingImages, setViewingImages] = useState<string[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);

    // Fetch all video homework submissions
    const { data: subs } = await supabase
      .from("video_homework_submissions" as any)
      .select("*")
      .order("submitted_at", { ascending: false });

    if (!subs || (subs as any[]).length === 0) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const typedSubs = subs as any[];

    // Get homework details
    const hwIds = [...new Set(typedSubs.map(s => s.homework_id))];
    const { data: hwData } = await supabase
      .from("video_homework" as any)
      .select("*")
      .in("id", hwIds);
    const hwMap = new Map((hwData as any[] || []).map(h => [h.id, h]));

    // Get video details
    const videoIds = [...new Set((hwData as any[] || []).map(h => h.video_id))];
    const { data: videoData } = await supabase
      .from("videos")
      .select("id, title, grade, subject")
      .in("id", videoIds);
    const videoMap = new Map((videoData || []).map(v => [v.id, v]));

    // Get student profiles
    const userIds = [...new Set(typedSubs.map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, student_phone, parent_phone, grade, school, governorate")
      .in("user_id", userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const enriched: VideoHwSubmission[] = typedSubs.map(s => {
      const hw: any = hwMap.get(s.homework_id) || {};
      const video: any = videoMap.get(hw.video_id) || {};
      const profile: any = profileMap.get(s.user_id) || {};
      return {
        id: s.id,
        homework_id: s.homework_id,
        user_id: s.user_id,
        answers: s.answers || [],
        image_urls: s.image_urls || [],
        submitted_at: s.submitted_at,
        score: s.score ?? null,
        total: s.total ?? null,
        video_title: video.title || "—",
        video_grade: video.grade || "",
        video_subject: video.subject || "",
        hw_questions: hw.questions || [],
        student_name: profile.full_name || "—",
        student_phone: profile.student_phone || "",
        parent_phone: profile.parent_phone || null,
        student_grade: profile.grade || "",
        student_school: profile.school || null,
        student_governorate: profile.governorate || null,
      };
    });

    setSubmissions(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const deleteSubmission = async (id: string) => {
    await supabase.from("video_homework_submissions" as any).delete().eq("id", id);
    setSubmissions(prev => prev.filter(s => s.id !== id));
    toast({ title: "تم حذف التسليم" });
  };

  const resolveImageUrl = async (path: string) => {
    const { data } = await supabase.storage.from("submissions").createSignedUrl(path, 3600);
    return data?.signedUrl || path;
  };

  const viewImages = async (urls: string[]) => {
    const resolved = await Promise.all(urls.map(resolveImageUrl));
    setViewingImages(resolved);
  };

  const filtered = submissions.filter(s => {
    if (filterGrade && s.video_grade !== filterGrade) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.student_name.toLowerCase().includes(q) || s.student_phone.includes(q) || s.video_title.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold font-amiri flex items-center gap-2">
          <Video className="w-5 h-5" />
          واجبات الفيديو
        </h2>
        <p className="text-xs text-muted-foreground">تسليمات الطلاب لواجبات الفيديوهات</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف أو عنوان الفيديو..."
            className="pr-10"
          />
        </div>
        <div>
          <Label>فلترة حسب المرحلة</Label>
          <select
            value={filterGrade}
            onChange={e => setFilterGrade(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">كل المراحل</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">لا توجد تسليمات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-bold text-sm">{s.student_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      📱 {s.student_phone}
                      {s.parent_phone && <span className="mr-3">👨‍👩‍👦 {s.parent_phone}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      🎓 {s.student_grade}
                      {s.student_school && <span className="mr-2">· {s.student_school}</span>}
                      {s.student_governorate && <span className="mr-2">· {s.student_governorate}</span>}
                    </p>
                     <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        {s.video_subject}
                      </span>
                      <span className="text-xs font-medium">{s.video_title}</span>
                      {s.score !== null && s.total !== null && s.total > 0 && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          s.score === s.total 
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                            : s.score / s.total >= 0.5
                            ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                            : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                        }`}>
                          {s.score}/{s.total}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(s.submitted_at).toLocaleDateString("ar-EG")} · {new Date(s.submitted_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {s.image_urls.length > 0 && (
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => viewImages(s.image_urls)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSubmission(s.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Toggle answers */}
                <button
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  className="text-xs text-primary mt-2 hover:underline"
                >
                  {expandedId === s.id ? "إخفاء الإجابات" : "عرض الإجابات"}
                </button>
              </div>

              {expandedId === s.id && (
                <div className="border-t border-border p-4 bg-muted/30 space-y-2">
                  {s.hw_questions.length > 0 ? (
                    s.hw_questions.map((q: any, qi: number) => {
                      const studentAnswer = s.answers.find((a: any) => a.questionIndex === qi);
                      const selectedOpt = studentAnswer?.selectedOption ?? -1;
                      const isCorrect = studentAnswer?.isCorrect ?? false;

                      return (
                        <div key={qi} className="space-y-1">
                          <p className="text-xs font-medium">
                            <span className="text-muted-foreground ml-1">{qi + 1}.</span>
                            {q.question}
                          </p>
                          <div className="grid gap-1">
                            {(q.options || []).map((opt: string, oi: number) => (
                              <div
                                key={oi}
                                className={`text-[11px] px-2 py-1 rounded border ${
                                  oi === q.correct
                                    ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800"
                                    : oi === selectedOpt && !isCorrect
                                    ? "border-destructive bg-destructive/10"
                                    : "border-border"
                                }`}
                              >
                                {oi === selectedOpt && "◀ "}
                                {opt}
                                {oi === q.correct && " ✓"}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">لا توجد أسئلة MCQ - تسليم صور فقط</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImages && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setViewingImages(null)}>
          <div className="bg-card rounded-2xl border border-border p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">صور الإجابة</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingImages(null)}>✕</Button>
            </div>
            <div className="space-y-4">
              {viewingImages.map((url, i) => (
                <img key={i} src={url} className="w-full rounded-lg border border-border" alt={`صورة ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVideoHomeworkTab;
