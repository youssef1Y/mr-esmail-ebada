import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // First login as normal user
    const email = `${phone}@ismail-ebada.platform`;
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      toast({ title: "خطأ", description: "بيانات الدخول غير صحيحة", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Verify admin via edge function
    const { data, error } = await supabase.functions.invoke("verify-admin", {
      body: { phone, password },
    });

    setLoading(false);

    if (error || data?.error) {
      toast({ title: "خطأ", description: data?.error || "ليس لديك صلاحية الأدمن", variant: "destructive" });
      return;
    }

    toast({ title: "مرحباً بك", description: "تم الدخول كأدمن" });
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="hero-gradient absolute inset-0 opacity-30" />
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-amiri">لوحة تحكم الأدمن</h1>
          <p className="text-muted-foreground text-sm mt-1">أدخل بيانات الدخول</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">رقم الهاتف</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" dir="ltr" required />
          </div>
          <div>
            <Label className="text-sm font-medium">كلمة المرور</Label>
            <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="أدخل كلمة مرور الأدمن" required />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            <Shield className="w-4 h-4 ml-2" />
            {loading ? "جاري الدخول..." : "دخول"}
          </Button>
        </form>

        <Link to="/dashboard" className="block mt-4">
          <Button variant="outline" className="w-full gap-2">
            العودة للمنصة
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AdminLogin;
