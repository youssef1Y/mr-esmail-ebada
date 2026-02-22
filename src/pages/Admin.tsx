import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, BookOpen, Bell, Video, Users, LogOut, ChevronRight, Search, RefreshCw, Trash2, UserCheck, UserX, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const grades = [
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
];
const subjects = ["الفقه", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية"];

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  grade: string;
  school: string | null;
  governorate: string | null;
  madhab: string | null;
  student_phone: string;
  parent_phone: string | null;
  is_subscribed: boolean;
  created_at: string;
}

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  grade: string;
  subject: string;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  target_audience: string;
  target_grades: string[];
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<"subscribers" | "videos" | "notifications">("subscribers");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Subscribers state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSubscription, setFilterSubscription] = useState("");

  // Videos state
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videoGrade, setVideoGrade] = useState("");
  const [videoSubject, setVideoSubject] = useState("");
  const [newVideo, setNewVideo] = useState({ title: "", description: "", video_url: "", grade: "", subject: "" });
  const [showAddVideo, setShowAddVideo] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotif, setNewNotif] = useState({ title: "", body: "", target_audience: "all", target_grades: [] as string[] });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/admin/login"); return; }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      navigate("/admin/login");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
    fetchProfiles();
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data);
  };

  const fetchVideos = async () => {
    let query = supabase.from("videos").select("*").order("created_at", { ascending: false });
    if (videoGrade) query = query.eq("grade", videoGrade);
    if (videoSubject) query = query.eq("subject", videoSubject);
    const { data } = await query;
    if (data) setVideos(data);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (data) setNotifications(data);
  };

  useEffect(() => {
    if (tab === "videos") fetchVideos();
    if (tab === "notifications") fetchNotifications();
  }, [tab, videoGrade, videoSubject]);

  const toggleSubscription = async (profile: Profile) => {
    const newPrice = profile.grade.includes("إعدادي") ? 150 : 200;
    await supabase.from("profiles").update({
      is_subscribed: !profile.is_subscribed,
      subscription_price: profile.is_subscribed ? 0 : newPrice,
    }).eq("id", profile.id);
    fetchProfiles();
    toast({ title: profile.is_subscribed ? "تم إلغاء الاشتراك" : "تم تفعيل الاشتراك" });
  };

  const deleteProfile = async (id: string, userId: string) => {
    await supabase.from("profiles").delete().eq("id", id);
    fetchProfiles();
    toast({ title: "تم حذف الطالب" });
  };

  const addVideo = async () => {
    if (!newVideo.title || !newVideo.video_url || !newVideo.grade || !newVideo.subject) {
      toast({ title: "خطأ", description: "أكمل جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("videos").insert(newVideo);
    if (error) {
      console.error("Insert video error:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة الفيديو", variant: "destructive" });
    } else {
      toast({ title: "تم إضافة الفيديو" });
      setNewVideo({ title: "", description: "", video_url: "", grade: "", subject: "" });
      setShowAddVideo(false);
      fetchVideos();
    }
  };

  const deleteVideo = async (id: string) => {
    await supabase.from("videos").delete().eq("id", id);
    fetchVideos();
    toast({ title: "تم حذف الفيديو" });
  };

  const sendNotification = async () => {
    if (!newNotif.title || !newNotif.body) {
      toast({ title: "خطأ", description: "أدخل عنوان ونص الإشعار", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("notifications").insert({
      title: newNotif.title,
      body: newNotif.body,
      target_audience: newNotif.target_grades.length > 0 ? "specific" : "all",
      target_grades: newNotif.target_grades,
    });
    if (error) {
      console.error("Insert notification error:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إرسال الإشعار", variant: "destructive" });
    } else {
      toast({ title: "تم إرسال الإشعار" });
      setNewNotif({ title: "", body: "", target_audience: "all", target_grades: [] });
      fetchNotifications();
    }
  };

  const toggleGradeTarget = (grade: string) => {
    setNewNotif(prev => ({
      ...prev,
      target_grades: prev.target_grades.includes(grade)
        ? prev.target_grades.filter(g => g !== grade)
        : [...prev.target_grades, grade],
    }));
  };

  const filteredProfiles = profiles.filter(p => {
    if (searchQuery && !p.full_name.includes(searchQuery) && !p.student_phone.includes(searchQuery)) return false;
    if (filterGrade && p.grade !== filterGrade) return false;
    if (filterSubscription === "subscribed" && !p.is_subscribed) return false;
    if (filterSubscription === "unsubscribed" && p.is_subscribed) return false;
    return true;
  });

  const totalStudents = profiles.length;
  const subscribedCount = profiles.filter(p => p.is_subscribed).length;
  const unsubscribedCount = profiles.filter(p => !p.is_subscribed).length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sm">لوحة تحكم الأدمن</h1>
                <p className="text-xs text-muted-foreground">إدارة الفيديوهات والمشتركين</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="gap-1">
                  العودة للمنصة
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
                خروج
                <LogOut className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 justify-center">
          {[
            { key: "notifications" as const, label: "الإشعارات", icon: Bell },
            { key: "videos" as const, label: "الفيديوهات", icon: Video },
            { key: "subscribers" as const, label: "المشتركين", icon: Users },
          ].map(t => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.key)}
              className="gap-1"
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </Button>
          ))}
        </div>

        {/* Notifications Tab */}
        {tab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-bold font-amiri mb-4 flex items-center gap-2">
                <Send className="w-5 h-5" />
                إرسال إشعار جديد
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>عنوان الإشعار</Label>
                  <Input value={newNotif.title} onChange={e => setNewNotif({ ...newNotif, title: e.target.value })} placeholder="أدخل عنوان الإشعار" />
                </div>
                <div>
                  <Label>نص الإشعار</Label>
                  <textarea
                    value={newNotif.body}
                    onChange={e => setNewNotif({ ...newNotif, body: e.target.value })}
                    placeholder="اكتب محتوى الإشعار..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <Label>الفئة المستهدفة</Label>
                  <select
                    value={newNotif.target_grades.length > 0 ? "specific" : "all"}
                    onChange={e => {
                      if (e.target.value === "all") setNewNotif({ ...newNotif, target_grades: [] });
                    }}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">جميع الطلاب</option>
                    <option value="specific">صفوف محددة</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">الصفوف المستهدفة (اتركها فارغة لإرسال لجميع الصفوف)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {grades.map(g => (
                      <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newNotif.target_grades.includes(g)}
                          onChange={() => toggleGradeTarget(g)}
                          className="rounded"
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="bg-muted rounded-xl p-3 text-sm">
                  <p className="font-medium">معاينة الإشعار:</p>
                  <p className="text-muted-foreground">
                    سيتم إرسال الإشعار إلى <strong>
                      {newNotif.target_grades.length > 0
                        ? newNotif.target_grades.join("، ")
                        : "جميع الطلاب في جميع الصفوف"}
                    </strong>
                  </p>
                </div>
                <Button onClick={sendNotification} className="w-full gap-2">
                  <Send className="w-4 h-4" />
                  إرسال الإشعار
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-amiri">الإشعارات المرسلة</h2>
              <Button variant="outline" size="sm" onClick={fetchNotifications} className="gap-1">
                <RefreshCw className="w-3 h-3" />
                تحديث
              </Button>
            </div>
            {notifications.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">لم يتم إرسال أي إشعارات بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="bg-card rounded-xl border border-border p-4">
                    <h3 className="font-bold text-sm">{n.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {n.target_grades.length > 0 ? n.target_grades.join("، ") : "جميع الطلاب"} · {new Date(n.created_at).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Videos Tab */}
        {tab === "videos" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-amiri">إدارة الفيديوهات</h2>
                <p className="text-xs text-muted-foreground">أضف وأدر الفيديوهات التعليمية لكل مرحلة ومادة</p>
              </div>
              <Button onClick={() => setShowAddVideo(!showAddVideo)} className="gap-1">
                <Plus className="w-4 h-4" />
                إضافة فيديو
              </Button>
            </div>

            {showAddVideo && (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-bold">إضافة فيديو جديد</h3>
                <div>
                  <Label>عنوان الفيديو</Label>
                  <Input value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} placeholder="عنوان الفيديو" />
                </div>
                <div>
                  <Label>وصف الفيديو</Label>
                  <Input value={newVideo.description} onChange={e => setNewVideo({ ...newVideo, description: e.target.value })} placeholder="وصف مختصر (اختياري)" />
                </div>
                <div>
                  <Label>رابط الفيديو</Label>
                  <Input value={newVideo.video_url} onChange={e => setNewVideo({ ...newVideo, video_url: e.target.value })} placeholder="رابط YouTube أو رابط مباشر" dir="ltr" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>المرحلة الدراسية</Label>
                    <select value={newVideo.grade} onChange={e => setNewVideo({ ...newVideo, grade: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="">اختر المرحلة</option>
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>المادة</Label>
                    <select value={newVideo.subject} onChange={e => setNewVideo({ ...newVideo, subject: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="">اختر المادة</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addVideo} className="flex-1">حفظ الفيديو</Button>
                  <Button variant="outline" onClick={() => setShowAddVideo(false)}>إلغاء</Button>
                </div>
              </div>
            )}

            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div>
                <Label>المرحلة الدراسية</Label>
                <select value={videoGrade} onChange={e => setVideoGrade(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر المرحلة</option>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <Label>المادة</Label>
                <select value={videoSubject} onChange={e => setVideoSubject(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">اختر المادة</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {!videoGrade && !videoSubject ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-bold font-amiri mb-1">اختر المرحلة والمادة لعرض الفيديوهات</h3>
                <p className="text-xs text-muted-foreground">استخدم القوائم أعلاه لتصفية الفيديوهات حسب المرحلة الدراسية والمادة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {videos.length === 0 ? (
                  <div className="bg-card rounded-xl border border-border p-6 text-center">
                    <p className="text-muted-foreground text-sm">لا توجد فيديوهات لهذه المرحلة والمادة</p>
                  </div>
                ) : videos.map(v => (
                  <div key={v.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm">{v.title}</h3>
                        {v.description && <p className="text-xs text-muted-foreground mt-1">{v.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{v.grade} · {v.subject}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteVideo(v.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscribers Tab */}
        {tab === "subscribers" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="space-y-3">
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <div><span className="text-2xl font-bold">{totalStudents}</span><p className="text-xs text-muted-foreground">إجمالي الطلاب</p></div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-primary" />
                <div><span className="text-2xl font-bold">{subscribedCount}</span><p className="text-xs text-muted-foreground">مشترك</p></div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                <UserX className="w-6 h-6 text-destructive" />
                <div><span className="text-2xl font-bold">{unsubscribedCount}</span><p className="text-xs text-muted-foreground">غير مشترك</p></div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div>
                <Label className="text-xs">بحث</Label>
                <div className="relative">
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="اسم الطالب أو رقم الموبايل..." className="pr-10" />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label className="text-xs">المرحلة</Label>
                <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">الكل</option>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">حالة الاشتراك</Label>
                <select value={filterSubscription} onChange={e => setFilterSubscription(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">الكل</option>
                  <option value="subscribed">مشترك</option>
                  <option value="unsubscribed">غير مشترك</option>
                </select>
              </div>
              <Button variant="default" size="sm" onClick={fetchProfiles} className="gap-1">
                <RefreshCw className="w-3 h-3" />
                تحديث
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">عرض {filteredProfiles.length} من {totalStudents} طالب</p>

            {/* Student Cards */}
            <div className="space-y-3">
              {filteredProfiles.map(p => (
                <div key={p.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-sm">{p.full_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.is_subscribed ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {p.is_subscribed ? "مشترك" : "غير مشترك"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>{p.grade}</p>
                    {p.school && <p>{p.school} - {p.governorate}</p>}
                    {p.madhab && <p>{p.madhab}</p>}
                    <p>موبايل الطالب: {p.student_phone}</p>
                    {p.parent_phone && <p>موبايل ولي الأمر: {p.parent_phone}</p>}
                    <p>تاريخ التسجيل: {new Date(p.created_at).toLocaleDateString("ar-EG")}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => deleteProfile(p.id, p.user_id)} className="gap-1 text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant={p.is_subscribed ? "outline" : "default"} onClick={() => toggleSubscription(p)} className="gap-1 flex-1">
                      {p.is_subscribed ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                      {p.is_subscribed ? "إلغاء الاشتراك" : "تفعيل الاشتراك"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
