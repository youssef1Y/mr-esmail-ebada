import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Users, Phone, Lock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
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

    try {
      const normalizedPhone = phone.trim().replace(/\s+/g, "");
      const email = `${normalizedPhone}@ismail-ebada.platform`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({ title: "خطأ في تسجيل الدخول", description: "رقم الهاتف أو كلمة المرور غير صحيحة", variant: "destructive" });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "خطأ", description: "تعذر قراءة بيانات الحساب", variant: "destructive" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.functions.invoke("delete-user", {
          body: { target_user_id: user.id },
        });
        await supabase.auth.signOut();
        toast({
          title: "تم تنظيف حساب قديم",
          description: "هذا الحساب كانت بياناته محذوفة، يمكنك إنشاء حساب جديد بنفس الرقم الآن.",
        });
        navigate("/auth/register");
        return;
      }

      navigate("/dashboard");
    } catch {
      toast({ title: "خطأ", description: "فشل الاتصال بالخادم", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card rounded-3xl p-6 md:p-8 shadow-xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20"
            >
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold font-amiri">تسجيل الدخول</h1>
            <p className="text-muted-foreground text-sm mt-1">أدخل بياناتك للوصول إلى حسابك</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                رقم الهاتف
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                required
                dir="ltr"
                className="h-12 rounded-xl text-base"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                كلمة المرور
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                required
                className="h-12 rounded-xl text-base"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    تسجيل الدخول
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3 mt-5"
          >
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/auth/forgot-password" className="text-primary/80 text-xs hover:underline hover:text-primary transition-colors">
                نسيت كلمة المرور؟
              </Link>
            </p>

            <p className="text-center text-sm text-muted-foreground">
              ليس لديك حساب؟{" "}
              <Link to="/auth/register" className="text-primary font-medium hover:underline">إنشاء حساب جديد</Link>
            </p>

            <div className="pt-4 border-t border-border">
              <Link to="/parent/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline transition-colors">
                <Users className="w-4 h-4" />
                هل أنت ولي أمر؟ ادخل من هنا
              </Link>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-primary transition-colors">شروط وأحكام الاستخدام</Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
