import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Users, ArrowRight, ShieldCheck, Phone, KeyRound, CheckCircle2 } from "lucide-react";

type Step = "phone" | "otp" | "password" | "login";

const ParentLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<Step>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState<{ full_name: string; grade: string }[]>([]);

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      toast({ title: "خطأ", description: "أدخل رقم هاتف صحيح", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parent-auth", {
        body: { action: "send_otp", phone: phone.trim() },
      });

      if (error || data?.error) {
        toast({ title: "خطأ", description: data?.error || "حدث خطأ", variant: "destructive" });
      } else {
        setLinkedStudents(data.students || []);
        toast({ title: "تم إرسال كود التحقق ✅", description: "تحقق من رسائل SMS على هاتفك" });
        setStep("otp");
      }
    } catch {
      toast({ title: "خطأ", description: "فشل الاتصال بالخادم", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleVerifyAndRegister = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      toast({ title: "خطأ", description: "أدخل كود التحقق المكون من 6 أرقام", variant: "destructive" });
      return;
    }
    if (!password || password.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمة المرور غير متطابقة", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parent-auth", {
        body: {
          action: "verify_and_register",
          phone: phone.trim(),
          otp: otp.trim(),
          password,
          full_name: fullName.trim() || "ولي أمر",
        },
      });

      if (error || data?.error) {
        toast({ title: "خطأ", description: data?.error || "حدث خطأ", variant: "destructive" });
      } else {
        localStorage.setItem("parent_session", JSON.stringify({
          parent: data.parent,
          students: data.students,
          phone: phone.trim(),
          session_token: data.session_token,
        }));
        toast({ title: "تم التسجيل بنجاح ✅", description: `مرحباً ${data.parent?.full_name || "ولي الأمر"}` });
        navigate("/parent/dashboard");
      }
    } catch {
      toast({ title: "خطأ", description: "فشل الاتصال بالخادم", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password) {
      toast({ title: "خطأ", description: "أدخل رقم الهاتف وكلمة المرور", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parent-auth", {
        body: { action: "login", phone: phone.trim(), password },
      });

      if (error || data?.error) {
        toast({ title: "خطأ", description: data?.error || "حدث خطأ", variant: "destructive" });
      } else {
        localStorage.setItem("parent_session", JSON.stringify({
          parent: data.parent,
          students: data.students,
          phone: phone.trim(),
          session_token: data.session_token,
        }));
        toast({ title: `أهلاً ${data.parent.full_name} 👋` });
        navigate("/parent/dashboard");
      }
    } catch {
      toast({ title: "خطأ", description: "فشل الاتصال بالخادم", variant: "destructive" });
    }
    setLoading(false);
  };

  const switchToRegister = () => {
    setMode("register");
    setStep("phone");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
  };

  const switchToLogin = () => {
    setMode("login");
    setStep("login");
    setPassword("");
    setOtp("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-amiri text-foreground">لوحة ولي الأمر</h1>
          <p className="text-muted-foreground text-sm mt-1">تابع أداء ابنك الدراسي</p>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {mode === "login" ? "تسجيل الدخول" : 
                step === "phone" ? "التسجيل — الخطوة 1" :
                step === "otp" ? "التسجيل — الخطوة 2" : "التسجيل — الخطوة 3"}
            </CardTitle>
            <CardDescription>
              {mode === "login" ? "ادخل برقم هاتفك المسجل كولي أمر" :
                step === "phone" ? "أدخل رقم هاتفك المسجل في بيانات ابنك" :
                step === "otp" ? "أدخل كود التحقق المرسل لهاتفك وكلمة المرور الجديدة" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ===== LOGIN MODE ===== */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">كلمة المرور</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-right pl-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جاري الدخول..." : "تسجيل الدخول"}
                </Button>
                <button type="button" onClick={switchToRegister} className="w-full text-center text-sm text-primary hover:underline">
                  ليس لديك حساب؟ سجّل الآن
                </button>
              </form>
            )}

            {/* ===== REGISTER: STEP 1 - Phone ===== */}
            {mode === "register" && step === "phone" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">اسمك (اختياري)</label>
                  <Input
                    placeholder="اسم ولي الأمر"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-right"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">رقم هاتفك (المسجل في بيانات ابنك)</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    سيتم إرسال كود تحقق SMS لرقمك للتأكد من ملكيتك للرقم قبل إنشاء الحساب
                  </p>
                </div>

                <Button onClick={handleSendOtp} className="w-full" disabled={loading}>
                  {loading ? "جاري الإرسال..." : "إرسال كود التحقق"}
                </Button>
                <button type="button" onClick={switchToLogin} className="w-full text-center text-sm text-primary hover:underline">
                  لديك حساب بالفعل؟ سجّل دخولك
                </button>
              </div>
            )}

            {/* ===== REGISTER: STEP 2 - OTP + Password ===== */}
            {mode === "register" && step === "otp" && (
              <div className="space-y-4">
                {/* Linked students info */}
                {linkedStudents.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> تم العثور على الطلاب المرتبطين:
                    </p>
                    {linkedStudents.map((s, i) => (
                      <p key={i} className="text-xs text-green-600 dark:text-green-400 mr-4">
                        • {s.full_name} ({s.grade})
                      </p>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block">كود التحقق (6 أرقام)</label>
                  <div className="relative">
                    <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="pr-10 text-center text-lg tracking-[0.5em] font-mono"
                      dir="ltr"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="6 أحرف على الأقل"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-right pl-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">تأكيد كلمة المرور</label>
                  <Input
                    type="password"
                    placeholder="أعد كتابة كلمة المرور"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-right"
                  />
                </div>

                <Button onClick={handleVerifyAndRegister} className="w-full" disabled={loading}>
                  {loading ? "جاري التسجيل..." : "تأكيد وإنشاء الحساب"}
                </Button>

                <div className="flex items-center justify-between text-xs">
                  <button type="button" onClick={handleSendOtp} className="text-primary hover:underline" disabled={loading}>
                    إعادة إرسال الكود
                  </button>
                  <button type="button" onClick={() => setStep("phone")} className="text-muted-foreground hover:underline">
                    تغيير الرقم
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              <Link to="/" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowRight className="w-4 h-4" />
                العودة للصفحة الرئيسية
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentLogin;
