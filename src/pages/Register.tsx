import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, UserPlus, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const grades = [
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
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
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({
    fullName: "", grade: "", school: "", governorate: "",
    madhab: "", studentPhone: "", parentPhone: "",
    password: "", confirmPassword: "",
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
    const email = `${form.studentPhone}@ismail-ebada.platform`;

    const { error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName, grade: form.grade,
          school: form.school, governorate: form.governorate,
          madhab: form.madhab, student_phone: form.studentPhone,
          parent_phone: form.parentPhone,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
    } else {
      try {
        await supabase.functions.invoke("notify-registration", {
          body: {
            fullName: form.fullName, grade: form.grade,
            studentPhone: form.studentPhone, school: form.school,
            governorate: form.governorate, madhab: form.madhab,
          },
        });
      } catch (e) { console.error("Notification error:", e); }
      toast({ title: "تم التسجيل بنجاح", description: "مرحباً بك في المنصة" });
      navigate("/onboarding");
    }
  };

  const selectClass = "w-full rounded-xl border border-input bg-background px-3 py-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring transition-all";

  const fieldVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: (i: number) => ({
      opacity: 1, x: 0,
      transition: { delay: 0.1 + i * 0.05, duration: 0.3 }
    }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card rounded-3xl p-6 md:p-8 shadow-xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center mb-6">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20"
            >
              <UserPlus className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold font-amiri">إنشاء حساب جديد</h1>
            <p className="text-muted-foreground text-sm mt-1">سجل الآن في منصة الأستاذ إسماعيل أحمد عباده</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "اسم الطالب", name: "fullName", type: "input", placeholder: "أدخل اسم الطالب بالكامل", required: true },
            ].map((field, i) => (
              <motion.div key={field.name} custom={i} variants={fieldVariants} initial="hidden" animate="visible">
                <Label className="text-sm font-medium mb-1.5 block">{field.label}</Label>
                <Input name={field.name} value={(form as any)[field.name]} onChange={handleChange} placeholder={field.placeholder} required={field.required} className="h-11 rounded-xl" />
              </motion.div>
            ))}

            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
              <Label className="text-sm font-medium mb-1.5 block">الصف الدراسي</Label>
              <select name="grade" value={form.grade} onChange={handleChange} required className={selectClass}>
                <option value="">اختر الصف الدراسي</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </motion.div>

            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
              <Label className="text-sm font-medium mb-1.5 block">المدرسة</Label>
              <Input name="school" value={form.school} onChange={handleChange} placeholder="أدخل اسم المدرسة" className="h-11 rounded-xl" />
            </motion.div>

            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
              <Label className="text-sm font-medium mb-1.5 block">المحافظة</Label>
              <select name="governorate" value={form.governorate} onChange={handleChange} className={selectClass}>
                <option value="">اختر المحافظة</option>
                {governorates.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </motion.div>

            <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
              <Label className="text-sm font-medium mb-1.5 block">المذهب الفقهي</Label>
              <select name="madhab" value={form.madhab} onChange={handleChange} className={selectClass}>
                <option value="">اختر المذهب</option>
                {madhabs.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </motion.div>

            <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">رقم الطالب</Label>
                <Input name="studentPhone" value={form.studentPhone} onChange={handleChange} placeholder="01XXXXXXXXX" required dir="ltr" className="h-11 rounded-xl" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">رقم ولي الأمر</Label>
                <Input name="parentPhone" value={form.parentPhone} onChange={handleChange} placeholder="01XXXXXXXXX" dir="ltr" className="h-11 rounded-xl" />
              </div>
            </motion.div>

            <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">كلمة المرور</Label>
                <Input name="password" type="password" value={form.password} onChange={handleChange} placeholder="6 أحرف على الأقل" required className="h-11 rounded-xl" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">تأكيد كلمة المرور</Label>
                <Input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="أعد الكتابة" required className="h-11 rounded-xl" />
              </div>
            </motion.div>

            <motion.div custom={7} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-start gap-2">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="rounded mt-1" id="terms" />
              <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
                أوافق على{" "}
                <Link to="/terms" className="text-primary hover:underline font-medium" target="_blank">شروط وأحكام الاستخدام</Link>
              </label>
            </motion.div>

            <motion.div custom={8} variants={fieldVariants} initial="hidden" animate="visible">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                size="lg"
                disabled={loading || !acceptedTerms}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    جاري التسجيل...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    إنشاء حساب
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center text-sm text-muted-foreground mt-4">
            لديك حساب بالفعل؟{" "}
            <Link to="/auth/login" className="text-primary font-medium hover:underline">تسجيل الدخول</Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
