import { useEffect, useState } from "react";
import { Library, Plus, RefreshCw, Trash2, Edit2, Save, X, Search, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const gradesList = [
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
];
const subjectsList = ["الفقه", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية"];

interface Question {
  id: string;
  grade: string;
  subject: string;
  lesson: string | null;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string | null;
  created_at: string;
}

interface AdminQuestionBankTabProps {
  toast: any;
}

const emptyForm = {
  grade: "",
  subject: "",
  lesson: "",
  question_text: "",
  question_type: "mcq" as "mcq" | "essay",
  options: ["", "", "", ""],
  correct_answer: "",
};

const AdminQuestionBankTab = ({ toast }: AdminQuestionBankTabProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Bulk upload
  const [showBulk, setShowBulk] = useState(false);
  const [bulkGrade, setBulkGrade] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkLesson, setBulkLesson] = useState("");
  const [bulkQuestions, setBulkQuestions] = useState<any[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Filters
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSave = async () => {
    if (!form.grade || !form.subject || !form.question_text) {
      toast({ title: "خطأ", description: "أكمل الحقول المطلوبة (الصف، المادة، نص السؤال)", variant: "destructive" });
      return;
    }

    if (form.question_type === "mcq") {
      const filledOptions = form.options.filter(o => o.trim());
      if (filledOptions.length < 2) {
        toast({ title: "خطأ", description: "أضف على الأقل خيارين", variant: "destructive" });
        return;
      }
      if (!form.correct_answer) {
        toast({ title: "خطأ", description: "حدد الإجابة الصحيحة", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    const cleanOptions = form.question_type === "mcq" ? form.options.filter(o => o.trim()) : null;
    const record = {
      grade: form.grade,
      subject: form.subject,
      lesson: form.lesson || null,
      question_text: form.question_text,
      question_type: form.question_type,
      options: cleanOptions,
      correct_answer: form.question_type === "mcq" ? form.correct_answer : null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("question_bank").update(record).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("question_bank").insert(record));
    }

    setSaving(false);
    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    } else {
      toast({ title: editingId ? "تم التعديل" : "تمت الإضافة" });
      setForm({ ...emptyForm });
      setShowAdd(false);
      setEditingId(null);
      fetchQuestions();
    }
  };

  const startEdit = (q: Question) => {
    setForm({
      grade: q.grade,
      subject: q.subject,
      lesson: q.lesson || "",
      question_text: q.question_text,
      question_type: q.question_type as "mcq" | "essay",
      options: q.options ? [...q.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""],
      correct_answer: q.correct_answer || "",
    });
    setEditingId(q.id);
    setShowAdd(true);
    setShowBulk(false);
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from("question_bank").delete().eq("id", id);
    toast({ title: "تم حذف السؤال" });
    fetchQuestions();
  };

  const cancelEdit = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowAdd(false);
  };

  // ===== BULK: Excel Upload =====
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        
        // Map Excel columns to question format
        const parsed = rows.map((row, idx) => {
          const questionText = row["السؤال"] || row["نص السؤال"] || row["question"] || row["question_text"] || "";
          const opt1 = row["الخيار 1"] || row["خيار1"] || row["option1"] || row["أ"] || "";
          const opt2 = row["الخيار 2"] || row["خيار2"] || row["option2"] || row["ب"] || "";
          const opt3 = row["الخيار 3"] || row["خيار3"] || row["option3"] || row["ج"] || "";
          const opt4 = row["الخيار 4"] || row["خيار4"] || row["option4"] || row["د"] || "";
          const correct = row["الإجابة الصحيحة"] || row["الإجابة"] || row["correct"] || row["correct_answer"] || "";
          const type = row["النوع"] || row["type"] || "mcq";
          const lesson = row["الدرس"] || row["lesson"] || "";

          const options = [opt1, opt2, opt3, opt4].map(String).filter(o => o.trim());
          const questionType = String(type).toLowerCase().includes("مقالي") || String(type).toLowerCase() === "essay" ? "essay" : "mcq";

          return {
            idx: idx + 1,
            question_text: String(questionText).trim(),
            options: questionType === "mcq" ? options : [],
            correct_answer: questionType === "mcq" ? String(correct).trim() : "",
            question_type: questionType,
            lesson: String(lesson).trim(),
            valid: !!String(questionText).trim(),
          };
        }).filter(q => q.valid);

        setBulkQuestions(parsed);
        if (parsed.length === 0) {
          toast({ title: "تنبيه", description: "لم يتم العثور على أسئلة في الملف. تأكد من أن العمود الأول اسمه 'السؤال' أو 'نص السؤال'", variant: "destructive" });
        } else {
          toast({ title: `تم قراءة ${parsed.length} سؤال من الملف` });
        }
      } catch {
        toast({ title: "خطأ", description: "حدث خطأ في قراءة الملف", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleBulkSave = async () => {
    if (!bulkGrade || !bulkSubject) {
      toast({ title: "خطأ", description: "اختر الصف والمادة أولاً", variant: "destructive" });
      return;
    }
    if (bulkQuestions.length === 0) {
      toast({ title: "خطأ", description: "لا توجد أسئلة لحفظها", variant: "destructive" });
      return;
    }

    setBulkSaving(true);
    const records = bulkQuestions.map(q => ({
      grade: bulkGrade,
      subject: bulkSubject,
      lesson: bulkLesson || q.lesson || null,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.question_type === "mcq" && q.options.length >= 2 ? q.options : null,
      correct_answer: q.question_type === "mcq" ? q.correct_answer || null : null,
    }));

    const { error } = await supabase.from("question_bank").insert(records);
    setBulkSaving(false);

    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء حفظ الأسئلة: " + error.message, variant: "destructive" });
    } else {
      toast({ title: `تم حفظ ${records.length} سؤال بنجاح ✅` });
      setBulkQuestions([]);
      setBulkGrade("");
      setBulkSubject("");
      setBulkLesson("");
      setShowBulk(false);
      fetchQuestions();
    }
  };

  const removeBulkQuestion = (idx: number) => {
    setBulkQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const filtered = questions.filter(q =>
    !searchQuery || q.question_text.includes(searchQuery) || (q.lesson || "").includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold font-amiri flex items-center gap-2">
            <Library className="w-5 h-5 text-primary" />
            إدارة بنك الأسئلة
            <span className="text-sm font-normal text-muted-foreground">({questions.length} سؤال)</span>
          </h2>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchQuestions} className="gap-1">
              <RefreshCw className="w-3 h-3" /> تحديث
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowBulk(!showBulk); setShowAdd(false); setEditingId(null); }} className="gap-1">
              <Upload className="w-3 h-3" /> رفع أسئلة بالجملة
            </Button>
            <Button size="sm" onClick={() => { setShowAdd(!showAdd); setShowBulk(false); setEditingId(null); setForm({ ...emptyForm }); }} className="gap-1">
              <Plus className="w-3 h-3" /> سؤال جديد
            </Button>
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
            <Input placeholder="بحث في الأسئلة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9" />
          </div>
        </div>

        {/* ===== BULK UPLOAD SECTION ===== */}
        {showBulk && (
          <div className="bg-muted rounded-xl p-4 mb-4 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              رفع أسئلة بالجملة من ملف Excel
            </h3>

            <div className="bg-background/60 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-bold text-foreground">📋 تنسيق الملف المطلوب:</p>
              <p>الأعمدة: <span className="font-bold">السؤال</span> | <span className="font-bold">الخيار 1</span> | <span className="font-bold">الخيار 2</span> | <span className="font-bold">الخيار 3</span> | <span className="font-bold">الخيار 4</span> | <span className="font-bold">الإجابة الصحيحة</span> | الدرس (اختياري) | النوع (اختياري)</p>
              <p>• الإجابة الصحيحة يجب أن تكون نفس نص أحد الخيارات بالضبط</p>
              <p>• النوع: اتركه فارغ لاختيار من متعدد، أو اكتب "مقالي" للأسئلة المقالية</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">الصف *</Label>
                <select value={bulkGrade} onChange={e => setBulkGrade(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر الصف</option>
                  {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">المادة *</Label>
                <select value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر المادة</option>
                  {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">الدرس (اختياري - يطبق على الكل)</Label>
                <Input value={bulkLesson} onChange={e => setBulkLesson(e.target.value)} placeholder="اسم الدرس" />
              </div>
            </div>

            <div>
              <Label className="text-xs">اختر ملف Excel</Label>
              <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="mt-1" />
            </div>

            {/* Preview parsed questions */}
            {bulkQuestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-primary">معاينة: {bulkQuestions.length} سؤال</p>
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {bulkQuestions.map((q, i) => (
                    <div key={i} className="bg-background rounded-lg p-2 border border-border/50 flex items-start gap-2">
                      <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 mt-0.5 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed">{q.question_text}</p>
                        {q.question_type === "mcq" && q.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {q.options.map((opt: string, j: number) => (
                              <span key={j} className={`text-[10px] rounded px-1.5 py-0.5 border ${opt === q.correct_answer ? "bg-primary/15 text-primary border-primary/30 font-bold" : "bg-muted border-border"}`}>
                                {opt} {opt === q.correct_answer && "✓"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive" onClick={() => removeBulkQuestion(i)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowBulk(false); setBulkQuestions([]); }} className="gap-1">
                <X className="w-3 h-3" /> إلغاء
              </Button>
              <Button size="sm" onClick={handleBulkSave} disabled={bulkSaving || bulkQuestions.length === 0} className="gap-1">
                <Save className="w-3 h-3" /> {bulkSaving ? "جاري الحفظ..." : `حفظ ${bulkQuestions.length} سؤال`}
              </Button>
            </div>
          </div>
        )}

        {/* Add/Edit Single Form */}
        {showAdd && (
          <div className="bg-muted rounded-xl p-4 mb-4 space-y-3">
            <h3 className="font-bold text-sm">{editingId ? "تعديل السؤال" : "إضافة سؤال جديد"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">الصف *</Label>
                <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر الصف</option>
                  {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">المادة *</Label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر المادة</option>
                  {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">الدرس (اختياري)</Label>
                <Input value={form.lesson} onChange={e => setForm({ ...form, lesson: e.target.value })} placeholder="اسم الدرس" />
              </div>
            </div>

            <div>
              <Label className="text-xs">نوع السؤال</Label>
              <div className="flex gap-2 mt-1">
                <Button variant={form.question_type === "mcq" ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, question_type: "mcq" })}>
                  اختيار من متعدد
                </Button>
                <Button variant={form.question_type === "essay" ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, question_type: "essay" })}>
                  مقالي
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs">نص السؤال *</Label>
              <textarea
                value={form.question_text}
                onChange={e => setForm({ ...form, question_text: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                placeholder="اكتب نص السؤال هنا..."
              />
            </div>

            {form.question_type === "mcq" && (
              <div className="space-y-2">
                <Label className="text-xs">الخيارات (2-4 خيارات)</Label>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={opt}
                      onChange={e => {
                        const newOpts = [...form.options];
                        newOpts[i] = e.target.value;
                        setForm({ ...form, options: newOpts });
                      }}
                      placeholder={`الخيار ${i + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant={form.correct_answer === opt && opt.trim() ? "default" : "outline"}
                      size="sm"
                      onClick={() => opt.trim() && setForm({ ...form, correct_answer: opt })}
                      className="text-xs whitespace-nowrap"
                      disabled={!opt.trim()}
                    >
                      {form.correct_answer === opt && opt.trim() ? "✓ صحيح" : "تحديد صحيح"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1">
                <X className="w-3 h-3" /> إلغاء
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
                <Save className="w-3 h-3" /> {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديل" : "إضافة السؤال"}
              </Button>
            </div>
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {questions.length === 0 ? "لا توجد أسئلة بعد. اضغط 'رفع أسئلة بالجملة' لإضافة أسئلة من ملف Excel." : "لا توجد نتائج مطابقة للبحث."}
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
                      <span className="text-[10px] bg-muted-foreground/10 text-muted-foreground rounded-full px-2 py-0.5">
                        {q.question_type === "mcq" ? "اختياري" : "مقالي"}
                      </span>
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
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(q)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف السؤال؟</AlertDialogTitle>
                          <AlertDialogDescription>هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteQuestion(q.id)}>حذف</AlertDialogAction>
                        </AlertDialogFooter>
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
