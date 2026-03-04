import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface CertificateData {
  homework_title: string;
  homework_subject: string;
  submitted_at: string;
  student_name: string;
}

const Certificates = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [studentName, setStudentName] = useState("");
  const [selectedCert, setSelectedCert] = useState<CertificateData | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("full_name, grade").eq("user_id", session.user.id).single();
      if (profile) setStudentName(profile.full_name);

      // Fetch homework submissions with score = 10
      const { data: subs } = await supabase
        .from("homework_submissions")
        .select("homework_id, submitted_at, score")
        .eq("user_id", session.user.id)
        .eq("score", 10);

      if (subs && subs.length > 0) {
        const hwIds = [...new Set(subs.map(s => s.homework_id))];
        const { data: hws } = await supabase.from("homework").select("id, title, subject").in("id", hwIds);
        const hwMap = new Map((hws || []).map(h => [h.id, h]));

        const certs: CertificateData[] = subs.map(s => {
          const hw = hwMap.get(s.homework_id);
          return {
            homework_title: hw?.title || "واجب",
            homework_subject: hw?.subject || "",
            submitted_at: s.submitted_at,
            student_name: profile?.full_name || "",
          };
        });
        setCertificates(certs);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const printCertificate = (cert: CertificateData) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>شهادة تفوق</title>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Kufi+Arabic:wght@400;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f0e8; }
          .certificate {
            width: 800px; height: 560px; background: white; position: relative; overflow: hidden;
            border: 3px solid #1a5c35; box-shadow: 0 0 0 8px #d4a843, 0 0 0 11px #1a5c35;
          }
          .inner-border {
            position: absolute; inset: 20px; border: 2px solid #d4a843;
          }
          .corner { position: absolute; width: 60px; height: 60px; border: 3px solid #d4a843; }
          .corner-tl { top: 30px; left: 30px; border-right: none; border-bottom: none; }
          .corner-tr { top: 30px; right: 30px; border-left: none; border-bottom: none; }
          .corner-bl { bottom: 30px; left: 30px; border-right: none; border-top: none; }
          .corner-br { bottom: 30px; right: 30px; border-left: none; border-top: none; }
          .content { position: relative; z-index: 1; padding: 50px 60px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
          .badge { font-size: 40px; margin-bottom: 10px; }
          .title { font-family: 'Amiri', serif; font-size: 32px; color: #1a5c35; font-weight: 700; margin-bottom: 5px; }
          .subtitle { font-family: 'Noto Kufi Arabic', sans-serif; font-size: 14px; color: #666; margin-bottom: 20px; }
          .name { font-family: 'Amiri', serif; font-size: 28px; color: #d4a843; font-weight: 700; margin: 15px 0; padding: 8px 40px; border-bottom: 2px solid #d4a843; display: inline-block; }
          .reason { font-family: 'Noto Kufi Arabic', sans-serif; font-size: 14px; color: #333; margin: 10px 0; line-height: 1.8; }
          .hw-name { font-weight: 700; color: #1a5c35; }
          .date { font-family: 'Noto Kufi Arabic', sans-serif; font-size: 12px; color: #888; margin-top: 15px; }
          .footer { font-family: 'Amiri', serif; font-size: 16px; color: #1a5c35; margin-top: 10px; font-weight: 700; }
          @media print { body { background: white; } .certificate { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="inner-border"></div>
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
          <div class="content">
            <div class="badge">🏆</div>
            <div class="title">شهادة تفوق ودرجة كاملة</div>
            <div class="subtitle">منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية</div>
            <div>يُشهد بأن الطالب/ة</div>
            <div class="name">${cert.student_name}</div>
            <div class="reason">
              قد حصل/ت على الدرجة الكاملة <strong>(10/10)</strong> في واجب
              <span class="hw-name">"${cert.homework_title}"</span>
              - مادة ${cert.homework_subject}
            </div>
            <div class="date">بتاريخ: ${new Date(cert.submitted_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</div>
            <div class="footer">الأستاذ إسماعيل أحمد عبادة</div>
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
              <Award className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">شهاداتي</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-amiri mb-2">شهادات التفوق</h1>
          <p className="text-sm text-muted-foreground">الشهادات التي حصلت عليها عند تحقيق الدرجة الكاملة (10/10) في الواجبات</p>
        </div>

        {certificates.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold mb-1">لم تحصل على شهادات بعد</h3>
            <p className="text-sm text-muted-foreground">احصل على الدرجة الكاملة (10/10) في أي واجب لتحصل على شهادة تفوق!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{cert.homework_title}</h3>
                  <p className="text-xs text-muted-foreground">{cert.homework_subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(cert.submitted_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => printCertificate(cert)}>
                  <Download className="w-3 h-3" />
                  طباعة
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Certificates;
