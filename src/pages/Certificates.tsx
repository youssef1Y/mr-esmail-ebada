import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, Download, ChevronRight, BookOpen, FileText, Eye, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface CertificateData {
  title: string;
  subject: string;
  submitted_at: string;
  student_name: string;
  type: "homework" | "exam";
  score?: string;
}

const Certificates = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("full_name, grade").eq("user_id", session.user.id).single();
      const studentName = profile?.full_name || "";

      const allCerts: CertificateData[] = [];

      // Homework certificates (score = 10)
      const { data: hwSubs } = await supabase
        .from("homework_submissions")
        .select("homework_id, submitted_at, score")
        .eq("user_id", session.user.id)
        .eq("score", 10);

      if (hwSubs && hwSubs.length > 0) {
        const hwIds = [...new Set(hwSubs.map(s => s.homework_id))];
        const { data: hws } = await supabase.from("homework").select("id, title, subject").in("id", hwIds);
        const hwMap = new Map((hws || []).map(h => [h.id, h]));
        hwSubs.forEach(s => {
          const hw = hwMap.get(s.homework_id);
          allCerts.push({
            title: hw?.title || "واجب",
            subject: hw?.subject || "",
            submitted_at: s.submitted_at,
            student_name: studentName,
            type: "homework",
            score: "10/10",
          });
        });
      }

      // Exam certificates (100% score)
      const { data: examAttempts } = await supabase
        .from("exam_attempts")
        .select("exam_id, submitted_at, score, total")
        .eq("user_id", session.user.id);

      if (examAttempts && examAttempts.length > 0) {
        const fullScoreAttempts = examAttempts.filter(a => a.score !== null && a.total !== null && a.total > 0 && a.score === a.total);
        if (fullScoreAttempts.length > 0) {
          const examIds = [...new Set(fullScoreAttempts.map(a => a.exam_id))];
          const { data: exams } = await supabase.from("exams").select("id, title, subject").in("id", examIds);
          const examMap = new Map((exams || []).map(e => [e.id, e]));
          fullScoreAttempts.forEach(a => {
            const exam = examMap.get(a.exam_id);
            allCerts.push({
              title: exam?.title || "امتحان",
              subject: exam?.subject || "",
              submitted_at: a.submitted_at,
              student_name: studentName,
              type: "exam",
              score: `${a.score}/${a.total}`,
            });
          });
        }
      }

      // Sort by date descending
      allCerts.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
      setCertificates(allCerts);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const [viewCert, setViewCert] = useState<CertificateData | null>(null);

  const getCertHtml = (cert: CertificateData, forPrint = false) => {
    const achievementText = cert.type === "homework"
      ? `قد حصل/ت على الدرجة الكاملة <strong>(10/10)</strong> في واجب`
      : `قد حصل/ت على الدرجة النهائية <strong>(${cert.score})</strong> في امتحان`;

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>شهادة تفوق</title>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Kufi+Arabic:wght@400;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: ${forPrint ? '#f5f0e8' : 'transparent'}; }
          .certificate {
            width: 800px; height: 560px; background: white; position: relative; overflow: hidden;
            border: 3px solid #1a5c35; box-shadow: 0 0 0 8px #d4a843, 0 0 0 11px #1a5c35;
          }
          .inner-border { position: absolute; inset: 20px; border: 2px solid #d4a843; }
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
              ${achievementText}
              <span class="hw-name">"${cert.title}"</span>
              - مادة ${cert.subject}
            </div>
            <div class="date">بتاريخ: ${new Date(cert.submitted_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</div>
            <div class="footer">الأستاذ إسماعيل أحمد عبادة</div>
          </div>
        </div>
        ${forPrint ? '<script>window.onload = () => window.print();</script>' : ''}
      </body>
      </html>`;
  };

  const openCertWindow = (cert: CertificateData, autoPrint: boolean) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(getCertHtml(cert, autoPrint));
    w.document.close();
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
          <p className="text-sm text-muted-foreground">الشهادات التي حصلت عليها عند تحقيق الدرجة الكاملة في الواجبات والامتحانات</p>
        </div>

        {certificates.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold mb-1">لم تحصل على شهادات بعد</h3>
            <p className="text-sm text-muted-foreground">احصل على الدرجة الكاملة في أي واجب (10/10) أو امتحان (الدرجة النهائية) لتحصل على شهادة تفوق!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  cert.type === "exam" ? "bg-primary/10" : "bg-amber-500/10"
                }`}>
                  {cert.type === "exam" 
                    ? <FileText className="w-6 h-6 text-primary" />
                    : <Award className="w-6 h-6 text-amber-600" />
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{cert.title}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      cert.type === "exam" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"
                    }`}>
                      {cert.type === "exam" ? "امتحان" : "واجب"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{cert.subject} • {cert.score}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(cert.submitted_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="عرض" onClick={() => setViewCert(cert)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="طباعة" onClick={() => openCertWindow(cert, true)}>
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="تحميل PDF" onClick={() => openCertWindow(cert, false)}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Certificate Dialog */}
        <Dialog open={!!viewCert} onOpenChange={(o) => !o && setViewCert(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[850px] p-2 sm:p-4">
            <DialogHeader>
              <DialogTitle className="text-center font-amiri">شهادة تفوق</DialogTitle>
            </DialogHeader>
            {viewCert && (
              <div className="overflow-auto">
                <iframe
                  srcDoc={getCertHtml(viewCert, false)}
                  className="w-full border-0 rounded-lg"
                  style={{ height: '620px', minWidth: '320px' }}
                  title="شهادة تفوق"
                />
                <div className="flex justify-center gap-2 mt-3">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => openCertWindow(viewCert, true)}>
                    <Printer className="w-3 h-3" /> طباعة
                  </Button>
                  <Button size="sm" className="gap-1" onClick={() => openCertWindow(viewCert, false)}>
                    <Download className="w-3 h-3" /> تحميل PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Certificates;
