import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Users, ArrowRight } from "lucide-react";

const ParentLogin = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parent-auth", {
        body: {
          action: isRegister ? "register" : "login",
          phone: phone.trim(),
          password,
          full_name: fullName.trim() || "ولي أمر",
        },
      });

      if (error || data?.error) {
        toast({ title: "خطأ", description: data?.error || "حدث خطأ", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (isRegister) {
        toast({ title: "تم التسجيل بنجاح ✅", description: `تم ربط حسابك بـ ${data.students?.length || 0} طالب` });
        setIsRegister(false);
      } else {
        // Store parent session in localStorage
        localStorage.setItem("parent_session", JSON.stringify({
          parent: data.parent,
          students: data.students,
          phone: phone.trim(),
          password,
        }));
        toast({ title: `أهلاً ${data.parent.full_name} 👋` });
        navigate("/parent/dashboard");
      }
    } catch (err) {
      toast({ title: "خطأ", description: "حدث خطأ في الاتصال", variant: "destructive" });
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
            <CardTitle className="text-lg">{isRegister ? "إنشاء حساب جديد" : "تسجيل الدخول"}</CardTitle>
            <CardDescription>
              {isRegister
                ? "سجّل برقم هاتفك المسجل كولي أمر في بيانات ابنك"
                : "ادخل برقم هاتفك المسجل كولي أمر"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="text-sm font-medium mb-1 block">الاسم</label>
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
                <Input
                  type="tel"
                  placeholder="01xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-right"
                  dir="ltr"
                />
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "جاري المعالجة..." : isRegister ? "إنشاء حساب" : "تسجيل الدخول"}
              </Button>

              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="w-full text-center text-sm text-primary hover:underline"
              >
                {isRegister ? "لديك حساب بالفعل؟ سجّل دخولك" : "ليس لديك حساب؟ سجّل الآن"}
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
