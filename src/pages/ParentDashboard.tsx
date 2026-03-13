import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users, LogOut, BookOpen, Video, ClipboardList, FileText, Trophy, Star,
  AlertTriangle, CheckCircle2, Clock, GraduationCap, RefreshCw, Bell
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SubjectProgress {
  subject: string;
  videosTotal: number;
  videosWatched: number;
  homeworkTotal: number;
  homeworkDone: number;
  examsTotal: number;
  examsDone: number;
  overallPercent: number;
}

interface StudentData {
  profile: {
    user_id: string;
    full_name: string;
    grade: string;
    is_subscribed: boolean;
    subscription_expires_at: string | null;
    student_phone: string;
    school: string | null;
    governorate: string | null;
    madhab: string | null;
  };
  subjectProgress: SubjectProgress[];
  pendingHomework: { title: string; subject: string; due_date: string | null }[];
  pendingExams: { title: string; subject: string }[];
  examResults: { title: string; subject: string; score: number; total: number; submitted_at: string }[];
  homeworkResults: { title: string; subject: string; score: number | null; submitted_at: string }[];
  rank: { rank: number; total_students: number; total_points: number };
  totalPoints: number;
  notifications: { title: string; body: string; created_at: string; is_read: boolean; type: string }[];
  parentMessages: { id: string; title: string; body: string; created_at: string; is_read: boolean }[];
}

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(0);

  const fetchData = async () => {
    const sessionStr = localStorage.getItem("parent_session");
    if (!sessionStr) {
      navigate("/parent/login");
      return;
    }

    const session = JSON.parse(sessionStr);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("parent-auth", {
        body: {
          action: "get_student_data",
          phone: session.phone,
          session_token: session.session_token,
        },
      });
      console.log("📦 Raw response from server:", JSON.stringify(data, null, 2));
      console.log("📦 Error from invoke:", error);

      if (error || data?.error) {
        toast({ title: "خطأ", description: data?.error || "فشل تحميل البيانات", variant: "destructive" });
        if (data?.error === "غير مصرح") {
          localStorage.removeItem("parent_session");
          navigate("/parent/login");
        }
        setLoading(false);
        return;
      }

      console.log("📦 data.students array:", JSON.stringify(data.students, null, 2));
      
      const safeStudents = (data.students || []).map((s: any) => {
        console.log("📦 Single student raw:", JSON.stringify(s, null, 2));
        return {
          profile: s.profile || {},
          subjectProgress: s.subjectProgress || [],
          pendingHomework: s.pendingHomework || [],
          pendingExams: s.pendingExams || [],
          examResults: s.examResults || [],
          homeworkResults: s.homeworkResults || [],
          rank: s.rank || { rank: 0, total_students: 0, total_points: 0 },
          totalPoints: s.totalPoints || 0,
          notifications: s.notifications || [],
          parentMessages: s.parentMessages || [],
        };
      });
      console.log("📦 Safe students:", JSON.stringify(safeStudents, null, 2));
      setStudents(safeStudents);
    } catch {
      toast({ title: "خطأ", description: "فشل الاتصال بالخادم", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    const sessionStr = localStorage.getItem("parent_session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.session_token) {
          await supabase.functions.invoke("parent-auth", {
            body: { action: "logout", session_token: session.session_token },
          });
        }
      } catch {}
    }
    localStorage.removeItem("parent_session");
    navigate("/parent/login");
  };

  const session = JSON.parse(localStorage.getItem("parent_session") || "{}");
  const student = students[selectedStudent] || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">جاري تحميل بيانات الطالب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sm">أهلاً {session.parent?.full_name || session.full_name || "ولي الأمر"}</h1>
              <p className="text-[11px] text-muted-foreground">لوحة متابعة الأبناء</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchData} title="تحديث البيانات">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="تسجيل الخروج">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {students.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">لا يوجد طلاب مرتبطين بحسابك</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Student selector if multiple */}
            {students.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {students.map((s, i) => (
                  <Button
                    key={s.profile?.user_id || i}
                    variant={selectedStudent === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStudent(i)}
                    className="whitespace-nowrap"
                  >
                    <GraduationCap className="w-4 h-4 ml-1" />
                    {s.profile?.full_name || "طالب"}
                  </Button>
                ))}
              </div>
            )}

            {student && (
              <>
                {/* Student Info Card */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-lg">{student.profile?.full_name || "طالب"}</h2>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded-full">{student.profile?.grade || ""}</span>
                          {student.profile?.school && <span className="bg-muted px-2 py-0.5 rounded-full">{student.profile.school}</span>}
                          {student.profile?.governorate && <span className="bg-muted px-2 py-0.5 rounded-full">{student.profile.governorate}</span>}
                          <span className={`px-2 py-0.5 rounded-full ${student.profile?.is_subscribed ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                            {student.profile?.is_subscribed ? "مشترك ✅" : "غير مشترك"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <StatCard icon={Trophy} label="الترتيب" value={`${student.rank.rank}/${student.rank.total_students}`} color="text-yellow-500" />
                  <StatCard icon={Star} label="النقاط" value={String(student.totalPoints)} color="text-primary" />
                  <StatCard icon={AlertTriangle} label="واجبات متأخرة" value={String(student.pendingHomework.length)} color="text-orange-500" />
                  <StatCard icon={FileText} label="امتحانات لم تُحل" value={String(student.pendingExams.length)} color="text-red-500" />
                </div>

                {/* Tabs */}
                <Tabs defaultValue="progress" className="space-y-4">
                  <TabsList className="w-full grid grid-cols-5 h-auto">
                    <TabsTrigger value="progress" className="text-xs py-2">📊 التقدم</TabsTrigger>
                    <TabsTrigger value="results" className="text-xs py-2">📝 النتائج</TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs py-2">⏳ المتأخر</TabsTrigger>
                    <TabsTrigger value="notifications" className="text-xs py-2">🔔 إشعارات</TabsTrigger>
                    <TabsTrigger value="parent_messages" className="text-xs py-2 relative">
                      ✉️ رسائل المعلم
                      {(student.parentMessages?.filter(m => !m.is_read).length || 0) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                          {student.parentMessages.filter(m => !m.is_read).length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Progress Tab */}
                  <TabsContent value="progress">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">تقدم المواد الدراسية</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {student.subjectProgress.length === 0 ? (
                          <p className="text-muted-foreground text-center py-6">لا توجد بيانات بعد</p>
                        ) : (
                          student.subjectProgress.map((sp) => (
                            <div key={sp.subject} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{sp.subject}</span>
                                <span className="text-sm font-bold text-primary">{sp.overallPercent}%</span>
                              </div>
                              <Progress value={sp.overallPercent} className="h-2.5" />
                              <div className="flex gap-4 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Video className="w-3 h-3" /> {sp.videosWatched}/{sp.videosTotal} فيديو
                                </span>
                                <span className="flex items-center gap-1">
                                  <ClipboardList className="w-3 h-3" /> {sp.homeworkDone}/{sp.homeworkTotal} واجب
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> {sp.examsDone}/{sp.examsTotal} امتحان
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Results Tab */}
                  <TabsContent value="results">
                    <div className="space-y-4">
                      {/* Exam Results */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="w-4 h-4" /> نتائج الامتحانات
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {student.examResults.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4 text-sm">لا توجد نتائج بعد</p>
                          ) : (
                            <div className="space-y-2">
                              {student.examResults.map((r, i) => (
                                <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                                  <div>
                                    <p className="text-sm font-medium">{r.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{r.subject} • {new Date(r.submitted_at).toLocaleDateString("ar-EG")}</p>
                                  </div>
                                  <span className={`text-sm font-bold ${r.total > 0 && (r.score / r.total) >= 0.8 ? "text-green-600" : r.total > 0 && (r.score / r.total) >= 0.5 ? "text-yellow-600" : "text-red-600"}`}>
                                    {r.score}/{r.total}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Homework Results */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" /> نتائج الواجبات
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {student.homeworkResults.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4 text-sm">لا توجد نتائج بعد</p>
                          ) : (
                            <div className="space-y-2">
                              {student.homeworkResults.map((r, i) => (
                                <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                                  <div>
                                    <p className="text-sm font-medium">{r.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{r.subject} • {new Date(r.submitted_at).toLocaleDateString("ar-EG")}</p>
                                  </div>
                                  {r.score !== null ? (
                                    <span className="text-sm font-bold text-primary">{r.score}/10</span>
                                  ) : (
                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">في انتظار التصحيح</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Pending Tab */}
                  <TabsContent value="pending">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" /> واجبات لم تُسلَّم
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {student.pendingHomework.length === 0 ? (
                            <div className="text-center py-6">
                              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">ممتاز! كل الواجبات مسلّمة ✅</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {student.pendingHomework.map((h, i) => (
                                <div key={i} className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3">
                                  <div>
                                    <p className="text-sm font-medium">{h.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{h.subject}</p>
                                  </div>
                                  {h.due_date && (
                                    <span className="text-[10px] text-orange-600">{new Date(h.due_date).toLocaleDateString("ar-EG")}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-500" /> امتحانات لم تُحل
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {student.pendingExams.length === 0 ? (
                            <div className="text-center py-6">
                              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">ممتاز! كل الامتحانات محلولة ✅</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {student.pendingExams.map((e, i) => (
                                <div key={i} className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3">
                                  <p className="text-sm font-medium">{e.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{e.subject}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Notifications Tab */}
                  <TabsContent value="notifications">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Bell className="w-4 h-4" /> آخر الإشعارات
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {student.notifications.length === 0 ? (
                          <p className="text-muted-foreground text-center py-6 text-sm">لا توجد إشعارات</p>
                        ) : (
                          <div className="space-y-2">
                            {student.notifications.map((n, i) => (
                              <div key={i} className={`rounded-lg p-3 ${n.is_read ? "bg-muted/30" : "bg-primary/5 border border-primary/20"}`}>
                                <p className="text-sm font-medium">{n.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString("ar-EG")}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Parent Messages Tab */}
                  <TabsContent value="parent_messages">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          ✉️ رسائل من المعلم
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(student.parentMessages || []).length === 0 ? (
                          <p className="text-muted-foreground text-center py-6 text-sm">لا توجد رسائل من المعلم</p>
                        ) : (
                          <div className="space-y-2">
                            {student.parentMessages.map((m, i) => (
                              <div key={m.id || i} className={`rounded-lg p-3 ${m.is_read ? "bg-muted/30" : "bg-primary/5 border border-primary/20"}`}>
                                <p className="text-sm font-medium">{m.title}</p>
                                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{m.body}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <Card>
    <CardContent className="pt-4 pb-3 px-3 text-center">
      <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default ParentDashboard;
