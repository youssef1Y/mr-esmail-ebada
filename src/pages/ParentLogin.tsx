import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Users, ArrowRight, Phone } from "lucide-react";

const ParentLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password) {
      toast({ title: "بيانات ناقصة", description: "أدخل رقم الهاتف وكلمة المرور", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parent-auth", {
        body: { action: "login", phone: phone.trim(), password },
      });

      if (error || data?.error) {
        const errMsg = data?.error || "";
        let description = "رقم الهاتف أو كلمة المرور غير صحيحة. تأكد من البيانات وحاول مرة أخرى.";
        if (/غير مسجل|لأي طالب/i.test(errMsg)) {
          description = errMsg;
        } else if (/كلمة المرور/i.test(errMsg)) {
          description = errMsg;
        } else if (errMsg) {
          description = errMsg;
        }
        toast({ title: "فشل تسجيل الدخول", description, variant: "destructive" });
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
      toast({ title: "فشل الاتصال", description: "تأكد من اتصالك بالإنترنت وحاول مرة أخرى.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast({ title: "بيانات ناقصة", description: "أدخل رقم الهاتف", variant: "destructive" });
      return;
    }
    if (!password || password.length < 6) {
      toast({ title: "كلمة مرور قصيرة", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "كلمة المرور غير متطابقة", description: "تأكد من كتابة كلمة المرور بنفس الطريقة في الحقلين", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parent-auth", {
        body: {
          action: "register",
          phone: phone.trim(),
          password,
          full_name: fullName.trim() || "ولي أمر",
        },
      });

      if (error || data?.error) {
        const errMsg = data?.error || "";
        let description = "حدث خطأ أثناء التسجيل. حاول مرة أخرى.";
        if (/غير مسجل|لأي طالب/i.test(errMsg)) {
          description = errMsg;
        } else if (/مسجل بالفعل/i.test(errMsg)) {
          description = errMsg;
        } else if (errMsg) {
          description = errMsg;
        }
        toast({ title: "فشل إنشاء الحساب", description, variant: "destructive" });
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
              {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
            </CardTitle>
            <CardDescription>
              {mode === "login" 
                ? "ادخل برقم هاتفك المسجل كولي أمر" 
                : "أدخل رقم هاتفك المسجل في بيانات ابنك وكلمة مرور جديدة"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">اسمك (اختياري)</label>
                  <Input
                    placeholder="اسم ولي الأمر"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-right"
                  />
                </div>
              )}

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
                    placeholder={mode === "register" ? "6 أحرف على الأقل" : "كلمة المرور"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-right pl-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
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
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading 
                  ? (mode === "login" ? "جاري الدخول..." : "جاري التسجيل...") 
                  : (mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب")}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setPassword("");
                  setConfirmPassword("");
                }}
                className="w-full text-center text-sm text-primary hover:underline"
              >
                {mode === "login" ? "ليس لديك حساب؟ سجّل الآن" : "لديك حساب بالفعل؟ سجّل دخولك"}
              </button>
            </form>

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
