import { useEffect, useState } from "react";
import { Trophy, Plus, RefreshCw, Trash2, Gift, Users, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface AdminCompetitionTabProps {
  toast: any;
}

const AdminCompetitionTab = ({ toast }: AdminCompetitionTabProps) => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newComp, setNewComp] = useState({ title: "", week_start: "", week_end: "", prize_description: "شهادة تقدير" });
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [drawResult, setDrawResult] = useState<any>(null);

  const fetchCompetitions = async () => {
    setLoading(true);
    const { data } = await supabase.from("weekly_competitions" as any).select("*").order("created_at", { ascending: false });
    if (data) setCompetitions(data as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchCompetitions(); }, []);

  const addCompetition = async () => {
    if (!newComp.title || !newComp.week_start || !newComp.week_end) {
      toast({ title: "خطأ", description: "أكمل الحقول المطلوبة", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("weekly_competitions" as any).insert({
      title: newComp.title,
      week_start: newComp.week_start,
      week_end: newComp.week_end,
      prize_description: newComp.prize_description || "شهادة تقدير",
      status: "active",
    } as any);
    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الإضافة", variant: "destructive" });
    } else {
      toast({ title: "تم إنشاء المسابقة" });
      setNewComp({ title: "", week_start: "", week_end: "", prize_description: "شهادة تقدير" });
      setShowAdd(false);
      fetchCompetitions();
    }
  };

  const deleteCompetition = async (id: string) => {
    await supabase.from("weekly_competitions" as any).delete().eq("id", id);
    toast({ title: "تم حذف المسابقة" });
    fetchCompetitions();
  };

  const viewEntries = async (comp: any) => {
    setSelectedComp(comp);
    setEntriesLoading(true);
    setDrawResult(null);
    const { data: entriesData } = await supabase.from("competition_entries" as any).select("*").eq("competition_id", comp.id).order("created_at", { ascending: false });
    
    if (entriesData && (entriesData as any[]).length > 0) {
      const userIds = [...new Set((entriesData as any[]).map((e: any) => e.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, grade, student_phone").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      
      const enriched = (entriesData as any[]).map((e: any) => ({
        ...e,
        student_name: profileMap.get(e.user_id)?.full_name || "غير معروف",
        student_grade: profileMap.get(e.user_id)?.grade || "",
        student_phone: profileMap.get(e.user_id)?.student_phone || "",
      }));
      setEntries(enriched);
    } else {
      setEntries([]);
    }
    setEntriesLoading(false);
  };

  const performDraw = async () => {
    if (!selectedComp) return;
    const correctEntries = entries.filter((e: any) => e.is_correct);
    if (correctEntries.length === 0) {
      toast({ title: "لا يوجد مشاركون فازوا بالإجابة الصحيحة", variant: "destructive" });
      return;
    }

    // Random winner from correct answers
    const winner = correctEntries[Math.floor(Math.random() * correctEntries.length)];
    setDrawResult(winner);

    // Update competition with winner
    await supabase.from("weekly_competitions" as any).update({
      status: "completed",
      winner_id: winner.user_id,
      winner_name: winner.student_name,
    } as any).eq("id", selectedComp.id);

    toast({ title: `🎉 الفائز: ${winner.student_name}!` });
    fetchCompetitions();
  };

  const endCompetition = async (id: string) => {
    await supabase.from("weekly_competitions" as any).update({ status: "completed" } as any).eq("id", id);
    toast({ title: "تم إنهاء المسابقة" });
    fetchCompetitions();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-amiri flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            إدارة المسابقات الأسبوعية
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCompetitions} className="gap-1">
              <RefreshCw className="w-3 h-3" /> تحديث
            </Button>
            <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-1">
              <Plus className="w-3 h-3" /> مسابقة جديدة
            </Button>
          </div>
        </div>

        {showAdd && (
          <div className="bg-muted rounded-xl p-4 space-y-3 mb-4">
            <Input value={newComp.title} onChange={e => setNewComp({ ...newComp, title: e.target.value })} placeholder="عنوان المسابقة (مثلاً: مسابقة الأسبوع الأول)" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">تاريخ البداية</Label>
                <Input type="date" value={newComp.week_start} onChange={e => setNewComp({ ...newComp, week_start: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">تاريخ النهاية</Label>
                <Input type="date" value={newComp.week_end} onChange={e => setNewComp({ ...newComp, week_end: e.target.value })} />
              </div>
            </div>
            <Input value={newComp.prize_description} onChange={e => setNewComp({ ...newComp, prize_description: e.target.value })} placeholder="وصف الجائزة" />
            <div className="flex gap-2">
              <Button onClick={addCompetition} size="sm" className="flex-1">إنشاء المسابقة</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>إلغاء</Button>
            </div>
          </div>
        )}

        {/* Entries Modal */}
        {selectedComp && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedComp(null)}>
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{selectedComp.title}</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedComp(null)}>✕</Button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="bg-muted rounded-lg p-2 text-center flex-1">
                  <p className="text-lg font-bold">{entries.length}</p>
                  <p className="text-xs text-muted-foreground">إجمالي المشاركات</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2 text-center flex-1">
                  <p className="text-lg font-bold text-green-600">{entries.filter((e: any) => e.is_correct).length}</p>
                  <p className="text-xs text-muted-foreground">إجابات صحيحة</p>
                </div>
              </div>

              {selectedComp.status === "active" && (
                <Button onClick={performDraw} className="w-full mb-4 gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  <Shuffle className="w-4 h-4" /> إجراء السحب العشوائي
                </Button>
              )}

              {drawResult && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-500 rounded-xl p-4 mb-4 text-center">
                  <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">الفائز هو</p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{drawResult.student_name}</p>
                  <p className="text-sm text-muted-foreground">{drawResult.student_grade} - {drawResult.student_phone}</p>
                </div>
              )}

              {entriesLoading ? (
                <p className="text-center text-muted-foreground py-4">جاري التحميل...</p>
              ) : entries.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">لا توجد مشاركات بعد</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {entries.map((e: any) => (
                    <div key={e.id} className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{e.student_name}</p>
                        <p className="text-xs text-muted-foreground">{e.student_grade} - {new Date(e.created_at).toLocaleDateString("ar-EG")}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${e.is_correct ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
                        {e.is_correct ? "صحيح ✅" : "خطأ ❌"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground py-6">جاري التحميل...</p>
        ) : competitions.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">لا توجد مسابقات</p>
        ) : (
          <div className="space-y-2">
            {competitions.map((comp: any) => (
              <div key={comp.id} className="bg-background rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm">{comp.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${comp.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                        {comp.status === "active" ? "نشطة" : "منتهية"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comp.week_start).toLocaleDateString("ar-EG")} - {new Date(comp.week_end).toLocaleDateString("ar-EG")}
                    </p>
                    <p className="text-xs text-muted-foreground">🎁 {comp.prize_description}</p>
                    {comp.winner_name && (
                      <p className="text-xs font-bold text-amber-600 mt-1">🏆 الفائز: {comp.winner_name}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => viewEntries(comp)} className="gap-1 h-7 text-xs">
                      <Users className="w-3 h-3" /> المشاركات
                    </Button>
                    {comp.status === "active" && (
                      <Button variant="outline" size="sm" onClick={() => endCompetition(comp.id)} className="h-7 text-xs">
                        إنهاء
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteCompetition(comp.id)} className="text-destructive h-7 w-7">
                      <Trash2 className="w-3 h-3" />
                    </Button>
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

export default AdminCompetitionTab;
