import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Copy, ChevronRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as AuthUser } from "@supabase/supabase-js";

const Subscribe = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; grade: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transferNumber, setTransferNumber] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const transferPhone = "01097602493";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth/login"); return; }
      setUser(session.user);
      supabase.from("profiles").select("full_name, grade").eq("user_id", session.user.id).single()
        .then(({ data }) => { if (data) setProfile(data); setLoading(false); });
    });
  }, [navigate]);

  const subscriptionPrice = profile?.grade?.includes("إعدادي") ? 150 : 200;

  const copyNumber = () => {
    navigator.clipboard.writeText(transferPhone);
    toast({ title: "تم النسخ", description: "تم نسخ رقم التحويل" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transferNumber || !senderPhone || !receiptFile) {
      if (!receiptFile) {
        toast({ title: "خطأ", description: "يجب رفع صورة إيصال التحويل", variant: "destructive" });
      }
      return;
    }
    setSubmitting(true);

    let receiptUrl = "";
    if (receiptFile) {
      const ext = receiptFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("receipts").upload(path, receiptFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
        receiptUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("subscription_requests").insert({
      user_id: user.id,
      transfer_number: transferNumber,
      sender_phone: senderPhone,
      receipt_url: receiptUrl || null,
      amount: subscriptionPrice,
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إرسال الطلب", variant: "destructive" });
    } else {
      // Notify admin about new subscription request
      try {
        await supabase.functions.invoke("notify-subscription", {
          body: {
            fullName: profile?.full_name,
            grade: profile?.grade,
            senderPhone,
            transferNumber,
            amount: subscriptionPrice,
            receiptUrl,
          },
        });
      } catch (e) {
        console.error("Subscription notification error:", e);
      }
      toast({ title: "تم الإرسال", description: "تم إرسال طلب الاشتراك بنجاح وسيتم مراجعته" });
      navigate("/dashboard");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">منصة الأستاذ إسماعيل</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة
              <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-amiri mb-2">الاشتراك الشهري</h1>
          <p className="text-muted-foreground text-sm">
            قم بتحويل مبلغ {subscriptionPrice} جنيه على أحد الأرقام التالية ثم أكمل البيانات
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            الطالب: {profile?.full_name} - {profile?.grade}
          </p>
        </div>

        {/* Transfer Numbers */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-xl font-bold font-amiri text-center mb-4">أرقام التحويل</h2>
          <div className="bg-muted rounded-xl p-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={copyNumber}>
              <Copy className="w-4 h-4" />
            </Button>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">رقم التحويل</p>
              <p className="text-xl font-bold text-primary" dir="ltr">{transferPhone}</p>
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 mt-4 text-center">
            <span className="text-2xl font-bold text-primary">{subscriptionPrice}</span>
            <span className="text-sm text-muted-foreground mr-2">جنيه مصري</span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-xl font-bold font-amiri text-center mb-4">بيانات التحويل</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">رقم التحويل (المرجع)</Label>
              <Input value={transferNumber} onChange={e => setTransferNumber(e.target.value)} placeholder="أدخل رقم التحويل" required />
            </div>
            <div>
              <Label className="text-sm font-medium">الرقم المحوّل منه</Label>
              <Input value={senderPhone} onChange={e => setSenderPhone(e.target.value)} placeholder="01XXXXXXXXX" dir="ltr" required />
            </div>
            <div>
              <Label className="text-sm font-medium">صورة إيصال التحويل</Label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {receiptFile ? receiptFile.name : "اضغط لرفع صورة الإيصال"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "جاري الإرسال..." : "إرسال طلب الاشتراك"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Subscribe;
