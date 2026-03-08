import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, User, Phone, CheckCircle, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StudentLevelBadge } from "@/components/StudentLevel";

const governorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم",
  "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس",
  "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "الشرقية", "جنوب سيناء",
  "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهاج",
];

const madhabs = ["الفقه الشافعي", "الفقه المالكي", "الفقه الحنفي"];

interface ProfileData {
  full_name: string;
  grade: string;
  school: string | null;
  governorate: string | null;
  madhab: string | null;
  student_phone: string;
  parent_phone: string | null;
  is_subscribed: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", school: "", governorate: "", madhab: "" });
  const [studentPoints, setStudentPoints] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (data) {
        setProfile(data as ProfileData);
        setForm({
          full_name: data.full_name,
          school: data.school || "",
          governorate: data.governorate || "",
          madhab: data.madhab || "",
        });
      }
      // Fetch points
      const { data: pointsData } = await supabase.from("student_points").select("points").eq("user_id", session.user.id);
      if (pointsData) setStudentPoints(pointsData.reduce((s, p) => s + p.points, 0));
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        school: form.school,
        governorate: form.governorate,
        madhab: form.madhab,
      })
      .eq("user_id", session.user.id);

    setSaving(false);
    if (error) {
      toast({ title: "خطأ", description: "فشل في حفظ التعديلات", variant: "destructive" });
    } else {
      toast({ title: "تم الحفظ", description: "تم تحديث بياناتك بنجاح" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه.")) return;
    await supabase.auth.signOut();
    navigate("/");
    toast({ title: "تم تسجيل الخروج", description: "تواصل مع الدعم لحذف حسابك نهائياً" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">الملف الشخصي</span>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-1 rounded-xl">
              العودة للوحة التحكم
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Avatar */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-3">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-amiri">الملف الشخصي</h1>
          <p className="text-muted-foreground text-sm mb-3">يمكنك تعديل بياناتك الشخصية من هنا</p>
          <StudentLevelBadge points={studentPoints} showProgress />
        </div>

        {/* Account Info */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-bold font-amiri text-center mb-4">معلومات الحساب</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-muted rounded-xl p-3">
              <div>
                <div className="text-xs text-muted-foreground">الصف الدراسي</div>
                <div className="font-bold text-sm">{profile?.grade}</div>
              </div>
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center justify-between bg-muted rounded-xl p-3">
              <div>
                <div className="text-xs text-muted-foreground">رقم الطالب</div>
                <div className="font-bold text-sm" dir="ltr">{profile?.student_phone}</div>
              </div>
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center justify-between bg-muted rounded-xl p-3">
              <div>
                <div className="text-xs text-muted-foreground">رقم ولي الأمر</div>
                <div className="font-bold text-sm" dir="ltr">{profile?.parent_phone || "-"}</div>
              </div>
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center justify-between bg-muted rounded-xl p-3">
              <div>
                <div className="text-xs text-muted-foreground">حالة الاشتراك</div>
                <div className="font-bold text-sm">{profile?.is_subscribed ? "مشترك" : "غير مشترك"}</div>
              </div>
              <CheckCircle className={`w-5 h-5 ${profile?.is_subscribed ? "text-primary" : "text-muted-foreground"}`} />
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-bold font-amiri text-center mb-4">تعديل البيانات</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">اسم الطالب</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm">المدرسة / المعهد</Label>
              <Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm">المحافظة</Label>
              <select
                value={form.governorate}
                onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">اختر المحافظة</option>
                {governorates.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm">المذهب الفقهي</Label>
              <select
                value={form.madhab}
                onChange={(e) => setForm({ ...form, madhab: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">اختر المذهب</option>
                {madhabs.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-card rounded-2xl border border-destructive/30 p-6 text-center">
          <h2 className="text-lg font-bold text-destructive mb-2">⚠ حذف الحساب</h2>
          <p className="text-muted-foreground text-xs mb-4">
            حذف الحساب سيؤدي إلى إزالة جميع بياناتك نهائيًا. هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10 gap-1" onClick={handleDeleteAccount}>
            <Trash2 className="w-3 h-3" />
            حذف حسابي
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
