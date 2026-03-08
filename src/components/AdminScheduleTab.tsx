import { useEffect, useState } from "react";
import { CalendarDays, Plus, Trash2, Clock, Repeat, RefreshCw, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, parseISO, isBefore, isEqual } from "date-fns";
import { ar } from "date-fns/locale";

const grades = [
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
];
const subjects = ["الفقه", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية", "النحو"];
const eventTypes = [
  { value: "exam", label: "امتحان" },
  { value: "homework", label: "واجب" },
  { value: "admin_event", label: "حدث عام" },
  { value: "video", label: "فيديو جديد" },
  { value: "class", label: "حصة" },
];

const dayOptions = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الاثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string;
  grade: string;
  subject: string | null;
  created_at: string;
}

const AdminScheduleTab = ({ toast }: { toast: any }) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [filterGrade, setFilterGrade] = useState(grades[0]);
  const [addingRecurring, setAddingRecurring] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    event_type: "exam",
    grade: grades[0],
    subject: "",
  });

  const [recurringEvent, setRecurringEvent] = useState({
    title: "",
    description: "",
    event_time: "",
    event_type: "class",
    grade: grades[0],
    subject: "",
    day_of_week: 0,
    start_date: "",
    end_date: "",
  });

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("schedule_events")
      .select("*")
      .eq("grade", filterGrade)
      .order("event_date", { ascending: true });
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [filterGrade]);

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.event_date || !newEvent.grade) {
      toast({ title: "خطأ", description: "أكمل العنوان والتاريخ والصف", variant: "destructive" });
      return;
    }

    const insertData: any = {
      title: newEvent.title,
      event_date: newEvent.event_date,
      event_type: newEvent.event_type,
      grade: newEvent.grade,
    };
    if (newEvent.description) insertData.description = newEvent.description;
    if (newEvent.event_time) insertData.event_time = newEvent.event_time;
    if (newEvent.subject) insertData.subject = newEvent.subject;

    const { error } = await supabase.from("schedule_events").insert(insertData);

    if (error) {
      toast({ title: "خطأ", description: "فشل الإضافة", variant: "destructive" });
    } else {
      toast({ title: "تم إضافة الحدث ✅" });
      setNewEvent({ title: "", description: "", event_date: "", event_time: "", event_type: "exam", grade: newEvent.grade, subject: "" });
      setShowAdd(false);
      fetchEvents();
    }
  };

  const addRecurringEvents = async () => {
    const { title, start_date, end_date, day_of_week, grade, event_type, event_time, subject, description } = recurringEvent;
    
    if (!title || !start_date || !end_date || !grade) {
      toast({ title: "خطأ", description: "أكمل العنوان وتاريخ البداية والنهاية والصف", variant: "destructive" });
      return;
    }

    const startD = parseISO(start_date);
    const endD = parseISO(end_date);

    if (isBefore(endD, startD)) {
      toast({ title: "خطأ", description: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية", variant: "destructive" });
      return;
    }

    // Generate all dates for the chosen day of week between start and end
    const dates: string[] = [];
    let current = startD;
    
    // Find the first occurrence of the chosen day
    while (current.getDay() !== day_of_week) {
      current = addDays(current, 1);
    }

    while (isBefore(current, endD) || isEqual(current, endD)) {
      dates.push(format(current, "yyyy-MM-dd"));
      current = addDays(current, 7); // next week same day
    }

    if (dates.length === 0) {
      toast({ title: "خطأ", description: "لا يوجد أيام تطابق الاختيار في هذه الفترة", variant: "destructive" });
      return;
    }

    setAddingRecurring(true);

    const rows = dates.map(d => {
      const row: any = {
        title,
        event_date: d,
        event_type,
        grade,
      };
      if (description) row.description = description;
      if (event_time) row.event_time = event_time;
      if (subject) row.subject = subject;
      return row;
    });

    const { error } = await supabase.from("schedule_events").insert(rows);
    setAddingRecurring(false);

    if (error) {
      toast({ title: "خطأ", description: "فشل إضافة الأحداث المتكررة", variant: "destructive" });
    } else {
      toast({ title: `تم إضافة ${dates.length} حدث متكرر ✅`, description: `كل ${dayOptions.find(d => d.value === day_of_week)?.label} من ${start_date} إلى ${end_date}` });
      setRecurringEvent({ title: "", description: "", event_time: "", event_type: "class", grade: recurringEvent.grade, subject: "", day_of_week: 0, start_date: "", end_date: "" });
      setShowRecurring(false);
      fetchEvents();
    }
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("schedule_events").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    } else {
      toast({ title: "تم حذف الحدث" });
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const deleteSimilarEvents = async (event: ScheduleEvent) => {
    let query = supabase.from("schedule_events").delete()
      .eq("title", event.title)
      .eq("event_type", event.event_type)
      .eq("grade", event.grade);
    
    if (event.event_time) {
      query = query.eq("event_time", event.event_time);
    }
    if (event.subject) {
      query = query.eq("subject", event.subject);
    }

    const { error } = await query;
    if (error) {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    } else {
      const remaining = events.filter(e => 
        !(e.title === event.title && e.event_type === event.event_type && e.grade === event.grade && e.event_time === event.event_time && e.subject === event.subject)
      );
      setEvents(remaining);
      const deletedCount = events.length - remaining.length;
      toast({ title: `تم حذف ${deletedCount} حدث متشابه ✅` });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> الجدول الدراسي
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowRecurring(!showRecurring); setShowAdd(false); }} className="gap-1">
            <Repeat className="w-3 h-3" /> حدث متكرر
          </Button>
          <Button size="sm" onClick={() => { setShowAdd(!showAdd); setShowRecurring(false); }} className="gap-1">
            <Plus className="w-3 h-3" /> حدث واحد
          </Button>
        </div>
      </div>

      {/* Grade filter */}
      <div className="flex gap-2 flex-wrap">
        {grades.map(g => (
          <Button
            key={g}
            variant={filterGrade === g ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterGrade(g)}
            className="text-xs"
          >
            {g.replace("الصف ", "")}
          </Button>
        ))}
      </div>

      {/* Single event form */}
      {showAdd && (
        <div className="bg-muted rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> إضافة حدث واحد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">العنوان *</Label>
              <Input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="مثل: امتحان الفقه الشهري" />
            </div>
            <div>
              <Label className="text-xs">النوع</Label>
              <select value={newEvent.event_type} onChange={e => setNewEvent({ ...newEvent, event_type: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">التاريخ *</Label>
              <Input type="date" value={newEvent.event_date} onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">الوقت (اختياري)</Label>
              <Input type="time" value={newEvent.event_time} onChange={e => setNewEvent({ ...newEvent, event_time: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">الصف *</Label>
              <select value={newEvent.grade} onChange={e => setNewEvent({ ...newEvent, grade: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">المادة (اختياري)</Label>
              <select value={newEvent.subject} onChange={e => setNewEvent({ ...newEvent, subject: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">بدون مادة</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs">ملاحظات (اختياري)</Label>
            <textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="تفاصيل إضافية..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            <Button onClick={addEvent} size="sm" className="flex-1">إضافة الحدث</Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>إلغاء</Button>
          </div>
        </div>
      )}

      {/* Recurring event form */}
      {showRecurring && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-1 text-primary"><Repeat className="w-4 h-4" /> إضافة حدث متكرر أسبوعياً</h3>
          <p className="text-[11px] text-muted-foreground">سيتم إنشاء الحدث تلقائياً في كل يوم تختاره من تاريخ البداية لتاريخ النهاية</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">العنوان *</Label>
              <Input value={recurringEvent.title} onChange={e => setRecurringEvent({ ...recurringEvent, title: e.target.value })} placeholder="مثل: حصة الفقه" />
            </div>
            <div>
              <Label className="text-xs">النوع</Label>
              <select value={recurringEvent.event_type} onChange={e => setRecurringEvent({ ...recurringEvent, event_type: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">اليوم من الأسبوع *</Label>
              <select value={recurringEvent.day_of_week} onChange={e => setRecurringEvent({ ...recurringEvent, day_of_week: parseInt(e.target.value) })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">الوقت (اختياري)</Label>
              <Input type="time" value={recurringEvent.event_time} onChange={e => setRecurringEvent({ ...recurringEvent, event_time: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">من تاريخ *</Label>
              <Input type="date" value={recurringEvent.start_date} onChange={e => setRecurringEvent({ ...recurringEvent, start_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">إلى تاريخ *</Label>
              <Input type="date" value={recurringEvent.end_date} onChange={e => setRecurringEvent({ ...recurringEvent, end_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">الصف *</Label>
              <select value={recurringEvent.grade} onChange={e => setRecurringEvent({ ...recurringEvent, grade: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">المادة (اختياري)</Label>
              <select value={recurringEvent.subject} onChange={e => setRecurringEvent({ ...recurringEvent, subject: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">بدون مادة</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs">ملاحظات (اختياري)</Label>
            <textarea value={recurringEvent.description} onChange={e => setRecurringEvent({ ...recurringEvent, description: e.target.value })} placeholder="تفاصيل إضافية..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {recurringEvent.start_date && recurringEvent.end_date && !isBefore(parseISO(recurringEvent.end_date), parseISO(recurringEvent.start_date)) && (
            <div className="bg-background rounded-lg p-2 text-xs text-muted-foreground text-center">
              سيتم إنشاء حدث كل <span className="font-bold text-foreground">{dayOptions.find(d => d.value === recurringEvent.day_of_week)?.label}</span> من <span className="font-bold text-foreground">{recurringEvent.start_date}</span> إلى <span className="font-bold text-foreground">{recurringEvent.end_date}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={addRecurringEvents} size="sm" className="flex-1 gap-1" disabled={addingRecurring}>
              {addingRecurring ? <><RefreshCw className="w-3 h-3 animate-spin" /> جاري الإضافة...</> : <><Repeat className="w-3 h-3" /> إضافة الأحداث المتكررة</>}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowRecurring(false)}>إلغاء</Button>
          </div>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">لا توجد أحداث مجدولة لهذا الصف</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(event => (
            <div key={event.id} className="bg-card rounded-xl border border-border p-3 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-center">
                <div>
                  <span className="text-xs font-bold text-primary block leading-tight">
                    {format(new Date(event.event_date), "d")}
                  </span>
                  <span className="text-[8px] text-muted-foreground leading-tight">
                    {format(new Date(event.event_date), "MMM", { locale: ar })}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{event.title}</h3>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                    {eventTypes.find(t => t.value === event.event_type)?.label || event.event_type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  {event.subject && <span>{event.subject}</span>}
                  {event.event_time && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {event.event_time}
                    </span>
                  )}
                  <span>{event.grade.replace("الصف ", "")}</span>
                </div>
                {event.description && (
                  <p className="text-[11px] text-muted-foreground mt-1">{event.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteEvent(event.id)} title="حذف هذا الحدث فقط">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => deleteSimilarEvents(event)} title="حذف كل المتشابهة">
                  <Trash className="w-3.5 h-3.5" />
                </Button>
              </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminScheduleTab;
