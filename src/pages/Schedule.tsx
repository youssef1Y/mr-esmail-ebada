import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, ChevronRight, ChevronLeft, Clock, FileText, ClipboardList, Video, BookOpen, CalendarDays, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isToday, isSameDay, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  type: "exam" | "homework" | "admin_event" | "video";
  subject?: string;
  color: string;
  icon: any;
}

const typeConfig = {
  exam: { color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800", icon: FileText, label: "امتحان" },
  homework: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800", icon: ClipboardList, label: "واجب" },
  admin_event: { color: "bg-primary/10 text-primary border-primary/20", icon: Star, label: "حدث" },
  video: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800", icon: Video, label: "فيديو جديد" },
};

const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const Schedule = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [grade, setGrade] = useState("");

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 }); // Saturday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 6 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("grade").eq("user_id", session.user.id).single();
      if (!profile) return;
      setGrade(profile.grade);

      setLoading(true);
      const allEvents: ScheduleEvent[] = [];

      // Fetch admin schedule events for this grade
      const { data: adminEvents } = await supabase
        .from("schedule_events")
        .select("*")
        .eq("grade", profile.grade)
        .gte("event_date", format(weekStart, "yyyy-MM-dd"))
        .lte("event_date", format(weekEnd, "yyyy-MM-dd"));

      (adminEvents || []).forEach(e => {
        const config = typeConfig[e.event_type as keyof typeof typeConfig] || typeConfig.admin_event;
        allEvents.push({
          id: e.id,
          title: e.title,
          description: e.description || undefined,
          date: parseISO(e.event_date),
          time: e.event_time || undefined,
          type: e.event_type as any,
          subject: e.subject || undefined,
          color: config.color,
          icon: config.icon,
        });
      });

      // Fetch homework with due dates this week
      const { data: homework } = await supabase
        .from("homework")
        .select("id, title, subject, due_date")
        .eq("grade", profile.grade)
        .not("due_date", "is", null);

      (homework || []).forEach(h => {
        if (!h.due_date) return;
        const dueDate = parseISO(h.due_date);
        if (dueDate >= weekStart && dueDate <= weekEnd) {
          allEvents.push({
            id: `hw_${h.id}`,
            title: h.title,
            date: dueDate,
            type: "homework",
            subject: h.subject,
            color: typeConfig.homework.color,
            icon: typeConfig.homework.icon,
          });
        }
      });

      // Fetch exams created this week
      const { data: exams } = await supabase
        .from("exams")
        .select("id, title, subject, created_at")
        .eq("grade", profile.grade)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      (exams || []).forEach(e => {
        allEvents.push({
          id: `exam_${e.id}`,
          title: e.title,
          date: parseISO(e.created_at),
          type: "exam",
          subject: e.subject,
          color: typeConfig.exam.color,
          icon: typeConfig.exam.icon,
        });
      });

      // Fetch new videos this week
      const { data: videos } = await supabase
        .from("videos")
        .select("id, title, subject, created_at")
        .eq("grade", profile.grade)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      (videos || []).forEach(v => {
        allEvents.push({
          id: `vid_${v.id}`,
          title: v.title,
          date: parseISO(v.created_at),
          type: "video",
          subject: v.subject,
          color: typeConfig.video.color,
          icon: typeConfig.video.icon,
        });
      });

      // Sort by date
      allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
      setEvents(allEvents);
      setLoading(false);
    };
    init();
  }, [navigate, currentWeek]);

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(e.date, day));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">الجدول الدراسي</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <h2 className="font-bold text-sm">
              {format(weekStart, "d MMMM", { locale: ar })} — {format(weekEnd, "d MMMM yyyy", { locale: ar })}
            </h2>
            <p className="text-[10px] text-muted-foreground">{grade}</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Today button */}
        <div className="flex justify-center mb-4">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentWeek(new Date())}>
            <Calendar className="w-3 h-3 ml-1" /> اليوم
          </Button>
        </div>

        {/* Week Grid */}
        <div className="space-y-2">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`rounded-xl border p-3 transition-all ${
                  today
                    ? "bg-primary/5 border-primary/30"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    today ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {format(day, "d")}
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${today ? "text-primary" : ""}`}>
                      {dayNames[day.getDay()]}
                    </span>
                    {today && <span className="text-[10px] text-primary mr-2">(اليوم)</span>}
                  </div>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full mr-auto">
                      {dayEvents.length} {dayEvents.length === 1 ? "حدث" : "أحداث"}
                    </span>
                  )}
                </div>

                {dayEvents.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground pr-10">لا توجد أحداث</p>
                ) : (
                  <div className="space-y-1.5 pr-10">
                    {dayEvents.map((event) => {
                      const Icon = event.icon;
                      return (
                        <div key={event.id} className={`flex items-start gap-2 rounded-lg border p-2 ${event.color}`}>
                          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{event.title}</p>
                            <div className="flex items-center gap-2 text-[10px] opacity-80">
                              {event.subject && <span>{event.subject}</span>}
                              {event.time && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" /> {event.time}
                                </span>
                              )}
                              <span>{typeConfig[event.type]?.label}</span>
                            </div>
                            {event.description && (
                              <p className="text-[10px] opacity-70 mt-0.5">{event.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {Object.entries(typeConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${config.color}`}>
                <Icon className="w-3 h-3" /> {config.label}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Schedule;
