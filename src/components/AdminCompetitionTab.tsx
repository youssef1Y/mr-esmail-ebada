import { useEffect, useState } from "react";
import { Trophy, Plus, RefreshCw, Trash2, Users, Shuffle, Clock, Calendar, Eye } from "lucide-react";
import { sendPushToUsers } from "@/lib/push-utils";
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
  const [newComp, setNewComp] = useState({
    title: "", week_start: "", week_end: "", prize_description: "شهادة تقدير",
    draw_type: "manual" as "manual" | "scheduled",
    draw_date: "", draw_time: "",
  });
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [drawResult, setDrawResult] = useState<any>(null);
  const [viewTab, setViewTab] = useState<"active" | "winners">("active");
  const [winnerDetails, setWinnerDetails] = useState<any>(null);

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
    if (newComp.draw_type === "scheduled" && !newComp.draw_date) {
      toast({ title: "خطأ", description: "حدد تاريخ السحب", variant: "destructive" });
      return;
    }
    const insertData: any = {
      title: newComp.title,
      week_start: newComp.week_start,
      week_end: newComp.week_end,
      prize_description: newComp.prize_description || "شهادة تقدير",
      status: "active",
      draw_type: newComp.draw_type,
    };
    if (newComp.draw_type === "scheduled") {
      insertData.draw_date = newComp.draw_date;
      insertData.draw_time = newComp.draw_time || "18:00";
    }
    const { error } = await supabase.from("weekly_competitions" as any).insert(insertData);
    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الإضافة", variant: "destructive" });
    } else {
      toast({ title: "تم إنشاء المسابقة" });
      setNewComp({ title: "", week_start: "", week_end: "", prize_description: "شهادة تقدير", draw_type: "manual", draw_date: "", draw_time: "" });
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
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, grade, student_phone, is_subscribed").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      
      const enriched = (entriesData as any[]).map((e: any) => ({
        ...e,
        student_name: profileMap.get(e.user_id)?.full_name || "غير معروف",
        student_grade: profileMap.get(e.user_id)?.grade || "",
        student_phone: profileMap.get(e.user_id)?.student_phone || "",
        is_subscribed: profileMap.get(e.user_id)?.is_subscribed || false,
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

    const subscriberIds = correctEntries.map((e: any) => e.user_id);
    const { data: subscribedProfiles } = await supabase
      .from("profiles")
      .select("user_id")
      .in("user_id", subscriberIds)
      .eq("is_subscribed", true);
    
    const subscribedUserIds = new Set((subscribedProfiles || []).map(p => p.user_id));
    const eligibleEntries = correctEntries.filter((e: any) => subscribedUserIds.has(e.user_id));

    if (eligibleEntries.length === 0) {
      toast({ title: "لا يوجد مشتركون فازوا بالإجابة الصحيحة", description: "يجب أن يكون الفائز مشتركاً في المنصة", variant: "destructive" });
      return;
    }

    const winner = eligibleEntries[Math.floor(Math.random() * eligibleEntries.length)];
    setDrawResult(winner);

    await supabase.from("weekly_competitions" as any).update({
      status: "completed",
      winner_id: winner.user_id,
      winner_name: winner.student_name,
    } as any).eq("id", selectedComp.id);

    await supabase.from("student_notifications").insert({
      user_id: winner.user_id,
      title: "🏆 مبروك! فزت في المسابقة الأسبوعية",
      body: `تهانينا! لقد فزت في "${selectedComp.title}" 🎉 يمكنك الآن تحميل شهادة الفوز من صفحة الشهادات.`,
      type: "competition_winner",
    });

    sendPushToUsers(
      "🏆 مبروك! فزت في المسابقة",
      `تهانينا! فزت في "${selectedComp.title}" 🎉 حمّل شهادتك الذهبية الآن!`,
      [winner.user_id]
    );

    toast({ title: `🎉 الفائز: ${winner.student_name}!` });
    fetchCompetitions();
  };

  const endCompetition = async (id: string) => {
    await supabase.from("weekly_competitions" as any).update({ status: "completed" } as any).eq("id", id);
    toast({ title: "تم إنهاء المسابقة" });
    fetchCompetitions();
  };

  const viewWinnerDetails = async (comp: any) => {
    if (!comp.winner_id) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, grade, student_phone, parent_phone, school, governorate, is_subscribed")
      .eq("user_id", comp.winner_id)
      .single();
    setWinnerDetails({ ...comp, profile });
  };

  const activeComps = competitions.filter(c => c.status === "active");
  const completedComps = competitions.filter(c => c.status === "completed");

  const getDrawCountdown = (comp: any) => {
    if (comp.draw_type !== "scheduled" || !comp.draw_date) return null;
    const drawTime = new Date(`${comp.draw_date}T${comp.draw_time || '18:00'}:00`);
    const now = new Date();
    const diff = drawTime.getTime() - now.getTime();
    if (diff <= 0) return "حان وقت السحب!";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `السحب بعد ${days} يوم و ${hours} ساعة`;
    return `السحب بعد ${hours} ساعة`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
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

        {/* Add Form */}
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
            
            {/* Draw Type */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">نوع السحب</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newComp.draw_type === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewComp({ ...newComp, draw_type: "manual" })}
                  className="flex-1 gap-1"
                >
                  <Shuffle className="w-3 h-3" /> يدوي
                </Button>
                <Button
                  type="button"
                  variant={newComp.draw_type === "scheduled" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewComp({ ...newComp, draw_type: "scheduled" })}
                  className="flex-1 gap-1"
                >
                  <Clock className="w-3 h-3" /> مجدول تلقائي
                </Button>
              </div>
            </div>

            {newComp.draw_type === "scheduled" && (
              <div className="grid grid-cols-2 gap-2 bg-background/50 rounded-lg p-3 border border-border">
                <div>
                  <Label className="text-xs">تاريخ السحب</Label>
                  <Input type="date" value={newComp.draw_date} onChange={e => setNewComp({ ...newComp, draw_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">وقت السحب</Label>
                  <Input type="time" value={newComp.draw_time} onChange={e => setNewComp({ ...newComp, draw_time: e.target.value })} placeholder="18:00" />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={addCompetition} size="sm" className="flex-1">إنشاء المسابقة</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>إلغاء</Button>
            </div>
          </div>
        )}

        {/* View Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={viewTab === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewTab("active")}
            className="gap-1"
          >
            <Calendar className="w-3 h-3" /> المسابقات النشطة ({activeComps.length})
          </Button>
          <Button
            variant={viewTab === "winners" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewTab("winners")}
            className="gap-1"
          >
            <Trophy className="w-3 h-3" /> الفائزون السابقون ({completedComps.filter(c => c.winner_name).length})
          </Button>
        </div>

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
                  <Shuffle className="w-4 h-4" /> إجراء السحب العشوائي الآن
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

        {/* Winner Details Modal */}
        {winnerDetails && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setWinnerDetails(null)}>
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">بيانات الفائز</h3>
                <Button variant="ghost" size="sm" onClick={() => setWinnerDetails(null)}>✕</Button>
              </div>
              <div className="text-center mb-4">
                <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <p className="text-lg font-bold">{winnerDetails.winner_name}</p>
                <p className="text-xs text-muted-foreground">{winnerDetails.title}</p>
              </div>
              {winnerDetails.profile && (
                <div className="space-y-2 bg-muted rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الصف:</span>
                    <span className="font-bold">{winnerDetails.profile.grade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الهاتف:</span>
                    <span className="font-bold" dir="ltr">{winnerDetails.profile.student_phone}</span>
                  </div>
                  {winnerDetails.profile.parent_phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">هاتف ولي الأمر:</span>
                      <span className="font-bold" dir="ltr">{winnerDetails.profile.parent_phone}</span>
                    </div>
                  )}
                  {winnerDetails.profile.school && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المدرسة:</span>
                      <span className="font-bold">{winnerDetails.profile.school}</span>
                    </div>
                  )}
                  {winnerDetails.profile.governorate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المحافظة:</span>
                      <span className="font-bold">{winnerDetails.profile.governorate}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">حالة الاشتراك:</span>
                    <span className={`font-bold ${winnerDetails.profile.is_subscribed ? "text-green-600" : "text-red-500"}`}>
                      {winnerDetails.profile.is_subscribed ? "مشترك ✅" : "غير مشترك"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الجائزة:</span>
                    <span className="font-bold">🎁 {winnerDetails.prize_description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاريخ المسابقة:</span>
                    <span className="font-bold">{new Date(winnerDetails.week_start).toLocaleDateString("ar-EG")} - {new Date(winnerDetails.week_end).toLocaleDateString("ar-EG")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <p className="text-center text-muted-foreground py-6">جاري التحميل...</p>
        ) : viewTab === "active" ? (
          /* Active Competitions */
          activeComps.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">لا توجد مسابقات نشطة</p>
              <p className="text-xs text-muted-foreground">اضغط "مسابقة جديدة" لإنشاء واحدة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeComps.map((comp: any) => {
                const countdown = getDrawCountdown(comp);
                return (
                  <div key={comp.id} className="bg-background rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm">{comp.title}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                            نشطة
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${comp.draw_type === "scheduled" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" : "bg-muted text-muted-foreground"}`}>
                            {comp.draw_type === "scheduled" ? "⏰ سحب تلقائي" : "🎲 سحب يدوي"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comp.week_start).toLocaleDateString("ar-EG")} - {new Date(comp.week_end).toLocaleDateString("ar-EG")}
                        </p>
                        <p className="text-xs text-muted-foreground">🎁 {comp.prize_description}</p>
                        {countdown && (
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {countdown}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => viewEntries(comp)} className="gap-1 h-7 text-xs">
                          <Users className="w-3 h-3" /> المشاركات
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => endCompetition(comp.id)} className="h-7 text-xs">
                          إنهاء
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCompetition(comp.id)} className="text-destructive h-7 w-7">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Winners History */
          completedComps.filter(c => c.winner_name).length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">لا يوجد فائزون سابقون</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedComps.filter(c => c.winner_name).map((comp: any) => (
                <div key={comp.id} className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/10 dark:to-orange-950/10 rounded-xl border border-amber-200 dark:border-amber-800/30 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{comp.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comp.week_start).toLocaleDateString("ar-EG")} - {new Date(comp.week_end).toLocaleDateString("ar-EG")}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{comp.winner_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">🎁 {comp.prize_description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => viewWinnerDetails(comp)} className="gap-1 h-7 text-xs border-amber-300 dark:border-amber-700">
                        <Eye className="w-3 h-3" /> تفاصيل الفائز
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => viewEntries(comp)} className="gap-1 h-7 text-xs">
                        <Users className="w-3 h-3" /> المشاركات
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCompetition(comp.id)} className="text-destructive h-7 w-7">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AdminCompetitionTab;
