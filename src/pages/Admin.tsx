import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, BookOpen, Bell, Video, Users, LogOut, ChevronRight, Search, RefreshCw, Trash2, UserCheck, UserX, Plus, Send, FileText, ClipboardList, Eye, Star, MessageSquare, MessageCircle, BarChart3, Newspaper } from "lucide-react";
import AdminVideoHomeworkTab from "@/components/AdminVideoHomeworkTab";
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

interface HomeworkSubmissionWithDetails {
  id: string;
  homework_id: string;
  user_id: string;
  content: string | null;
  image_urls: string[];
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  homework_title: string;
  homework_subject: string;
  homework_grade: string;
  student_name: string;
  student_phone: string;
  parent_phone: string | null;
  student_grade: string;
  student_school: string | null;
  student_governorate: string | null;
  student_madhab: string | null;
}

interface ExamAttemptWithDetails {
  id: string;
  exam_id: string;
  user_id: string;
  score: number | null;
  total: number | null;
  submitted_at: string;
  exam_title: string;
  exam_subject: string;
  exam_grade: string;
  student_name: string;
  student_phone: string;
  parent_phone: string | null;
  student_grade: string;
  student_school: string | null;
  student_governorate: string | null;
  student_madhab: string | null;
}

// Admin News Tab Component
const AdminNewsTab = ({ toast }: { toast: any }) => {
  const [newsList, setNewsList] = useState<{ id: string; title: string; body: string; icon: string; created_at: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", body: "", icon: "📢" });
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    if (data) setNewsList(data);
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  const addNews = async () => {
    if (!newItem.title || !newItem.body) {
      toast({ title: "خطأ", description: "أكمل العنوان والمحتوى", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("news").insert({
      title: newItem.title,
      body: newItem.body,
      icon: newItem.icon || "📢",
    });
    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الإضافة", variant: "destructive" });
    } else {
      toast({ title: "تم إضافة الخبر" });
      setNewItem({ title: "", body: "", icon: "📢" });
      setShowAdd(false);
      fetchNews();
    }
  };

  const deleteNews = async (id: string) => {
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    else { toast({ title: "تم حذف الخبر" }); fetchNews(); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-amiri flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            إدارة أخبار المنصة
          </h2>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-1">
            <Plus className="w-3 h-3" /> إضافة خبر
          </Button>
        </div>

        {showAdd && (
          <div className="bg-muted rounded-xl p-4 space-y-3 mb-4">
            <div className="flex gap-2">
              <Input
                value={newItem.icon}
                onChange={e => setNewItem({ ...newItem, icon: e.target.value })}
                placeholder="أيقونة (emoji)"
                className="w-20"
              />
              <Input
                value={newItem.title}
                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="عنوان الخبر"
                className="flex-1"
              />
            </div>
            <textarea
              value={newItem.body}
              onChange={e => setNewItem({ ...newItem, body: e.target.value })}
              placeholder="تفاصيل الخبر..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button onClick={addNews} size="sm" className="flex-1">نشر الخبر</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>إلغاء</Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-6">جاري التحميل...</p>
        ) : newsList.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-6">لا توجد أخبار</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {newsList.map(item => (
              <div key={item.id} className="bg-background rounded-xl border border-border p-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(item.created_at).toLocaleDateString("ar-EG")}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteNews(item.id)} className="text-destructive h-7 w-7 shrink-0">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<"subscribers" | "videos" | "notifications" | "homework" | "video_homework" | "exams" | "messages" | "requests" | "reports" | "news">("subscribers");
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
  const [newVideo, setNewVideo] = useState({ title: "", description: "", video_url: "", grade: "", subject: "", madhab: "" });
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoHomeworkEnabled, setVideoHomeworkEnabled] = useState(false);
  const [videoHomeworkDesc, setVideoHomeworkDesc] = useState("");
  const [videoHomeworkQuestions, setVideoHomeworkQuestions] = useState<{ question: string; options: string[]; correct: number }[]>([]);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotif, setNewNotif] = useState({ title: "", body: "", target_audience: "all", target_grades: [] as string[] });

  // Homework submissions state
  const [hwSubmissions, setHwSubmissions] = useState<HomeworkSubmissionWithDetails[]>([]);
  const [hwFilterGrade, setHwFilterGrade] = useState("");
  const [hwSearchQuery, setHwSearchQuery] = useState("");
  const [hwLoadingData, setHwLoadingData] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<string | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editFeedback, setEditFeedback] = useState("");
  const [viewingImages, setViewingImages] = useState<string[] | null>(null);

  // Exams state
  const [examAttempts, setExamAttempts] = useState<ExamAttemptWithDetails[]>([]);
  const [examFilterGrade, setExamFilterGrade] = useState("");
  const [examSearchQuery, setExamSearchQuery] = useState("");
  const [examLoadingData, setExamLoadingData] = useState(false);

  // Messages state
  const [msgConversations, setMsgConversations] = useState<{ user_id: string; student_name: string; student_grade: string; last_message: string; last_time: string; unread_count: number }[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [convoMessages, setConvoMessages] = useState<any[]>([]);
  const [adminReply, setAdminReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [selectedConvoName, setSelectedConvoName] = useState("");
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // Subscription requests state
  const [subRequests, setSubRequests] = useState<any[]>([]);
  const [subRequestsLoading, setSubRequestsLoading] = useState(false);

  // Weekly report state
  const [reportSending, setReportSending] = useState(false);
  const [reportAdminPhone, setReportAdminPhone] = useState("01097602493");
  const [reportSendToParents, setReportSendToParents] = useState(true);

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
    // Fetch unread message count
    const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("is_admin_reply", false).eq("is_read", false);
    setUnreadMsgCount(count || 0);
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

  const fetchHomeworkSubmissions = async () => {
    setHwLoadingData(true);
    // Fetch submissions
    const { data: subs } = await supabase.from("homework_submissions").select("*").order("submitted_at", { ascending: false });
    if (!subs) { setHwLoadingData(false); return; }

    // Fetch related homework and profiles
    const hwIds = [...new Set(subs.map(s => s.homework_id))];
    const userIds = [...new Set(subs.map(s => s.user_id))];

    const [hwResult, profilesResult] = await Promise.all([
      hwIds.length > 0 ? supabase.from("homework").select("*").in("id", hwIds) : { data: [] },
      userIds.length > 0 ? supabase.from("profiles").select("*").in("user_id", userIds) : { data: [] },
    ]);

    const hwMap = new Map((hwResult.data || []).map(h => [h.id, h]));
    const profileMap = new Map((profilesResult.data || []).map(p => [p.user_id, p]));

    const enriched: HomeworkSubmissionWithDetails[] = subs.map(s => {
      const hw = hwMap.get(s.homework_id);
      const profile = profileMap.get(s.user_id);
      return {
        ...s,
        image_urls: s.image_urls || [],
        homework_title: hw?.title || "غير معروف",
        homework_subject: hw?.subject || "",
        homework_grade: hw?.grade || "",
        student_name: profile?.full_name || "غير معروف",
        student_phone: profile?.student_phone || "",
        parent_phone: profile?.parent_phone || null,
        student_grade: profile?.grade || "",
        student_school: profile?.school || null,
        student_governorate: profile?.governorate || null,
        student_madhab: profile?.madhab || null,
      };
    });

    setHwSubmissions(enriched);
    setHwLoadingData(false);
  };

  const fetchExamAttempts = async () => {
    setExamLoadingData(true);
    const { data: attempts } = await supabase.from("exam_attempts").select("*").order("submitted_at", { ascending: false });
    if (!attempts) { setExamLoadingData(false); return; }

    const examIds = [...new Set(attempts.map(a => a.exam_id))];
    const userIds = [...new Set(attempts.map(a => a.user_id))];

    const [examsResult, profilesResult] = await Promise.all([
      examIds.length > 0 ? supabase.from("exams").select("*").in("id", examIds) : { data: [] },
      userIds.length > 0 ? supabase.from("profiles").select("*").in("user_id", userIds) : { data: [] },
    ]);

    const examMap = new Map((examsResult.data || []).map(e => [e.id, e]));
    const profileMap = new Map((profilesResult.data || []).map(p => [p.user_id, p]));

    const enriched: ExamAttemptWithDetails[] = attempts.map(a => {
      const exam = examMap.get(a.exam_id);
      const profile = profileMap.get(a.user_id);
      return {
        ...a,
        exam_title: exam?.title || "غير معروف",
        exam_subject: exam?.subject || "",
        exam_grade: exam?.grade || "",
        student_name: profile?.full_name || "غير معروف",
        student_phone: profile?.student_phone || "",
        parent_phone: profile?.parent_phone || null,
        student_grade: profile?.grade || "",
        student_school: profile?.school || null,
        student_governorate: profile?.governorate || null,
        student_madhab: profile?.madhab || null,
      };
    });

    setExamAttempts(enriched);
    setExamLoadingData(false);
  };

  const fetchMessages = async () => {
    setMsgLoading(true);
    const { data: allMessages } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    if (!allMessages) { setMsgLoading(false); return; }

    const userIds = [...new Set(allMessages.map(m => m.user_id))];
    const { data: profilesData } = userIds.length > 0 
      ? await supabase.from("profiles").select("user_id, full_name, grade").in("user_id", userIds) 
      : { data: [] };
    const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));

    const convos: typeof msgConversations = [];
    const grouped: Record<string, any[]> = {};
    allMessages.forEach(m => {
      if (!grouped[m.user_id]) grouped[m.user_id] = [];
      grouped[m.user_id].push(m);
    });

    Object.entries(grouped).forEach(([uid, msgs]) => {
      const profile = profileMap.get(uid);
      const sortedMsgs = msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const unread = msgs.filter(m => !m.is_admin_reply && !m.is_read).length;
      convos.push({
        user_id: uid,
        student_name: profile?.full_name || "غير معروف",
        student_grade: profile?.grade || "",
        last_message: sortedMsgs[0]?.content || "",
        last_time: sortedMsgs[0]?.created_at || "",
        unread_count: unread,
      });
    });

    convos.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
    setMsgConversations(convos);
    setMsgLoading(false);
    // Update unread count
    const totalUnread = convos.reduce((sum, c) => sum + c.unread_count, 0);
    setUnreadMsgCount(totalUnread);
  };

  const openConversation = async (userId: string, name: string) => {
    setSelectedConvo(userId);
    setSelectedConvoName(name);
    const { data } = await supabase.from("messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    if (data) setConvoMessages(data);
    // Mark student messages as read
    await supabase.from("messages").update({ is_read: true }).eq("user_id", userId).eq("is_admin_reply", false);
  };

  const sendAdminReply = async () => {
    if (!adminReply.trim() || !selectedConvo) return;
    setSendingReply(true);
    await supabase.from("messages").insert({
      user_id: selectedConvo,
      content: adminReply.trim(),
      is_admin_reply: true,
    });
    setAdminReply("");
    const { data } = await supabase.from("messages").select("*").eq("user_id", selectedConvo).order("created_at", { ascending: true });
    if (data) setConvoMessages(data);
    setSendingReply(false);
    fetchMessages();
  };

  useEffect(() => {
    if (tab === "videos") fetchVideos();
    if (tab === "notifications") fetchNotifications();
    if (tab === "homework") fetchHomeworkSubmissions();
    if (tab === "exams") fetchExamAttempts();
    if (tab === "messages") fetchMessages();
    if (tab === "requests") fetchSubRequests();
  }, [tab, videoGrade, videoSubject]);

  const fetchSubRequests = async () => {
    setSubRequestsLoading(true);
    const { data: requests } = await supabase
      .from("subscription_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (requests && requests.length > 0) {
      const userIds = [...new Set(requests.map((r: any) => r.user_id))];
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, grade, student_phone").in("user_id", userIds);
      const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      
      // Generate signed URLs for receipts
      const enriched = await Promise.all(requests.map(async (r: any) => {
        let signedReceiptUrl = "";
        if (r.receipt_url) {
          const { data: signedData } = await supabase.storage.from("receipts").createSignedUrl(r.receipt_url, 3600);
          if (signedData?.signedUrl) signedReceiptUrl = signedData.signedUrl;
        }
        return {
          ...r,
          signed_receipt_url: signedReceiptUrl,
          student_name: profMap.get(r.user_id)?.full_name || "غير معروف",
          student_grade: profMap.get(r.user_id)?.grade || "",
          student_phone: profMap.get(r.user_id)?.student_phone || "",
        };
      }));
      setSubRequests(enriched);
    } else {
      setSubRequests([]);
    }
    setSubRequestsLoading(false);
  };

  const handleApproveRequest = async (request: any) => {
    // Update request status
    await supabase.from("subscription_requests").update({ status: "approved" }).eq("id", request.id);
    // Activate subscription
    const newPrice = request.student_grade.includes("إعدادي") ? 150 : 200;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("profiles").update({
      is_subscribed: true,
      subscription_price: newPrice,
      subscription_expires_at: expiresAt,
    }).eq("user_id", request.user_id);
    // Send notification to student
    await supabase.from("student_notifications").insert({
      user_id: request.user_id,
      title: "تم تفعيل اشتراكك! 🎉",
      body: "تم تفعيل اشتراكك بنجاح. يمكنك الآن الوصول لجميع المحتوى التعليمي. الاشتراك صالح لمدة 30 يوم.",
      type: "subscription_approved",
    });
    toast({ title: "تم تفعيل الاشتراك وإشعار الطالب" });
    fetchSubRequests();
    fetchProfiles();
  };

  const handleRejectRequest = async (request: any) => {
    await supabase.from("subscription_requests").update({ status: "rejected" }).eq("id", request.id);
    // Send notification to student
    await supabase.from("student_notifications").insert({
      user_id: request.user_id,
      title: "تم رفض طلب الاشتراك",
      body: "تم رفض طلب اشتراكك. يرجى التأكد من بيانات التحويل وإعادة المحاولة أو التواصل مع الإدارة.",
      type: "subscription_rejected",
    });
    toast({ title: "تم رفض الطلب وإشعار الطالب" });
    fetchSubRequests();
  };

  const toggleSubscription = async (profile: Profile) => {
    const newPrice = profile.grade.includes("إعدادي") ? 150 : 200;
    const isActivating = !profile.is_subscribed;
    const expiresAt = isActivating
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    await supabase.from("profiles").update({
      is_subscribed: isActivating,
      subscription_price: isActivating ? newPrice : 0,
      subscription_expires_at: expiresAt,
    }).eq("id", profile.id);
    // Send notification to student
    await supabase.from("student_notifications").insert({
      user_id: profile.user_id,
      title: isActivating ? "تم تفعيل اشتراكك! 🎉" : "تم إلغاء اشتراكك",
      body: isActivating
        ? "تم تفعيل اشتراكك بنجاح. يمكنك الآن الوصول لجميع المحتوى التعليمي. الاشتراك صالح لمدة 30 يوم."
        : "تم إلغاء اشتراكك في المنصة.",
      type: isActivating ? "subscription_activated" : "subscription_expired",
    });
    fetchProfiles();
    toast({ title: isActivating ? "تم تفعيل الاشتراك وإشعار الطالب" : "تم إلغاء الاشتراك وإشعار الطالب" });
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
    const videoData: any = { title: newVideo.title, description: newVideo.description, video_url: newVideo.video_url, grade: newVideo.grade, subject: newVideo.subject };
    if (newVideo.subject === "الفقه" && newVideo.madhab) {
      videoData.madhab = newVideo.madhab;
    }
    const { data: insertedVideo, error } = await supabase.from("videos").insert(videoData).select("id").single();
    if (error) {
      console.error("Insert video error:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة الفيديو", variant: "destructive" });
    } else {
      // Add homework if enabled
      if (videoHomeworkEnabled && insertedVideo) {
        await supabase.from("video_homework" as any).insert({
          video_id: insertedVideo.id,
          description: videoHomeworkDesc || null,
          questions: videoHomeworkQuestions,
        } as any);
      }
      toast({ title: "تم إضافة الفيديو" });
      setNewVideo({ title: "", description: "", video_url: "", grade: "", subject: "", madhab: "" });
      setVideoHomeworkEnabled(false);
      setVideoHomeworkDesc("");
      setVideoHomeworkQuestions([]);
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

  const saveSubmissionGrade = async (submissionId: string) => {
    const scoreNum = editScore ? parseInt(editScore) : null;
    if (scoreNum !== null && (scoreNum < 0 || scoreNum > 10)) {
      toast({ title: "خطأ", description: "الدرجة يجب أن تكون بين 0 و 10", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("homework_submissions").update({
      score: scoreNum,
      feedback: editFeedback || null,
    }).eq("id", submissionId);

    if (error) {
      console.error("Update submission error:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حفظ الدرجة", variant: "destructive" });
    } else {
      toast({ title: "تم حفظ الدرجة والملاحظات" });
      setEditingSubmission(null);
      setEditScore("");
      setEditFeedback("");
      fetchHomeworkSubmissions();
    }
  };

  const filteredProfiles = profiles.filter(p => {
    if (searchQuery && !p.full_name.includes(searchQuery) && !p.student_phone.includes(searchQuery)) return false;
    if (filterGrade && p.grade !== filterGrade) return false;
    if (filterSubscription === "subscribed" && !p.is_subscribed) return false;
    if (filterSubscription === "unsubscribed" && p.is_subscribed) return false;
    return true;
  });

  const filteredHwSubmissions = hwSubmissions.filter(s => {
    if (hwFilterGrade && s.homework_grade !== hwFilterGrade) return false;
    if (hwSearchQuery && !s.student_name.includes(hwSearchQuery) && !s.student_phone.includes(hwSearchQuery)) return false;
    return true;
  });

  const filteredExamAttempts = examAttempts.filter(a => {
    if (examFilterGrade && a.exam_grade !== examFilterGrade) return false;
    if (examSearchQuery && !a.student_name.includes(examSearchQuery) && !a.student_phone.includes(examSearchQuery)) return false;
    return true;
  });

  const totalStudents = profiles.length;
  const subscribedCount = profiles.filter(p => p.is_subscribed).length;
  const unsubscribedCount = profiles.filter(p => !p.is_subscribed).length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Student info card component
  const StudentInfoCard = ({ name, phone, parentPhone, grade, school, governorate, madhab }: {
    name: string; phone: string; parentPhone: string | null; grade: string;
    school: string | null; governorate: string | null; madhab: string | null;
  }) => (
    <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-0.5">
      <p className="font-bold text-sm">{name}</p>
      <p>{grade}</p>
      {school && <p>{school}{governorate ? ` - ${governorate}` : ""}</p>}
      {madhab && <p>{madhab}</p>}
      <p>📱 الطالب: {phone}</p>
      {parentPhone && <p>📱 ولي الأمر: {parentPhone}</p>}
    </div>
  );

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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTab("messages")}
                className="gap-1 relative"
              >
                <MessageCircle className="w-4 h-4" />
                {unreadMsgCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadMsgCount}
                  </span>
                )}
              </Button>
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
        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {[
            { key: "subscribers" as const, label: "المشتركين", icon: Users },
            { key: "requests" as const, label: "طلبات الاشتراك", icon: ClipboardList },
            { key: "notifications" as const, label: "الإشعارات", icon: Bell },
            { key: "videos" as const, label: "الفيديوهات", icon: Video },
            { key: "messages" as const, label: "الشكاوى والاقتراحات", icon: MessageCircle },
            { key: "homework" as const, label: "الواجبات", icon: FileText },
            { key: "video_homework" as const, label: "واجبات الفيديو", icon: Video },
            { key: "exams" as const, label: "الامتحانات", icon: ClipboardList },
            { key: "reports" as const, label: "التقارير", icon: BarChart3 },
            { key: "news" as const, label: "الأخبار", icon: Newspaper },
          ].map(t => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.key)}
              className={`gap-1 relative ${t.key === "messages" && unreadMsgCount > 0 && tab !== "messages" ? "border-destructive text-destructive" : ""}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.key === "messages" && unreadMsgCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMsgCount}
                </span>
              )}
            </Button>
          ))}
        </div>

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
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm">{n.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {n.target_grades.length > 0 ? n.target_grades.join("، ") : "جميع الطلاب"} · {new Date(n.created_at).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={async () => {
                          const { error } = await supabase.from("notifications").delete().eq("id", n.id);
                          if (error) {
                            toast({ title: "خطأ", description: "فشل حذف الإشعار", variant: "destructive" });
                          } else {
                            toast({ title: "تم الحذف", description: "تم حذف الإشعار بنجاح" });
                            fetchNotifications();
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
                {newVideo.subject === "الفقه" && (
                  <div>
                    <Label>المذهب الفقهي</Label>
                    <select value={newVideo.madhab} onChange={e => setNewVideo({ ...newVideo, madhab: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="">اختر المذهب</option>
                      <option value="الفقه الشافعي">الفقه الشافعي</option>
                      <option value="الفقه المالكي">الفقه المالكي</option>
                      <option value="الفقه الحنفي">الفقه الحنفي</option>
                    </select>
                  </div>
                )}
                {/* Video Homework Section */}
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={videoHomeworkEnabled}
                      onChange={e => setVideoHomeworkEnabled(e.target.checked)}
                      className="rounded border-input"
                    />
                    <Label className="cursor-pointer" onClick={() => setVideoHomeworkEnabled(!videoHomeworkEnabled)}>
                      إضافة واجب على الفيديو (لفتح الفيديو التالي)
                    </Label>
                  </div>

                  {videoHomeworkEnabled && (
                    <div className="space-y-3 bg-muted/50 rounded-lg p-3">
                      <div>
                        <Label>وصف الواجب (اختياري)</Label>
                        <Input value={videoHomeworkDesc} onChange={e => setVideoHomeworkDesc(e.target.value)} placeholder="تعليمات أو ملاحظات للطالب..." />
                      </div>

                      <div className="space-y-2">
                        <Label>أسئلة اختيار من متعدد</Label>
                        {videoHomeworkQuestions.map((q, qi) => (
                          <div key={qi} className="bg-card rounded-lg border border-border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">سؤال {qi + 1}</span>
                              <Button variant="ghost" size="sm" className="text-destructive h-6 px-2 text-xs" onClick={() => setVideoHomeworkQuestions(prev => prev.filter((_, i) => i !== qi))}>حذف</Button>
                            </div>
                            <Input
                              value={q.question}
                              onChange={e => {
                                const updated = [...videoHomeworkQuestions];
                                updated[qi].question = e.target.value;
                                setVideoHomeworkQuestions(updated);
                              }}
                              placeholder="نص السؤال"
                              className="text-xs"
                            />
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`q-${qi}-correct`}
                                  checked={q.correct === oi}
                                  onChange={() => {
                                    const updated = [...videoHomeworkQuestions];
                                    updated[qi].correct = oi;
                                    setVideoHomeworkQuestions(updated);
                                  }}
                                />
                                <Input
                                  value={opt}
                                  onChange={e => {
                                    const updated = [...videoHomeworkQuestions];
                                    updated[qi].options[oi] = e.target.value;
                                    setVideoHomeworkQuestions(updated);
                                  }}
                                  placeholder={`الخيار ${oi + 1}`}
                                  className="text-xs h-8"
                                />
                              </div>
                            ))}
                            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => {
                              const updated = [...videoHomeworkQuestions];
                              updated[qi].options.push("");
                              setVideoHomeworkQuestions(updated);
                            }}>+ خيار</Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setVideoHomeworkQuestions(prev => [...prev, { question: "", options: ["", "", "", ""], correct: 0 }])}>
                          + إضافة سؤال
                        </Button>
                      </div>
                    </div>
                  )}
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

        {/* Subscription Requests Tab */}
        {tab === "requests" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-amiri">طلبات الاشتراك</h2>
              <Button variant="outline" size="sm" onClick={fetchSubRequests} className="gap-1">
                <RefreshCw className="w-3 h-3" /> تحديث
              </Button>
            </div>

            {subRequestsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : subRequests.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">لا توجد طلبات اشتراك</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subRequests.map((req: any) => (
                  <div key={req.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm">{req.student_name}</h3>
                        <p className="text-xs text-muted-foreground">{req.student_grade} · {req.student_phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        req.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        req.status === "approved" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {req.status === "pending" ? "قيد الانتظار" : req.status === "approved" ? "مقبول" : "مرفوض"}
                      </span>
                    </div>

                    <div className="bg-muted rounded-lg p-3 text-xs space-y-1">
                      <p><strong>رقم المحوّل منه:</strong> <span dir="ltr">{req.sender_phone}</span></p>
                      <p><strong>رقم التحويل (المرجع):</strong> {req.transfer_number}</p>
                      <p><strong>المبلغ:</strong> {req.amount} جنيه</p>
                    </div>

                    {req.signed_receipt_url && (
                      <div>
                        <p className="text-xs font-medium mb-1">صورة الإيصال:</p>
                        <img
                          src={req.signed_receipt_url}
                          alt="إيصال التحويل"
                          className="w-full max-h-64 object-contain rounded-lg border border-border cursor-pointer"
                          onClick={() => window.open(req.signed_receipt_url, '_blank')}
                        />
                      </div>
                    )}

                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveRequest(req)} className="flex-1 gap-1">
                          <UserCheck className="w-3 h-3" /> قبول وتفعيل
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(req)} className="flex-1 gap-1">
                          <UserX className="w-3 h-3" /> رفض
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {tab === "homework" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-amiri">تسليمات الواجبات</h2>
              <Button variant="outline" size="sm" onClick={fetchHomeworkSubmissions} className="gap-1">
                <RefreshCw className="w-3 h-3" />
                تحديث
              </Button>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div>
                <Label className="text-xs">بحث بالاسم أو رقم الموبايل</Label>
                <div className="relative">
                  <Input value={hwSearchQuery} onChange={e => setHwSearchQuery(e.target.value)} placeholder="اسم الطالب أو رقم الموبايل..." className="pr-10" />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label className="text-xs">المرحلة</Label>
                <select value={hwFilterGrade} onChange={e => setHwFilterGrade(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">الكل</option>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">عرض {filteredHwSubmissions.length} تسليم</p>

            {hwLoadingData ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredHwSubmissions.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">لا توجد تسليمات بعد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHwSubmissions.map(s => (
                  <div key={s.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                    {/* Homework info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm">{s.homework_title}</h3>
                        <p className="text-xs text-muted-foreground">{s.homework_subject} · {s.homework_grade}</p>
                        <p className="text-xs text-muted-foreground">تاريخ التسليم: {new Date(s.submitted_at).toLocaleDateString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      {s.score !== null && (
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-bold">
                          {s.score} درجة
                        </span>
                      )}
                    </div>

                    {/* Student info */}
                    <StudentInfoCard
                      name={s.student_name}
                      phone={s.student_phone}
                      parentPhone={s.parent_phone}
                      grade={s.student_grade}
                      school={s.student_school}
                      governorate={s.student_governorate}
                      madhab={s.student_madhab}
                    />

                    {/* Answer content */}
                    {s.content && (
                      <div className="bg-background rounded-lg p-3 border border-border">
                        <p className="text-xs font-medium mb-1">الإجابة النصية:</p>
                        <p className="text-sm whitespace-pre-wrap">{s.content}</p>
                      </div>
                    )}

                    {/* Answer images */}
                    {s.image_urls.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2">صور الإجابة ({s.image_urls.length}):</p>
                        <div className="flex gap-2 flex-wrap">
                          {s.image_urls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              className="w-20 h-20 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setViewingImages(s.image_urls)}
                              alt={`صورة ${i + 1}`}
                            />
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={() => setViewingImages(s.image_urls)}>
                          <Eye className="w-3 h-3" />
                          عرض الصور بالحجم الكامل
                        </Button>
                      </div>
                    )}

                    {/* Feedback */}
                    {s.feedback && !editingSubmission && (
                      <div className="bg-primary/5 rounded-lg p-3">
                        <p className="text-xs font-medium">ملاحظات الأستاذ:</p>
                        <p className="text-sm">{s.feedback}</p>
                      </div>
                    )}

                    {/* Grade/Feedback editing */}
                    {editingSubmission === s.id ? (
                      <div className="space-y-3 border-t border-border pt-3">
                        <div>
                          <Label className="text-xs">الدرجة</Label>
                          <Input type="number" min="0" max="10" value={editScore} onChange={e => setEditScore(e.target.value)} placeholder="أدخل الدرجة (من 0 إلى 10)" />
                        </div>
                        <div>
                          <Label className="text-xs">ملاحظات</Label>
                          <textarea
                            value={editFeedback}
                            onChange={e => setEditFeedback(e.target.value)}
                            placeholder="اكتب ملاحظاتك..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveSubmissionGrade(s.id)} className="flex-1 gap-1">
                            <Star className="w-3 h-3" />
                            حفظ
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingSubmission(null)}>إلغاء</Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1"
                        onClick={() => {
                          setEditingSubmission(s.id);
                          setEditScore(s.score?.toString() || "");
                          setEditFeedback(s.feedback || "");
                        }}
                      >
                        <MessageSquare className="w-3 h-3" />
                        {s.score !== null ? "تعديل الدرجة والملاحظات" : "إضافة درجة وملاحظات"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exams Tab */}
        {tab === "exams" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-amiri">نتائج الامتحانات</h2>
              <Button variant="outline" size="sm" onClick={fetchExamAttempts} className="gap-1">
                <RefreshCw className="w-3 h-3" />
                تحديث
              </Button>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div>
                <Label className="text-xs">بحث بالاسم أو رقم الموبايل</Label>
                <div className="relative">
                  <Input value={examSearchQuery} onChange={e => setExamSearchQuery(e.target.value)} placeholder="اسم الطالب أو رقم الموبايل..." className="pr-10" />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label className="text-xs">المرحلة</Label>
                <select value={examFilterGrade} onChange={e => setExamFilterGrade(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">الكل</option>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">عرض {filteredExamAttempts.length} محاولة</p>

            {examLoadingData ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredExamAttempts.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">لا توجد نتائج امتحانات بعد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExamAttempts.map(a => (
                  <div key={a.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                    {/* Exam info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm">{a.exam_title}</h3>
                        <p className="text-xs text-muted-foreground">{a.exam_subject} · {a.exam_grade}</p>
                        <p className="text-xs text-muted-foreground">تاريخ التقديم: {new Date(a.submitted_at).toLocaleDateString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        a.score !== null && a.total !== null && a.score >= a.total * 0.6
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {a.score ?? 0} / {a.total ?? 0}
                      </span>
                    </div>

                    {/* Student info */}
                    <StudentInfoCard
                      name={a.student_name}
                      phone={a.student_phone}
                      parentPhone={a.parent_phone}
                      grade={a.student_grade}
                      school={a.student_school}
                      governorate={a.student_governorate}
                      madhab={a.student_madhab}
                    />

                    {/* Score bar */}
                    {a.score !== null && a.total !== null && a.total > 0 && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>النتيجة</span>
                          <span>{Math.round((a.score / a.total) * 100)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              a.score >= a.total * 0.6 ? "bg-primary" : "bg-destructive"
                            }`}
                            style={{ width: `${Math.min(100, (a.score / a.total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {tab === "messages" && (
          <div className="space-y-4">
            {selectedConvo ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedConvo(null); fetchMessages(); }} className="gap-1">
                    <ChevronRight className="w-3 h-3" /> الرجوع
                  </Button>
                  <h3 className="font-bold text-sm">{selectedConvoName}</h3>
                </div>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="h-80 overflow-y-auto p-4 space-y-3">
                    {convoMessages.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-8">لا توجد رسائل</p>
                    ) : convoMessages.map(m => (
                      <div key={m.id} className={`flex ${m.is_admin_reply ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                          m.is_admin_reply ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}>
                          {m.is_admin_reply && <p className="text-xs font-bold mb-1 opacity-70">أنت (الإدارة)</p>}
                          <p>{m.content}</p>
                          <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-border flex gap-2">
                    <textarea
                      value={adminReply}
                      onChange={e => setAdminReply(e.target.value)}
                      placeholder="اكتب ردك هنا..."
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[40px] max-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAdminReply(); } }}
                    />
                    <Button onClick={sendAdminReply} disabled={sendingReply || !adminReply.trim()} size="icon" className="h-10 w-10 flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold font-amiri flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" /> رسائل الطلاب
                  </h2>
                  <Button variant="outline" size="sm" onClick={fetchMessages} className="gap-1">
                    <RefreshCw className="w-3 h-3" /> تحديث
                  </Button>
                </div>
                {msgLoading ? (
                  <p className="text-center text-muted-foreground py-6">جاري التحميل...</p>
                ) : msgConversations.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">لا توجد رسائل بعد</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {msgConversations.map(c => (
                      <div
                        key={c.user_id}
                        onClick={() => openConversation(c.user_id, c.student_name)}
                        className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm">{c.student_name}</h3>
                              {c.unread_count > 0 && (
                                <span className="bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{c.unread_count}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{c.student_grade}</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{c.last_message}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {new Date(c.last_time).toLocaleDateString("ar-EG")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab - removed WhatsApp */}

        {tab === "video_homework" && (
          <AdminVideoHomeworkTab toast={toast} />
        )}

        {tab === "news" && (
          <AdminNewsTab toast={toast} />
        )}
      </main>
    </div>
  );
};

export default Admin;