import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const grades = [
  "الصف الأول الإعدادي",
  "الصف الثاني الإعدادي",
  "الصف الثالث الإعدادي",
  "الصف الأول الثانوي",
  "الصف الثاني الثانوي",
  "الصف الثالث الثانوي",
];

const governorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم",
  "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس",
  "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "الشرقية", "جنوب سيناء",
  "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهاج",
];

const madhabs = ["الفقه الشافعي", "الفقه المالكي", "الفقه الحنفي"];

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    grade: "",
    school: "",
    governorate: "",
    madhab: "",
    studentPhone: "",
    parentPhone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: "خطأ", description: "كلمة المرور غير متطابقة", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }

    setLoading(true);
    // Use phone as email for auth (phone@platform.com)
    const email = `${form.studentPhone}@ismail-ebada.platform`;

    const { error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          grade: form.grade,
          school: form.school,
          governorate: form.governorate,
          madhab: form.madhab,
          student_phone: form.studentPhone,
          parent_phone: form.parentPhone,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
    } else {
      // Notify admin about new registration
      try {
        await supabase.functions.invoke("notify-registration", {
          body: {
            fullName: form.fullName,
            grade: form.grade,
            studentPhone: form.studentPhone,
            school: form.school,
            governorate: form.governorate,
            madhab: form.madhab,
          },
        });
      } catch (e) {
        console.error("Notification error:", e);
      }
      toast({ title: "تم التسجيل بنجاح", description: "مرحباً بك في المنصة" });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-amiri">إنشاء حساب جديد</h1>
          <p className="text-muted-foreground text-sm mt-1">سجل الآن في منصة الأستاذ إسماعيل أحمد عباده</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">اسم الطالب</Label>
            <Input name="fullName" value={form.fullName} onChange={handleChange} placeholder="أدخل اسم الطالب بالكامل" required />
          </div>

          <div>
            <Label className="text-sm font-medium">الصف الدراسي</Label>
            <select
              name="grade"
              value={form.grade}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">اختر الصف الدراسي</option>
              {grades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium">المدرسة</Label>
            <Input name="school" value={form.school} onChange={handleChange} placeholder="أدخل اسم المدرسة" />
          </div>

          <div>
            <Label className="text-sm font-medium">المحافظة</Label>
            <select
              name="governorate"
              value={form.governorate}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">اختر المحافظة</option>
              {governorates.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium">المذهب الفقهي</Label>
            <select
              name="madhab"
              value={form.madhab}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">اختر المذهب</option>
              {madhabs.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">رقم الطالب</Label>
              <Input name="studentPhone" value={form.studentPhone} onChange={handleChange} placeholder="01XXXXXXXXX" required dir="ltr" />
            </div>
            <div>
              <Label className="text-sm font-medium">رقم ولي الأمر</Label>
              <Input name="parentPhone" value={form.parentPhone} onChange={handleChange} placeholder="01XXXXXXXXX" dir="ltr" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">كلمة المرور</Label>
              <Input name="password" type="password" value={form.password} onChange={handleChange} placeholder="6 أحرف على الأقل" required />
            </div>
            <div>
              <Label className="text-sm font-medium">تأكيد كلمة المرور</Label>
              <Input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="أعد كتابة كلمة المرور" required />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              className="rounded mt-1"
              id="terms"
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
              أوافق على{" "}
              <Link to="/terms" className="text-primary hover:underline font-medium" target="_blank">
                شروط وأحكام الاستخدام
              </Link>
            </label>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading || !acceptedTerms}>
            {loading ? "جاري التسجيل..." : "إنشاء حساب"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          لديك حساب بالفعل؟{" "}
          <Link to="/auth/login" className="text-primary font-medium hover:underline">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
