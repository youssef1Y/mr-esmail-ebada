import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const email = `${phone}@ismail-ebada.platform`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast({ title: "خطأ في تسجيل الدخول", description: "رقم الهاتف أو كلمة المرور غير صحيحة", variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-amiri">تسجيل الدخول</h1>
          <p className="text-muted-foreground text-sm mt-1">أدخل بياناتك للوصول إلى حسابك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-sm font-medium">رقم الهاتف</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" required dir="ltr" />
          </div>

          <div>
            <Label className="text-sm font-medium">كلمة المرور</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="أدخل كلمة المرور" required />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-3">
          <Link to="/auth/forgot-password" className="text-primary/80 text-xs hover:underline">نسيت كلمة المرور؟</Link>
        </p>

        <p className="text-center text-sm text-muted-foreground mt-2">
          ليس لديك حساب؟{" "}
          <Link to="/auth/register" className="text-primary font-medium hover:underline">إنشاء حساب جديد</Link>
        </p>
        <div className="mt-4 pt-4 border-t border-border">
          <Link to="/parent/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
            <Users className="w-4 h-4" />
            هل أنت ولي أمر؟ ادخل من هنا
          </Link>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          <Link to="/terms" className="hover:text-primary transition-colors">شروط وأحكام الاستخدام</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
