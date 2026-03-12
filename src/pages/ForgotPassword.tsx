import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight, Phone, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Step = "phone" | "code" | "password";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("send-reset-code", {
      body: { phone: phone.trim() },
    });

    setLoading(false);

    if (error || data?.error) {
      const errMsg = data?.error || "";
      let description = "فشل في إرسال الكود. حاول مرة أخرى.";
      if (/غير مسجل/i.test(errMsg)) {
        description = "هذا الرقم غير مسجل في المنصة. تأكد من الرقم أو أنشئ حساب جديد.";
      } else if (/rate limit|too many|كثيرة/i.test(errMsg)) {
        description = "محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.";
      } else if (errMsg) {
        description = errMsg;
      }
      toast({
        title: "فشل إرسال الكود",
        description,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "تم الإرسال", description: "تم إرسال كود التحقق على رقمك" });
    setStep("code");
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({ title: "كود غير صحيح", description: "الكود يجب أن يكون 6 أرقام", variant: "destructive" });
      return;
    }
    setStep("password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({ title: "كلمة مرور قصيرة", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "كلمة المرور غير متطابقة", description: "تأكد من كتابة كلمة المرور بنفس الطريقة في الحقلين", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.functions.invoke("verify-reset-code", {
      body: { phone: phone.trim(), code, new_password: newPassword },
    });

    setLoading(false);

    if (error || data?.error) {
      const errMsg = data?.error || "";
      let description = "فشل في تغيير كلمة المرور. حاول مرة أخرى.";
      if (/كود.*غير صحيح|invalid.*code|expired/i.test(errMsg)) {
        description = "الكود غير صحيح أو منتهي الصلاحية. أعد طلب كود جديد.";
      } else if (errMsg) {
        description = errMsg;
      }
      toast({
        title: "فشل تغيير كلمة المرور",
        description,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "تم بنجاح", description: "تم تغيير كلمة المرور بنجاح" });
    navigate("/auth/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-amiri">استعادة كلمة المرور</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === "phone" && "أدخل رقم هاتفك لإرسال كود التحقق"}
            {step === "code" && "أدخل كود التحقق المرسل على رقمك"}
            {step === "password" && "أدخل كلمة المرور الجديدة"}
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[
            { key: "phone", icon: Phone, label: "الرقم" },
            { key: "code", icon: KeyRound, label: "الكود" },
            { key: "password", icon: Lock, label: "كلمة المرور" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s.key
                    ? "bg-primary text-primary-foreground"
                    : ["phone", "code", "password"].indexOf(step) > i
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <s.icon className="w-4 h-4" />
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-border" />}
            </div>
          ))}
        </div>

        {step === "phone" && (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div>
              <Label className="text-sm font-medium">رقم الهاتف</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                required
                dir="ltr"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "جاري الإرسال..." : "إرسال كود التحقق"}
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <Label className="text-sm font-medium">كود التحقق</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="XXXXXX"
                required
                dir="ltr"
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">تم إرسال كود مكون من 6 أرقام على رقمك</p>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={code.length !== 6}>
              تحقق من الكود
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep("phone")}
            >
              <ArrowRight className="w-4 h-4 ml-1" />
              تغيير الرقم
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <Label className="text-sm font-medium">كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                required
                minLength={6}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">تأكيد كلمة المرور</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link to="/auth/login" className="text-primary font-medium hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
