import { useEffect, useState } from "react";
import { Library, Plus, RefreshCw, Trash2, Edit2, Save, X, Search, Upload, FileSpreadsheet, FileText, Video, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const gradesList = [
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
];
const subjectsList = ["الفقه", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية"];

interface Question {
  id: string; grade: string; subject: string; lesson: string | null;
  question_text: string; question_type: string; options: string[] | null;
  correct_answer: string | null; created_at: string;
}

interface DraftQuestion {
  question_text: string; question_type: "mcq" | "essay";
  options: string[]; correct_answer: string; lesson: string;
}

interface AdminQuestionBankTabProps { toast: any; }

const emptyDraft = (): DraftQuestion => ({
  question_text: "", question_type: "mcq", options: ["", "", "", ""], correct_answer: "", lesson: "",
});

const AdminQuestionBankTab = ({ toast }: AdminQuestionBankTabProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Multi-question add
  const [addGrade, setAddGrade] = useState("");
  const [addSubject, setAddSubject] = useState("");
  const [addLesson, setAddLesson] = useState("");
  const [drafts, setDrafts] = useState<DraftQuestion[]>([emptyDraft()]);

  // Bulk Excel
  const [showBulk, setShowBulk] = useState(false);
  const [bulkGrade, setBulkGrade] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkLesson, setBulkLesson] = useState("");
  const [bulkQuestions, setBulkQuestions] = useState<any[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // PDF Upload
  const [showPdf, setShowPdf] = useState(false);
  const [pdfGrade, setPdfGrade] = useState("");
  const [pdfSubject, setPdfSubject] = useState("");
  const [pdfLesson, setPdfLesson] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfResult, setPdfResult] = useState<any>(null);

  // Filters
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Video AI generation
  const [showVideoGen, setShowVideoGen] = useState(false);
  const [videoGenGrade, setVideoGenGrade] = useState("");
  const [videoGenSubject, setVideoGenSubject] = useState("");
  const [videoGenCount, setVideoGenCount] = useState(5);
  const [videoList, setVideoList] = useState<{id: string; title: string; subject: string; grade: string}[]>([]);
  const [selectedVideoForGen, setSelectedVideoForGen] = useState("");
  const [videoGenLoading, setVideoGenLoading] = useState(false);
  const [videoGenResult, setVideoGenResult] = useState<{questions: any[]; saved: number} | null>(null);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    let query = supabase.from("question_bank").select("*").order("created_at", { ascending: false });
    if (filterGrade) query = query.eq("grade", filterGrade);
    if (filterSubject) query = query.eq("subject", filterSubject);
    const { data } = await query;
    setQuestions((data as Question[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, [filterGrade, filterSubject]);

  // Fetch videos for AI generation
  useEffect(() => {
    if (!showVideoGen) return;
    const fetchVideos = async () => {
      setLoadingVideos(true);
      let query = supabase.from("videos").select("id, title, subject, grade").order("created_at", { ascending: false });
      if (videoGenGrade) query = query.eq("grade", videoGenGrade);
      if (videoGenSubject) query = query.eq("subject", videoGenSubject);
      const { data } = await query.limit(50);
      setVideoList((data || []) as any[]);
      setLoadingVideos(false);
    };
    fetchVideos();
  }, [showVideoGen, videoGenGrade, videoGenSubject]);

  const handleVideoGenerate = async () => {
    if (!selectedVideoForGen) {
      toast({ title: "خطأ", description: "اختر فيديو أولاً", variant: "destructive" });
      return;
    }
    setVideoGenLoading(true);
    setVideoGenResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-video-questions", {
        body: { video_id: selectedVideoForGen, question_count: videoGenCount, save_to_bank: true },
      });
      if (error) throw error;
      if (data?.error === "rate_limited") {
        toast({ title: "انتظر قليلاً", description: "تم تجاوز الحد المسموح، حاول بعد دقيقة", variant: "destructive" });
      } else if (data?.error) {
        toast({ title: "خطأ", description: data.message || "فشل في توليد الأسئلة", variant: "destructive" });
      } else {
        const saved = data.saved_to_bank || 0;
        setVideoGenResult({ questions: data.questions || [], saved });
        toast({ title: `تم توليد وحفظ ${saved} سؤال من الفيديو ✅` });
        fetchQuestions();
      }
    } catch (e) {
      console.error(e);
      toast({ title: "خطأ", description: "فشل في توليد الأسئلة", variant: "destructive" });
    }
    setVideoGenLoading(false);
  };

  const updateDraft = (idx: number, patch: Partial<DraftQuestion>) => {
    setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  };

  const addNewDraft = () => setDrafts(prev => [...prev, emptyDraft()]);

  const removeDraft = (idx: number) => {
    if (drafts.length <= 1) return;
    setDrafts(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAll = async () => {
    if (!addGrade || !addSubject) {
      toast({ title: "خطأ", description: "اختر الصف والمادة أولاً", variant: "destructive" });
      return;
    }

    // Validate drafts
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      if (!d.question_text.trim()) {
        toast({ title: "خطأ", description: `السؤال ${i + 1}: نص السؤال مطلوب`, variant: "destructive" });
        return;
      }
      if (d.question_type === "mcq") {
        const filled = d.options.filter(o => o.trim());
        if (filled.length < 2) {
          toast({ title: "خطأ", description: `السؤال ${i + 1}: أضف على الأقل خيارين`, variant: "destructive" });
          return;
        }
        if (!d.correct_answer) {
          toast({ title: "خطأ", description: `السؤال ${i + 1}: حدد الإجابة الصحيحة`, variant: "destructive" });
          return;
        }
      }
    }

    setSaving(true);

    if (editingId && drafts.length === 1) {
      const d = drafts[0];
      const record = {
        grade: addGrade, subject: addSubject, lesson: (d.lesson || addLesson) || null,
        question_text: d.question_text, question_type: d.question_type,
        options: d.question_type === "mcq" ? d.options.filter(o => o.trim()) : null,
        correct_answer: d.question_type === "mcq" ? d.correct_answer : null,
      };
      const { error } = await supabase.from("question_bank").update(record).eq("id", editingId);
      setSaving(false);
      if (error) { toast({ title: "خطأ", description: "حدث خطأ أثناء الحفظ", variant: "destructive" }); return; }
      toast({ title: "تم التعديل ✅" });
    } else {
      const records = drafts.map(d => ({
        grade: addGrade, subject: addSubject, lesson: (d.lesson || addLesson) || null,
        question_text: d.question_text, question_type: d.question_type,
        options: d.question_type === "mcq" ? d.options.filter(o => o.trim()) : null,
        correct_answer: d.question_type === "mcq" ? d.correct_answer : null,
      }));
      const { error } = await supabase.from("question_bank").insert(records);
      setSaving(false);
      if (error) { toast({ title: "خطأ", description: "حدث خطأ أثناء الحفظ", variant: "destructive" }); return; }
      toast({ title: `تم حفظ ${records.length} سؤال بنجاح ✅` });
    }

    setDrafts([emptyDraft()]);
    setShowAdd(false);
    setEditingId(null);
    fetchQuestions();
  };

  const startEdit = (q: Question) => {
    setAddGrade(q.grade);
    setAddSubject(q.subject);
    setAddLesson(q.lesson || "");
    setDrafts([{
      question_text: q.question_text,
      question_type: q.question_type as "mcq" | "essay",
      options: q.options ? [...q.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""],
      correct_answer: q.correct_answer || "",
      lesson: q.lesson || "",
    }]);
    setEditingId(q.id);
    setShowAdd(true);
    setShowBulk(false);
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from("question_bank").delete().eq("id", id);
    toast({ title: "تم حذف السؤال" });
    fetchQuestions();
  };

  const cancelAdd = () => {
    setDrafts([emptyDraft()]);
    setEditingId(null);
    setShowAdd(false);
    setAddGrade(""); setAddSubject(""); setAddLesson("");
  };

  // ===== Excel Upload =====
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const parsed = rows.map((row, idx) => {
          const questionText = row["السؤال"] || row["نص السؤال"] || row["question"] || "";
          const opts = [row["الخيار 1"]||row["خيار1"]||row["أ"]||"", row["الخيار 2"]||row["خيار2"]||row["ب"]||"",
                        row["الخيار 3"]||row["خيار3"]||row["ج"]||"", row["الخيار 4"]||row["خيار4"]||row["د"]||""]
                        .map(String).filter(o => o.trim());
          const correct = String(row["الإجابة الصحيحة"] || row["الإجابة"] || row["correct"] || "").trim();
          const type = String(row["النوع"] || "").toLowerCase().includes("مقالي") ? "essay" : "mcq";
          const lesson = String(row["الدرس"] || "").trim();
          return { question_text: String(questionText).trim(), options: type === "mcq" ? opts : [], correct_answer: type === "mcq" ? correct : "", question_type: type, lesson, valid: !!String(questionText).trim() };
        }).filter(q => q.valid);
        setBulkQuestions(parsed);
        toast({ title: parsed.length > 0 ? `تم قراءة ${parsed.length} سؤال` : "لم يتم العثور على أسئلة", variant: parsed.length > 0 ? undefined : "destructive" });
      } catch { toast({ title: "خطأ في قراءة الملف", variant: "destructive" }); }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleBulkSave = async () => {
    if (!bulkGrade || !bulkSubject) { toast({ title: "خطأ", description: "اختر الصف والمادة", variant: "destructive" }); return; }
    if (bulkQuestions.length === 0) return;
    setBulkSaving(true);
    const records = bulkQuestions.map(q => ({
      grade: bulkGrade, subject: bulkSubject, lesson: bulkLesson || q.lesson || null,
      question_text: q.question_text, question_type: q.question_type,
      options: q.question_type === "mcq" && q.options.length >= 2 ? q.options : null,
      correct_answer: q.question_type === "mcq" ? q.correct_answer || null : null,
    }));
    const { error } = await supabase.from("question_bank").insert(records);
    setBulkSaving(false);
    if (error) { toast({ title: "خطأ", description: error.message, variant: "destructive" }); return; }
    toast({ title: `تم حفظ ${records.length} سؤال ✅` });
    setBulkQuestions([]); setShowBulk(false); fetchQuestions();
  };

  const handlePdfUpload = async () => {
    if (!pdfGrade || !pdfSubject) {
      toast({ title: "خطأ", description: "اختر الصف والمادة أولاً", variant: "destructive" });
      return;
    }
    if (!pdfFile) {
      toast({ title: "خطأ", description: "اختر ملف PDF أولاً", variant: "destructive" });
      return;
    }

    setPdfParsing(true);
    setPdfResult(null);

    try {
      // Upload PDF to documents bucket
      const ext = pdfFile.name.split('.').pop() || 'pdf';
      const path = `question-bank/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(path, pdfFile);
      if (uploadError) {
        toast({ title: "خطأ", description: "فشل رفع الملف", variant: "destructive" });
        setPdfParsing(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      const pdfUrl = urlData.publicUrl;

      // Call parse-pdf-questions edge function
      const { data, error } = await supabase.functions.invoke("parse-pdf-questions", {
        body: { pdf_url: pdfUrl, grade: pdfGrade, subject: pdfSubject, lesson: pdfLesson || null },
      });

      if (error || !data?.success) {
        toast({ title: "خطأ", description: data?.error || "فشل تحليل الملف", variant: "destructive" });
      } else {
        toast({ title: `تم استخراج وحفظ ${data.count} سؤال ✅` });
        setPdfResult(data);
        setPdfFile(null);
        fetchQuestions();
      }
    } catch (e) {
      console.error("PDF parse error:", e);
      toast({ title: "خطأ", description: "حدث خطأ غير متوقع", variant: "destructive" });
    }

    setPdfParsing(false);
  };

  const filtered = questions.filter(q =>
    !searchQuery || q.question_text.includes(searchQuery) || (q.lesson || "").includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold font-amiri flex items-center gap-2">
            <Library className="w-5 h-5 text-primary" />
            بنك الأسئلة
            <span className="text-sm font-normal text-muted-foreground">({questions.length})</span>
          </h2>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchQuestions} className="gap-1"><RefreshCw className="w-3 h-3" /> تحديث</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowVideoGen(!showVideoGen); setShowPdf(false); setShowBulk(false); setShowAdd(false); }} className="gap-1"><Sparkles className="w-3 h-3" /> من فيديو</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowPdf(!showPdf); setShowBulk(false); setShowAdd(false); setShowVideoGen(false); }} className="gap-1"><FileText className="w-3 h-3" /> رفع PDF</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowBulk(!showBulk); setShowAdd(false); setShowPdf(false); setShowVideoGen(false); }} className="gap-1"><Upload className="w-3 h-3" /> رفع Excel</Button>
            <Button size="sm" onClick={() => { setShowAdd(!showAdd); setShowBulk(false); setShowPdf(false); setShowVideoGen(false); setEditingId(null); setDrafts([emptyDraft()]); setAddGrade(""); setAddSubject(""); setAddLesson(""); }} className="gap-1"><Plus className="w-3 h-3" /> إضافة أسئلة</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">كل الصفوف</option>
            {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">كل المواد</option>
            {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9" />
          </div>
        </div>

        {/* ===== PDF UPLOAD ===== */}
        {showPdf && (
          <div className="bg-muted rounded-xl p-4 mb-4 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> رفع PDF واستخراج الأسئلة بالذكاء الاصطناعي</h3>
            <p className="text-xs text-muted-foreground">ارفع ملف PDF يحتوي على أسئلة وسيتم استخراجها تلقائياً وإضافتها لبنك الأسئلة</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">الصف *</Label>
                <select value={pdfGrade} onChange={e => setPdfGrade(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر الصف</option>
                  {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">المادة *</Label>
                <select value={pdfSubject} onChange={e => setPdfSubject(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر المادة</option>
                  {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">الدرس (اختياري)</Label>
                <Input value={pdfLesson} onChange={e => setPdfLesson(e.target.value)} placeholder="اسم الدرس" />
              </div>
            </div>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-primary/50 rounded-xl p-4 cursor-pointer hover:bg-primary/5 transition-colors">
              <FileText className="w-8 h-8 text-primary mb-2" />
              <span className="text-sm text-primary font-medium">{pdfFile ? pdfFile.name : "اختر ملف PDF"}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) setPdfFile(e.target.files[0]); }} />
            </label>
            {pdfResult && (
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-sm">
                <p className="font-bold text-green-700 dark:text-green-400">✅ تم استخراج {pdfResult.count} سؤال بنجاح</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handlePdfUpload} disabled={pdfParsing || !pdfFile} className="flex-1 gap-1">
                {pdfParsing ? "جاري التحليل..." : "استخراج الأسئلة"}
              </Button>
              <Button variant="outline" onClick={() => { setShowPdf(false); setPdfFile(null); setPdfResult(null); }}>إلغاء</Button>
            </div>
          </div>
        )}

        {/* ===== ADD MULTIPLE QUESTIONS ===== */}
        {showAdd && (
          <div className="bg-muted rounded-xl p-4 mb-4 space-y-4">
            <h3 className="font-bold text-sm">{editingId ? "تعديل السؤال" : `إضافة أسئلة (${drafts.length} سؤال)`}</h3>
            
            {/* Shared grade/subject */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">الصف *</Label>
                <select value={addGrade} onChange={e => setAddGrade(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر الصف</option>
                  {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">المادة *</Label>
                <select value={addSubject} onChange={e => setAddSubject(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر المادة</option>
                  {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">الدرس (اختياري - للكل)</Label>
                <Input value={addLesson} onChange={e => setAddLesson(e.target.value)} placeholder="اسم الدرس" />
              </div>
            </div>

            {/* Each draft question */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {drafts.map((draft, idx) => (
                <div key={idx} className="bg-background rounded-lg p-3 border border-border space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">سؤال {idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <Button variant={draft.question_type === "mcq" ? "default" : "outline"} size="sm" className="h-6 text-[10px] px-2" onClick={() => updateDraft(idx, { question_type: "mcq" })}>اختياري</Button>
                        <Button variant={draft.question_type === "essay" ? "default" : "outline"} size="sm" className="h-6 text-[10px] px-2" onClick={() => updateDraft(idx, { question_type: "essay" })}>مقالي</Button>
                      </div>
                      {drafts.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeDraft(idx)}>
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <textarea
                    value={draft.question_text}
                    onChange={e => updateDraft(idx, { question_text: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                    placeholder="نص السؤال..."
                  />

                  {draft.question_type === "mcq" && (
                    <div className="grid grid-cols-2 gap-2">
                      {draft.options.map((opt, oi) => (
                        <div key={oi} className="flex gap-1 items-center">
                          <Input
                            value={opt}
                            onChange={e => {
                              const newOpts = [...draft.options];
                              newOpts[oi] = e.target.value;
                              updateDraft(idx, { options: newOpts });
                            }}
                            placeholder={`خيار ${oi + 1}`}
                            className="flex-1 h-8 text-xs"
                          />
                          <Button
                            variant={draft.correct_answer === opt && opt.trim() ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-[10px] px-2 shrink-0"
                            disabled={!opt.trim()}
                            onClick={() => opt.trim() && updateDraft(idx, { correct_answer: opt })}
                          >
                            {draft.correct_answer === opt && opt.trim() ? "✓" : "صحيح"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add more + Save */}
            <div className="flex gap-2 justify-between items-center">
              {!editingId && (
                <Button variant="outline" size="sm" onClick={addNewDraft} className="gap-1">
                  <Plus className="w-3 h-3" /> سؤال آخر
                </Button>
              )}
              <div className="flex gap-2 mr-auto">
                <Button variant="outline" size="sm" onClick={cancelAdd} className="gap-1"><X className="w-3 h-3" /> إلغاء</Button>
                <Button size="sm" onClick={handleSaveAll} disabled={saving} className="gap-1">
                  <Save className="w-3 h-3" /> {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديل" : `حفظ ${drafts.length} سؤال`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== BULK EXCEL ===== */}
        {showBulk && (
          <div className="bg-muted rounded-xl p-4 mb-4 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-primary" /> رفع من Excel</h3>
            <div className="bg-background/60 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-bold text-foreground mb-1">📋 الأعمدة المطلوبة:</p>
              <p>السؤال | الخيار 1 | الخيار 2 | الخيار 3 | الخيار 4 | الإجابة الصحيحة | الدرس (اختياري)</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div><Label className="text-xs">الصف *</Label><select value={bulkGrade} onChange={e => setBulkGrade(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">اختر</option>{gradesList.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
              <div><Label className="text-xs">المادة *</Label><select value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">اختر</option>{subjectsList.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><Label className="text-xs">الدرس (اختياري)</Label><Input value={bulkLesson} onChange={e => setBulkLesson(e.target.value)} placeholder="الدرس" /></div>
            </div>
            <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} />
            {bulkQuestions.length > 0 && (
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                <p className="text-xs font-bold text-primary">{bulkQuestions.length} سؤال</p>
                {bulkQuestions.map((q, i) => (
                  <div key={i} className="bg-background rounded-lg p-2 border border-border/50 text-xs flex items-center gap-2">
                    <span className="text-primary font-bold">{i+1}.</span>
                    <span className="flex-1 truncate">{q.question_text}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive shrink-0" onClick={() => setBulkQuestions(p => p.filter((_:any,j:number) => j !== i))}><X className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowBulk(false); setBulkQuestions([]); }}><X className="w-3 h-3" /> إلغاء</Button>
              <Button size="sm" onClick={handleBulkSave} disabled={bulkSaving || !bulkQuestions.length}><Save className="w-3 h-3" /> {bulkSaving ? "جاري الحفظ..." : `حفظ ${bulkQuestions.length} سؤال`}</Button>
            </div>
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-8"><div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {questions.length === 0 ? "لا توجد أسئلة. اضغط 'إضافة أسئلة' للبدء." : "لا توجد نتائج."}
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filtered.map(q => (
              <div key={q.id} className="bg-muted/50 rounded-xl p-3 border border-border/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-relaxed">{q.question_text}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5">{q.grade}</span>
                      <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5">{q.subject}</span>
                      {q.lesson && <span className="text-[10px] bg-muted-foreground/10 text-muted-foreground rounded-full px-2 py-0.5">{q.lesson}</span>}
                      <span className="text-[10px] bg-muted-foreground/10 text-muted-foreground rounded-full px-2 py-0.5">{q.question_type === "mcq" ? "اختياري" : "مقالي"}</span>
                    </div>
                    {q.question_type === "mcq" && q.options && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(q.options as string[]).map((opt, i) => (
                          <span key={i} className={`text-[11px] rounded-lg px-2 py-0.5 border ${opt === q.correct_answer ? "bg-primary/15 text-primary border-primary/30 font-bold" : "bg-background border-border"}`}>
                            {opt} {opt === q.correct_answer && "✓"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(q)}><Edit2 className="w-3 h-3" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>حذف السؤال؟</AlertDialogTitle><AlertDialogDescription>لا يمكن التراجع عن هذا.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => deleteQuestion(q.id)}>حذف</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQuestionBankTab;
